// Import context menu functionality
import './context-menu.js';

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked, opening side panel');

  // Open the side panel
  await chrome.sidePanel.open({ tabId: tab.id });

  // Set the side panel to show our extension
  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: './sidepanel/sidepanel.html',
    enabled: true,
  });
});

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

  // TODO: fix this when updating to Midland GIS autofil
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
    console.log('Received deed search request:', request.deedUrl);
    searchDeed(request.deedUrl, sender)
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
  } else if (request.action === 'getParcelsFromAdvSearch') {
    console.log('Received parcels request from adv search:', request);
    getParcelsFromAdvSearch(request.instrumentNumber, sender)
      .then((data) => {
        console.log('Sending back parcels data from adv search:', data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error('Parcels from adv search failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'parcelsFromAdvSearch') {
    console.log(
      'Received parcels data from adv-search-injector:',
      request.data
    );
    if (request.data && typeof request.data === 'object') {
      chrome.storage.local.set({ parcelsFromAdvSearch: request.data }, () => {
        console.log('Parcels data from adv search stored successfully');
      });
    } else {
      console.error(
        'Invalid parcels data from adv search received:',
        request.data
      );
    }
  } else if (request.action === 'debuggerAttach') {
    const tabId = request.tabId || sender.tab.id;
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        console.error('Debugger attach failed:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Debugger attached to tab', tabId);
        sendResponse({ success: true });
      }
    });
    return true;
  } else if (request.action === 'debuggerDetach') {
    const tabId = request.tabId || sender.tab.id;
    chrome.debugger.detach({ tabId }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Debugger detach warning:', chrome.runtime.lastError.message);
      } else {
        console.log('Debugger detached from tab', tabId);
      }
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'printToPdf') {
    const tabId = request.tabId || sender.tab.id;
    const filename = request.filename || 'listing.pdf';
    chrome.debugger.sendCommand({ tabId }, 'Page.printToPDF', {
      printBackground: true,
      landscape: false,
      preferCSSPageSize: true,
      marginTop: 0.4,
      marginBottom: 0.4,
      marginLeft: 0.4,
      marginRight: 0.4,
    }, (result) => {
      if (chrome.runtime.lastError || !result || !result.data) {
        const errMsg = chrome.runtime.lastError
          ? chrome.runtime.lastError.message
          : 'No PDF data returned';
        console.error('printToPDF failed:', errMsg);
        sendResponse({ success: false, error: errMsg });
        return;
      }
      const dataUrl = 'data:application/pdf;base64,' + result.data;
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false,
        conflictAction: 'uniquify',
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('PDF saved, download ID:', downloadId, 'filename:', filename);
          sendResponse({ success: true, downloadId });
        }
      });
    });
    return true;
  }
});

async function searchDeed(deedUrl, sender) {
  return new Promise((resolve, reject) => {
    console.log('Starting deed search for deedUrl:', deedUrl);

    // Create a new tab for the search
    chrome.tabs.create(
      {
        url: deedUrl,
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

async function getParcelsFromAdvSearch(instrumentNumber, sender) {
  return new Promise((resolve, reject) => {
    console.log(
      'Starting parcels search from adv search for Instrument:',
      instrumentNumber
    );

    // Create the adv search URL (same as the advSearchUrl in ecad-injector.js)
    const advSearchUrl = `https://search.ectorcad.org/search/adv?query[sale][instr_num]=${instrumentNumber}&type=r`;

    chrome.tabs.create(
      {
        url: advSearchUrl,
        active: false,
      },
      (tab) => {
        console.log('Created adv search tab:', tab.id);

        const checkData = setInterval(() => {
          chrome.storage.local.get('parcelsFromAdvSearch', (result) => {
            if (result.parcelsFromAdvSearch) {
              console.log(
                'Found parcels data from adv search:',
                result.parcelsFromAdvSearch
              );
              clearInterval(checkData);
              chrome.storage.local.remove('parcelsFromAdvSearch'); // Clean up
              resolve(result.parcelsFromAdvSearch);

              // Close the tab
              console.log('Closing adv search tab:', tab.id);
              chrome.tabs.remove(tab.id);
            }
          });
        }, 500);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkData);
          reject(
            new Error('Parcels data from adv search not found after 30 seconds')
          );

          // Close the tab
          console.log('Closing adv search tab:', tab.id);
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
