chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const existingCookies = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === 'cookie'
    );

    if (existingCookies) {
      if (!existingCookies.value.includes('disclaimerAccepted=true')) {
        existingCookies.value += '; disclaimerAccepted=true';
      }
    } else {
      details.requestHeaders.push({
        name: 'Cookie',
        value: 'disclaimerAccepted=true',
        domain: 'ectorcountytx-web.tylerhost.net',
        path: '/',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString(), // 1 year
      });
    }

    return { requestHeaders: details.requestHeaders };
  },
  { urls: ['https://ectorcountytx-web.tylerhost.net/*'] },
  ['blocking', 'requestHeaders']
);

// Background script to handle deed search and data extraction
console.log('Deed Search Background Script loaded!');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchDeed') {
    console.log('Received deed search request:', request.instrument);
    searchDeed(request.instrument)
      .then((data) => {
        console.log('Sending back deed data:', data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error('Deed search failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function searchDeed(instrument) {
  const deedUrl = `https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1?doc=${instrument}`;

  try {
    // Fetch the search page
    const response = await fetch(deedUrl);
    const html = await response.text();

    // Create a temporary DOM to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the list item containing the instrument number
    const listItems = doc.querySelectorAll('.selfServiceSearchResultList li');
    const targetItem = Array.from(listItems).find((li) =>
      li.textContent.includes(instrument)
    );

    if (!targetItem) {
      throw new Error('Instrument not found in search results');
    }

    // Get the search result columns
    const columns = targetItem.querySelectorAll('.searchResultFourColumn');
    if (columns.length < 3) {
      throw new Error('Invalid search result format');
    }

    // Extract grantor and grantee
    const grantor = extractName(columns[1]);
    const grantee = extractName(columns[2]);

    return { grantor, grantee };
  } catch (error) {
    console.error('Error searching deed:', error);
    throw error;
  }
}

function extractName(column) {
  const nameElement = column.querySelector(
    '.selfServiceSearchResultCollapsed b'
  );
  return nameElement ? nameElement.textContent.trim() : null;
}
