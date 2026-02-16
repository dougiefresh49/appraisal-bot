console.log('ECAD Sale History Injector: Content script loaded!');

let isExtracting = false;
let hasExtracted = false;

/* MutationObserver to react to DOM changes */
const observer = new MutationObserver((mutations) => {
  if (isExtracting || hasExtracted) return;

  // Check if the table has appeared
  const table = document.querySelector('table.grid2');
  if (table && table.querySelector('tbody tr')) {
    console.log('Parcel search results table found');
    extractParcels();
  }
});

// Start observing the body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial check in case the table is already there
if (document.querySelector('table.grid2 tbody tr')) {
  console.log('Parcel search results table already present');
  extractParcels();
}

// Extract APN numbers from the parcel search results table
function extractParcels() {
  if (isExtracting || hasExtracted) return;
  isExtracting = true;

  const table = document.querySelector('table.grid2');
  if (!table) {
    isExtracting = false;
    return;
  }

  // Extract all Property IDs (APNs) from the first column
  const rows = table.querySelectorAll('tbody tr');
  const parcels = [];

  rows.forEach((row) => {
    // The Property ID is in the first column, inside an <a> tag
    const propertyIdCell = row.querySelector('td:first-child');
    if (propertyIdCell) {
      const link = propertyIdCell.querySelector('a[href^="/parcels/"]');
      if (link) {
        // Extract APN from the link text
        const apn = link.textContent.trim();
        if (apn) {
          parcels.push(apn);
          console.log('Found parcel:', apn);
        }
      }
    }
  });

  if (parcels.length > 0) {
    console.log('Extracted parcels:', parcels);
    hasExtracted = true;

    // Send the data back to the background script
    chrome.runtime.sendMessage({
      action: 'parcelsFromAdvSearch',
      data: {
        parcels,
      },
    });
  } else {
    console.log('No parcels found in table');
    chrome.runtime.sendMessage({
      action: 'parcelsFromAdvSearch',
      data: {
        parcels: [],
      },
    });
  }

  isExtracting = false;
}
