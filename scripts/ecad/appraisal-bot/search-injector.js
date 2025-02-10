console.log('Deed Link Enhancer: Search Injector script loaded!');

let searchClicked = false; // Flag to track if search button has been clicked

// Function to auto-fill the search field and click the search button
function autoFillAndSearch() {
  const params = new URLSearchParams(window.location.search);
  const docNumber = params.get('doc');

  if (docNumber) {
    console.log(`Auto-filling document number: ${docNumber}`);

    // Select the input field
    const inputField = document.querySelector('#field_DocumentNumberID');

    if (inputField) {
      inputField.value = docNumber;
      console.log('Document number inserted successfully!');

      // Wait a bit to ensure the field updates before clicking search
      setTimeout(() => {
        if (!searchClicked) {
          // Ensure this runs only once
          const searchButton = document.querySelector('#searchButton');
          if (searchButton) {
            console.log('Clicking the search button...');
            searchButton.click();
            searchClicked = true; // Set flag to prevent multiple clicks

            // Disconnect observer since task is complete
            observer.disconnect();
            console.log('MutationObserver disconnected.');
          } else {
            console.log('Search button not found!');
          }
        }
      }, 500);
    }
  }
}

// Observe the page for changes and apply the function when needed
const observer = new MutationObserver(() => {
  if (!searchClicked) {
    console.log('DOM changed, checking for search field...');
    autoFillAndSearch();
  }
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
autoFillAndSearch();
