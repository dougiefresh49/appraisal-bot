console.log('ECAD Sale History Injector: Content script loaded!');

// Get the APN from the URL query parameters
function getApnFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const parcelQuery = urlParams.get('query[parcel][strap]');
  return parcelQuery;
}

// Get the instrument number from the URL (passed from the background script)
function getInstrumentFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const instrumentQuery = urlParams.get('instrument');
  return instrumentQuery;
}

// Extract sale price from the sales history table
function extractSalePrice(instrumentNumber) {
  console.log('Looking for instrument number:', instrumentNumber);

  // Wait for the table to load
  const checkTable = setInterval(() => {
    const table = document.querySelector('table.grid2');
    if (!table) return;

    clearInterval(checkTable);
    console.log('Sales history table found');

    // Find the row with the matching instrument number
    const rows = table.querySelectorAll('tbody tr');
    let matchingRow = null;

    for (const row of rows) {
      const instrumentCell = row.querySelector('td:first-child');
      if (
        instrumentCell &&
        instrumentCell.textContent.includes(instrumentNumber)
      ) {
        matchingRow = row;
        break;
      }
    }

    if (matchingRow) {
      console.log('Found matching row for instrument:', instrumentNumber);

      // Extract the price from the Price column (7th column, index 6)
      const priceCell = matchingRow.querySelector('td:nth-child(7)');
      if (priceCell) {
        const price = priceCell.textContent.trim();
        console.log('Extracted sale price:', price);

        // Send the data back to the background script
        chrome.runtime.sendMessage({
          action: 'salePriceData',
          data: {
            instrumentNumber,
            salePrice: price,
            apn: getApnFromUrl(),
          },
        });
      } else {
        console.error('Price cell not found in matching row');
        chrome.runtime.sendMessage({
          action: 'salePriceData',
          data: {
            instrumentNumber,
            salePrice: 'Price not found',
            apn: getApnFromUrl(),
          },
        });
      }
    } else {
      console.log('No matching row found for instrument:', instrumentNumber);
      chrome.runtime.sendMessage({
        action: 'salePriceData',
        data: {
          instrumentNumber,
          salePrice: 'Instrument not found',
          apn: getApnFromUrl(),
        },
      });
    }
  }, 500);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkTable);
    console.error('Sales history table load timed out');
    chrome.runtime.sendMessage({
      action: 'salePriceData',
      data: {
        instrumentNumber,
        salePrice: 'Timeout loading table',
        apn: getApnFromUrl(),
      },
    });
  }, 10000);
}

// Start the extraction process
const instrumentNumber = getInstrumentFromUrl();
if (instrumentNumber) {
  console.log(
    'Starting sale price extraction for instrument:',
    instrumentNumber
  );
  extractSalePrice(instrumentNumber);
} else {
  console.error('No instrument number found in URL');
}
