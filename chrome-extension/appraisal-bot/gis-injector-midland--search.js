console.log('📍 Midland GIS Injector: Script loaded!');

let isSplashHidden = false;
let isAppStatePopupHidden = false;

// Utility to hide an element by id
function hideElementById(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'none';
    console.log(`[AppraisalBot] Hid element: #${id}`);
    return true;
  }
  return false;
}

// Try to hide splash and app state popups immediately
if (!isSplashHidden) {
  isSplashHidden = hideElementById('widgets_Splash_Widget_14');
}
if (!isAppStatePopupHidden) {
  isAppStatePopupHidden = hideElementById('jimu_dijit_AppStatePopup_0');
}

// Also observe DOM for dynamic addition
const styleObserver = new MutationObserver(() => {
  if (!isSplashHidden) {
    isSplashHidden = hideElementById('widgets_Splash_Widget_14');
  }
  if (!isAppStatePopupHidden) {
    isAppStatePopupHidden = hideElementById('jimu_dijit_AppStatePopup_0');
  }
});
styleObserver.observe(document.body, { childList: true, subtree: true });

// Extract parcel ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const parcelId = urlParams.get('apn');

if (parcelId) {
  console.log(`🔍 Waiting for GIS map to load for parcel: ${parcelId}`);

  function searchGIS() {
    const parcelButton = document.querySelector('div[title="Parcel"]');

    if (parcelButton) {
      console.log('✅ GIS map loaded! Automating search...');

      // Click "Parcel" search button
      parcelButton.click();
      setTimeout(() => {
        const searchContainer = document.querySelector('#_8');
        const searchInput = searchContainer.querySelector('.searchInput');
        const searchButton = searchContainer.querySelector(
          '.searchBtn.searchSubmit'
        );
        // Fill in the search input
        searchInput.value = parcelId;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
          // Click the search button
          searchButton.click();
          console.log('✅ GIS search submitted!');
          parcelButton.click();
        }, 500);
      }, 1000);
    } else {
      console.log('❌ GIS search elements not found, retrying...');
      setTimeout(searchGIS, 1000); // Retry every second if elements aren't found yet
    }
  }

  // MutationObserver to wait for the map to load
  const observer = new MutationObserver(() => {
    const mapLoaded = document.querySelector('.jimu-widget-search'); // Check if the search box exists
    if (mapLoaded) {
      console.log('✅ GIS map detected, starting search...');
      observer.disconnect(); // Stop observing once the map is ready
      searchGIS();
    }
  });

  // Observe changes in the document body
  observer.observe(document.body, { childList: true, subtree: true });
}
