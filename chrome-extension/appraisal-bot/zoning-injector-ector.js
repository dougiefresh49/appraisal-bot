// ECAD Zoning Injector: Auto-search address from URL param
(function () {
  function waitForSplashAndHide(callback) {
    const maxAttempts = 50; // 100ms * 50 = 5 seconds
    let attempts = 0;
    function poll() {
      const splash = document.getElementById('widgets_Splash_Widget_30');
      if (splash) {
        splash.style.display = 'none';
        callback();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 100);
      } else {
        callback(); // Proceed anyway after timeout
      }
    }
    poll();
  }

  function getAddressFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const addr = params.get('addr');
    return addr ? decodeURIComponent(addr) : '';
  }

  function pollAndClickAddressSearchButton(callback) {
    const maxAttempts = 50; // 5 seconds
    let attempts = 0;
    function poll() {
      const btn = document.querySelector(
        '#uniqName_14_2 > div.icon-item.icon-item-background2.dockable'
      );
      if (btn) {
        console.log('[AppraisalBot] Address search button found (polling).');
        btn.click();
        callback();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 100);
      } else {
        console.log(
          '[AppraisalBot] Address search button not found after polling. Aborting.'
        );
      }
    }
    poll();
  }

  function fillAndSubmitSearch(address) {
    const input = document.getElementById('esri_dijit_Search_1_input');
    if (input) {
      input.value = address;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const searchBtn = document.querySelector(
      '#esri_dijit_Search_1 > div > div.searchBtn.searchSubmit'
    );
    if (searchBtn) searchBtn.click();
  }

  // --- Zoning extraction logic ---
  function waitForAddressBubble(callback) {
    const maxAttempts = 50;
    let attempts = 0;
    function poll() {
      const bubble = document.querySelector(
        '#map_root > div.esriPopup.esriPopupVisible'
      );
      if (bubble) {
        console.log('[AppraisalBot] Address bubble found.');
        callback(bubble);
      } else if (attempts < maxAttempts) {
        console.log(
          `[AppraisalBot] Address bubble not found. Attempt ${
            attempts + 1
          } of ${maxAttempts}`
        );
        attempts++;
        setTimeout(poll, 100);
      }
    }
    poll();
  }

  function clickPin() {
    const pin = document.querySelector('#graphicsLayer3_layer > image');
    if (!pin) {
      console.log('[AppraisalBot] Pin not found.');
      return;
    }
    const pinRect = pin.getBoundingClientRect();
    const x = pinRect.left + pinRect.width / 2;
    const y = pinRect.top + pinRect.height / 2;
    console.log('[AppraisalBot] Clicking pin at:', x, y);
    const eventTypes = [
      'pointerdown',
      'mousedown',
      'mouseup',
      'pointerup',
      'click',
    ];
    for (const type of eventTypes) {
      const evt = new MouseEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
      });
      pin.dispatchEvent(evt);
    }
  }

  function extractZoningFromPopup() {
    const popup = document.querySelector(
      '#map_root > div.esriPopup.esriPopupVisible'
    );
    if (!popup) {
      console.log('[AppraisalBot] Zoning popup not found.');
      return null;
    }
    const rows = popup.querySelectorAll('table.attrTable tr');
    let classification = null,
      description = null;
    rows.forEach((row) => {
      const tds = row.querySelectorAll('td');
      if (tds.length === 2) {
        if (tds[0].textContent.includes('Zoning Classification'))
          classification = tds[1].textContent.trim();
        if (tds[0].textContent.includes('Zone Description'))
          description = tds[1].textContent.trim();
      }
    });
    if (classification && description) {
      return { classification, description };
    }
    return null;
  }

  function tryExtractZoningPopup(attempt = 0, maxAttempts = 5) {
    const result = extractZoningFromPopup();
    if (result) {
      console.log('[AppraisalBot] Extracted zoning:', result);
      // Send zoning data to background script
      chrome.runtime.sendMessage(
        {
          action: 'zoningData',
          data: result,
        },
        () => {
          console.log('[AppraisalBot] Sent zoning data to background.');
        }
      );
      return;
    }
    // Try next popup if available
    const nextBtn = document.querySelector(
      '#map_root > div.esriPopup.esriPopupVisible .titleButton.next'
    );
    if (
      nextBtn &&
      !nextBtn.classList.contains('hidden') &&
      attempt < maxAttempts
    ) {
      nextBtn.click();
      setTimeout(() => tryExtractZoningPopup(attempt + 1, maxAttempts), 400);
    } else {
      console.log('[AppraisalBot] Zoning not found in popups.');
    }
  }

  function afterSearch() {
    waitForAddressBubble((bubble) => {
      setTimeout(() => {
        clickPin();
        setTimeout(() => {
          tryExtractZoningPopup();
        }, 800);
      }, 800);
    });
  }

  function tryInject() {
    waitForSplashAndHide(() => {
      const address = getAddressFromQuery();
      if (!address) return;
      pollAndClickAddressSearchButton(() => {
        setTimeout(() => {
          fillAndSubmitSearch(address);
          setTimeout(afterSearch, 1500);
        }, 500);
      });
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }
})();
