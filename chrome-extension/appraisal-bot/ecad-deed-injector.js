console.log('ECAD Deed Link Injector: Search Injector script loaded!');

let searchClicked = false; // Flag to track if search button has been clicked
let instrumentNumber = ''; // Store the instrument number for later use

// Check if we need to continue from a previous state
chrome.storage.local.get(['searchState'], (result) => {
  if (result.searchState) {
    console.log('Resuming from previous state:', result.searchState);
    instrumentNumber = result.searchState.instrumentNumber;

    if (result.searchState.stage === 'recordingInfo') {
      console.log('Continuing to watch for recording information...');
      watchForRecordingInfo();
    }
  } else {
    // Initial run in case the element is already there
    autoFillAndSearch();
  }
});

// Function to auto-fill the search field and click the search button
function autoFillAndSearch() {
  const params = new URLSearchParams(window.location.search);
  const instrumentNumber = params.get('doc');
  const volume = params.get('volume');
  const page = params.get('page');

  if (!!instrumentNumber) {
    console.log(`Auto-filling document number: ${instrumentNumber}`);

    // Select the input field
    const inputField = document.querySelector('#field_DocumentNumberID');

    if (inputField) {
      inputField.value = instrumentNumber;
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

            // Start watching for results
            watchForResults();
          } else {
            console.log('Search button not found!');
          }
        }
      }, 500);
    }
  } else if (volume && page) {
    console.log(`Auto-filling volume: ${volume}, page: ${page}`);
    const volumeField = document.getElementById('field_BookPageID_DOT_Volume');
    const pageField = document.getElementById('field_BookPageID_DOT_Page');
    if (volumeField && pageField) {
      volumeField.value = volume;
      pageField.value = page;
      console.log('Volume and page inserted successfully!');
      setTimeout(() => {
        if (!searchClicked) {
          const searchButton = document.querySelector('#searchButton');
          if (searchButton) {
            console.log('Clicking the search button for volume/page...');
            searchButton.click();
            searchClicked = true;
            watchForResults();
          } else {
            console.log('Search button not found!');
          }
        }
      }, 500);
    } else {
      console.log('Volume or page field not found!');
    }
  }
}

function watchForResults() {
  console.log('Watching for search results...');

  const checkResults = setInterval(() => {
    const listItems = document.querySelectorAll(
      '.selfServiceSearchResultList li'
    );
    const targetItem = Array.from(listItems).find((li) =>
      li.textContent.includes(instrumentNumber)
    );

    if (targetItem) {
      console.log('Found target item, clicking to view full result...');
      clearInterval(checkResults);
      targetItem.click();

      // Start watching for full result page
      watchForFullResult();
    }
  }, 500);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkResults);
    console.error('Search results not found after 10 seconds');
  }, 10000);
}

function watchForFullResult() {
  console.log('Watching for full result page...');

  const checkFullResult = setInterval(() => {
    const fullResult = document.querySelector(
      '.selfServiceSearchFullResult.selfServiceSearchResultNavigation'
    );
    if (fullResult) {
      console.log('Full result page loaded, clicking to view details...');
      clearInterval(checkFullResult);

      // Store state before navigation
      chrome.storage.local.set({
        searchState: {
          instrumentNumber,
          stage: 'recordingInfo',
        },
      });

      // Click the full result link
      fullResult.click();
    }
  }, 500);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkFullResult);
    console.error('Full result page not found after 10 seconds');
  }, 10000);
}

function watchForRecordingInfo() {
  console.log('Watching for recording information...');

  const checkRecordingInfo = setInterval(() => {
    // Find all utility box elements
    const utilityBoxes = document.querySelectorAll('.ss-utility-box-vertical');
    console.log('Found utility boxes:', utilityBoxes.length);

    // Find the one with Recording Information
    const recordingInfoBox = Array.from(utilityBoxes).find((box) => {
      const heading = box.querySelector('.ui-li-divider');
      return heading && heading.textContent.includes('Names');
    });

    if (recordingInfoBox) {
      console.log('Found recording information box');
      clearInterval(checkRecordingInfo);

      // Get the next li after the heading
      const infoLi = recordingInfoBox.querySelector('.ui-li-static');
      if (infoLi) {
        console.log('Found recording information li');

        // Extract the data from the table
        const table = infoLi.querySelector('table');
        if (table) {
          console.log('Found recording information table');
          const rows = table.querySelectorAll('tr');
          const data = {};

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
              const label = cell
                .querySelector('strong')
                ?.textContent.trim()
                .replace(':', '')
                .toLowerCase();
              const value = cell
                .querySelector('div:not(:has(strong))')
                ?.textContent.trim();
              if (label && value) {
                data[label] = value;
              }
            });
          });

          console.log('Extracted data:', data);

          // Clear the stored state
          chrome.storage.local.remove(['searchState']);

          // Send the data back to the background script
          chrome.runtime.sendMessage({
            action: 'deedData',
            data: data,
          });
        } else {
          console.error('Recording information table not found');
        }
      } else {
        console.error('Recording information li not found');
      }
    } else {
      console.log('Recording information box not found yet');
    }
  }, 500);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkRecordingInfo);
    console.error('Recording information not found after 10 seconds');
  }, 10000);
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
