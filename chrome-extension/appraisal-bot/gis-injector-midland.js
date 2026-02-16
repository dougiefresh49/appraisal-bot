console.log('📍 Midland GIS Injector: Script loaded!');

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
