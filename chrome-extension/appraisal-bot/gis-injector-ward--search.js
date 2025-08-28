console.log('📍 Ward GIS Injector: Script loaded!');

let isSplashHidden = false;

function hideElementById(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'none';
    console.log(`[AppraisalBot] Hid element: #${id}`);
    return true;
  }
  return false;
}

if (!isSplashHidden) {
  isSplashHidden = hideElementById('widgets_Splash_Widget_14');
}

const styleObserver = new MutationObserver(() => {
  if (!isSplashHidden) {
    isSplashHidden = hideElementById('widgets_Splash_Widget_14');
  }
});
styleObserver.observe(document.body, { childList: true, subtree: true });

function extractParcelIdFromPopup(popup) {
  // Try header first: Parcel:6829 Owner: ...
  const header = popup.querySelector('.header');
  if (header) {
    const match = header.textContent.match(/Parcel:(\d+)/);
    if (match) return match[1];
  }
  // Fallback: look for <b>Parcels ID:</b> 6829
  const bTags = popup.querySelectorAll('b');
  for (const b of bTags) {
    if (b.textContent.trim() === 'Parcels ID:') {
      // The Parcel ID is usually in the nextSibling text node
      const next = b.nextSibling;
      if (next && next.textContent) {
        const id = next.textContent.match(/\d+/);
        if (id) return id[0];
      }
    }
  }
  return null;
}

function injectWardCadLink() {
  const popup = document.querySelector('.esriPopupWrapper');
  if (!popup) return;

  // Avoid duplicate links
  if (popup.querySelector('.ward-cad-link')) return;

  const parcelId = extractParcelIdFromPopup(popup);
  if (!parcelId) {
    console.log('[AppraisalBot] Parcel ID not found in popup.');
    return;
  }

  // Find the <b>Parcels ID:</b> element
  const bTags = popup.querySelectorAll('b');
  let inserted = false;
  for (const b of bTags) {
    if (b.textContent.trim() === 'Parcels ID:') {
      // Insert the link after the Parcel ID text
      const link = document.createElement('a');
      link.href = `https://www.wardcad.org/Home/Details?parcelId=${parcelId}`;
      link.target = '_blank';
      link.className = 'ward-cad-link';
      link.style =
        'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
      link.textContent = '[View in CAD]';
      // Insert after the Parcel ID text node
      const next = b.nextSibling;
      if (next) {
        b.parentNode.insertBefore(link, next.nextSibling);
        inserted = true;
        break;
      }
    }
  }
  // Fallback: insert at the top if not found
  if (!inserted) {
    const contentPane = popup.querySelector('.contentPane');
    if (contentPane) {
      const link = document.createElement('a');
      link.href = `https://www.wardcad.org/Home/Details?parcelId=${parcelId}`;
      link.target = '_blank';
      link.className = 'ward-cad-link';
      link.style =
        'color: #0044cc; font-weight: bold; text-decoration: underline; display: block; margin-bottom: 8px;';
      link.textContent = '[View in CAD]';
      contentPane.insertBefore(link, contentPane.firstChild);
    }
  }
  console.log(`[AppraisalBot] Injected CAD link for parcel ${parcelId}`);
}

// Observe for popup changes
const popupObserver = new MutationObserver(() => {
  injectWardCadLink();
});

// Start observing the body for popup changes
popupObserver.observe(document.body, { childList: true, subtree: true });
