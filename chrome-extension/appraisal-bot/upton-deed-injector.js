// Upton Deed Injector: Auto-search by doc param
(function () {
  function getDocFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('doc');
  }

  function waitForElement(selector, maxAttempts = 50, interval = 100) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      function poll() {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (++attempts >= maxAttempts)
          return reject('Element not found: ' + selector);
        setTimeout(poll, interval);
      }
      poll();
    });
  }

  async function autoSearchDeed() {
    const doc = getDocFromQuery();
    if (!doc) return;
    console.log('[AppraisalBot] Upton Deed Injector: doc param found:', doc);
    try {
      // Wait for dropdown
      const select = await waitForElement(
        '#SearchCriteriaName1_DDL_SearchName'
      );
      select.value = 'Real Property Document Search';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[AppraisalBot] Set search type to Document Search');
      // Wait for input
      const input = await waitForElement('#SearchFormEx1_ACSTextBox_Document');
      input.value = doc;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[AppraisalBot] Set doc number:', doc);
      // Wait for button
      const btn = await waitForElement('#SearchFormEx1_btnSearch');
      btn.click();
      console.log('[AppraisalBot] Clicked search button');
    } catch (e) {
      console.error('[AppraisalBot] Upton Deed Injector error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoSearchDeed);
  } else {
    autoSearchDeed();
  }
})();
