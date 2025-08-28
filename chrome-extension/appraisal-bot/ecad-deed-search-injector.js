console.log('ECAD Deed Search Injector: Content script loaded!');

// Extract sale price and parcel information from the deed search results table
function extractSalePriceAndParcels() {
  console.log('Looking for sale price and parcel information...');

  // Wait for the table to load
  const checkTable = setInterval(() => {
    const table = document.querySelector('table.grid2');
    if (!table) return;

    clearInterval(checkTable);
    console.log('Deed search results table found');

    // Find all rows in the table body
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) {
      console.log('No rows found in table');
      sendData('No data found', []);
      return;
    }

    console.log(`Found ${rows.length} parcel(s)`);

    let salePrice = null;
    const parcels = [];

    // Process each row to extract parcel IDs and look for sale price
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 8) {
        // Ensure we have enough columns
        // Extract Property ID (1st column)
        const propertyIdCell = cells[0];
        const propertyIdLink = propertyIdCell.querySelector('a');
        if (propertyIdLink) {
          const parcelId = propertyIdLink.textContent.trim();
          parcels.push(parcelId);
          console.log(`Found parcel: ${parcelId}`);
        }

        // Extract Last Sale Price (7th column, index 6)
        const salePriceCell = cells[6];
        const salePriceText = salePriceCell.textContent.trim();

        // If this is the first row with a sale price, use it
        if (!salePrice && salePriceText && salePriceText !== '') {
          salePrice = salePriceText;
          console.log(`Found sale price: ${salePrice}`);
        }
      }
    });

    // If no sale price found in the table, try to get it from the first row
    if (!salePrice && rows.length > 0) {
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('td');
      if (cells.length >= 7) {
        const salePriceCell = cells[6];
        const salePriceText = salePriceCell.textContent.trim();
        if (salePriceText && salePriceText !== '') {
          salePrice = salePriceText;
          console.log(`Found sale price from first row: ${salePrice}`);
        }
      }
    }

    // Send the data back to the background script
    sendData(salePrice || 'No sale price found', parcels);
  }, 500);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkTable);
    console.error('Deed search results table load timed out');
    sendData('Timeout loading table', []);
  }, 10000);
}

function sendData(salePrice, parcels) {
  console.log('Sending data to background script:', { salePrice, parcels });

  chrome.runtime.sendMessage({
    action: 'salePriceDataFromDeedSearch',
    data: {
      salePrice,
      parcels,
    },
  });
}

// Start the extraction process
extractSalePriceAndParcels();
