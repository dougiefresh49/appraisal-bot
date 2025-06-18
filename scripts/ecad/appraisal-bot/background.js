// Import context menu functionality
import './context-menu.js';

// Set persistent cookies for Ector County disclaimer and Midland GIS splash
function setPersistentCookies() {
  // Ector County disclaimer cookie
  chrome.cookies.set(
    {
      url: 'https://ectorcountytx-web.tylerhost.net/',
      name: 'disclaimerAccepted',
      value: 'true',
      path: '/',
      expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 365, // 1 year
    },
    (cookie) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to set Ector disclaimer cookie:',
          chrome.runtime.lastError
        );
      } else {
        console.log('Ector disclaimer cookie set:', cookie);
      }
    }
  );

  // Midland GIS splash cookie
  chrome.cookies.set(
    {
      url: 'https://maps.midlandtexas.gov/',
      name: 'isfirst_3cce4985d5f94f1c8c5d0ea06e1e5b47',
      value: 'false',
      path: '/',
      expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 365, // 1 year
    },
    (cookie) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to set Midland GIS splash cookie:',
          chrome.runtime.lastError
        );
      } else {
        console.log('Midland GIS splash cookie set:', cookie);
      }
    }
  );
}

// Set cookies on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  setPersistentCookies();
});

// Set cookies on extension startup
chrome.runtime.onStartup.addListener(() => {
  setPersistentCookies();
});

// Background script to handle deed search and data extraction
console.log('Deed Search Background Script loaded!');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchDeed') {
    console.log('Received deed search request:', request.instrument);
    searchDeed(request.instrument, sender)
      .then((data) => {
        console.log('Sending back deed data:', data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error('Deed search failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'deedData') {
    console.log('Received deed data from search-injector:', request.data);
    // Store the data for the content script to retrieve
    chrome.storage.local.set({ deedData: request.data }, () => {
      console.log('Deed data stored successfully');
    });
  } else if (request.action === 'getZoning') {
    console.log('Received zoning request:', request.address);
    getZoning(request.address, sender)
      .then((data) => {
        console.log('Sending back zoning data:', data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error('Zoning search failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'zoningData') {
    console.log('Received zoning data from zoning-injector:', request.data);
    if (request.data && typeof request.data === 'object') {
      chrome.storage.local.set({ zoningData: request.data }, () => {
        console.log('Zoning data stored successfully');
      });
    } else {
      console.error('Invalid zoning data received:', request.data);
    }
  }
});

async function searchDeed(instrument, sender) {
  return new Promise((resolve, reject) => {
    console.log('Starting deed search for instrument:', instrument);

    // Create a new tab for the search
    chrome.tabs.create(
      {
        url: `https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1?doc=${instrument}`,
        active: false,
        // index: sender.tab.index + 1,
      },
      (tab) => {
        console.log('Created search tab:', tab.id);

        // Wait for the data to be stored
        const checkData = setInterval(() => {
          chrome.storage.local.get('deedData', (result) => {
            if (result.deedData) {
              console.log('Found deed data:', result.deedData);
              clearInterval(checkData);
              chrome.storage.local.remove('deedData'); // Clean up
              resolve(result.deedData);

              // Close the tab
              console.log('Closing search tab:', tab.id);
              chrome.tabs.remove(tab.id);
            }
          });
        }, 500);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkData);
          reject(new Error('Deed data not found after 30 seconds'));

          // Close the tab
          console.log('Closing search tab:', tab.id);
          chrome.tabs.remove(tab.id);
        }, 30000);
      }
    );
  });
}

async function getZoning(address, sender) {
  return new Promise((resolve, reject) => {
    console.log('Starting zoning search for address:', address);
    const url = `https://www.arcgis.com/apps/webappviewer/index.html?id=0264ff5463fa42a6b7ead58e42a46541&addr=${encodeURIComponent(
      address
    )}`;
    chrome.tabs.create(
      {
        url,
        active: false,
      },
      (tab) => {
        console.log('Created zoning tab:', tab.id);
        const checkData = setInterval(() => {
          chrome.storage.local.get('zoningData', (result) => {
            if (result.zoningData) {
              console.log('Found zoning data:', result.zoningData);
              clearInterval(checkData);
              chrome.storage.local.remove('zoningData');
              resolve(result.zoningData);
              // Close the tab
              console.log('Closing zoning tab:', tab.id);
              chrome.tabs.remove(tab.id);
            }
          });
        }, 500);
        setTimeout(() => {
          clearInterval(checkData);
          reject(new Error('Zoning data not found after 30 seconds'));
          // Close the tab
          console.log('Closing zoning tab:', tab.id);
          chrome.tabs.remove(tab.id);
        }, 30000);
      }
    );
  });
}

function performSearch(instrument) {
  return new Promise((resolve) => {
    console.log('Performing search for instrument:', instrument);

    // Function to check for search results
    function checkForResults() {
      const listItems = document.querySelectorAll(
        '.selfServiceSearchResultList li'
      );
      const targetItem = Array.from(listItems).find((li) =>
        li.textContent.includes(instrument)
      );

      if (targetItem) {
        console.log('Found target item, clicking to view full result...');
        targetItem.click();

        // Wait for the full result page to load
        const checkFullResult = setInterval(() => {
          const fullResult = document.querySelector(
            '.selfServiceSearchFullResult.selfServiceSearchResultNavigation'
          );
          if (fullResult) {
            console.log('Full result page loaded, extracting data...');
            clearInterval(checkFullResult);

            // Extract the data from the full result page
            const recordingInfo = document.querySelector(
              '.ss-utility-box-vertical'
            );
            if (recordingInfo) {
              const rows = recordingInfo.querySelectorAll('tr');
              const data = {};

              rows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell) => {
                  const label = cell
                    .querySelector('strong')
                    ?.textContent.trim();
                  const value = cell
                    .querySelector('div:not(:has(strong))')
                    ?.textContent.trim();
                  if (label && value) {
                    data[label.replace(':', '')] = value;
                  }
                });
              });

              console.log('Extracted data:', data);
              resolve({ success: true, data });
            } else {
              console.error('Recording information not found');
              resolve({
                success: false,
                error: 'Recording information not found',
              });
            }
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkFullResult);
          resolve({ success: false, error: 'Full result page load timed out' });
        }, 10000);

        return true;
      }
      return false;
    }

    // Function to fill and submit the form
    function fillAndSubmitForm() {
      console.log('Filling and submitting form...');
      const inputField = document.querySelector('#field_DocumentNumberID');
      const searchButton = document.querySelector('#searchButton');

      if (inputField && searchButton) {
        console.log('Found form elements, filling...');
        inputField.value = instrument;
        searchButton.click();
        console.log('Form submitted');

        // Start checking for results
        const checkInterval = setInterval(() => {
          if (checkForResults()) {
            console.log('Results found, clearing interval');
            clearInterval(checkInterval);
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          console.error('Search timed out after 10 seconds');
          clearInterval(checkInterval);
          resolve({ success: false, error: 'Search timed out' });
        }, 10000);
      } else {
        console.error('Form elements not found:', { inputField, searchButton });
        resolve({ success: false, error: 'Search form not found' });
      }
    }

    // Start the process
    fillAndSubmitForm();
  });
}

function extractName(column) {
  const nameElement = column.querySelector(
    '.selfServiceSearchResultCollapsed b'
  );
  return nameElement ? nameElement.textContent.trim() : null;
}
