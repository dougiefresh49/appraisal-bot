console.log('Midland Deed Link Injector: Script loaded!');

function ensureInstrumentHasYear(instrumentNumber, deedDate) {
  // Check if the instrument already has a year prefix
  if (/^\d{4}-\d+$/.test(instrumentNumber)) {
    return instrumentNumber; // Already correctly formatted
  }

  // Extract year from deed date (format: M/D/YYYY)
  const dateParts = deedDate.split('/');
  if (dateParts.length === 3) {
    const year = dateParts[2].trim();
    return `${year}-${instrumentNumber}`;
  }

  console.log(`⚠️ Could not extract year for instrument: ${instrumentNumber}`);
  return instrumentNumber; // Return as-is if no valid year found
}

function updateMidlandDeedLinks() {
  // Select the Deed History table using its known attributes
  const deedTable = document.querySelector(
    'table.propertyDetails[summary="Deed History"]'
  );
  if (!deedTable) {
    console.log('❌ No deed history table found. Exiting...');
    return;
  }

  // Find the indexes of the "Deed Date" and "Instrument" columns
  const headers = deedTable.querySelectorAll('th');
  let deedDateIndex = -1;
  let instrumentIndex = -1;

  headers.forEach((header, index) => {
    const text = header.textContent.trim().toLowerCase();
    if (text.includes('deed date')) deedDateIndex = index;
    if (text.includes('instrument')) instrumentIndex = index;
  });

  if (instrumentIndex === -1 || deedDateIndex === -1) {
    console.log("❌ Could not find both 'Deed Date' and 'Instrument' columns.");
    return;
  }

  console.log(
    `🔍 Found 'Deed Date' at index ${deedDateIndex}, 'Instrument' at index ${instrumentIndex}`
  );

  // Iterate over rows in the table (skip header row)
  const rows = deedTable.querySelectorAll('tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length > instrumentIndex && cells.length > deedDateIndex) {
      const deedDate = cells[deedDateIndex].textContent.trim();
      const instrumentCell = cells[instrumentIndex];
      let instrumentNumber = instrumentCell.textContent.trim();

      // Ensure we don’t modify it multiple times
      if (instrumentCell.querySelector('a')) {
        console.log(`🔵 Link for ${instrumentNumber} already exists.`);
        return;
      }

      // Correct instrument format
      const formattedInstrument = ensureInstrumentHasYear(
        instrumentNumber,
        deedDate
      );

      console.log(`📌 Found Deed Instrument: ${formattedInstrument}`);

      // Construct the Midland County deed search URL
      const deedUrl = `https://midland.tx.publicsearch.us/results?department=RP&keywordSearch=false&searchOcrText=false&searchType=quickSearch&searchValue=${formattedInstrument}`;

      // Create the link element
      const deedLink = document.createElement('a');
      deedLink.href = deedUrl;
      deedLink.target = '_blank';
      deedLink.className = 'midland-deed-link';
      deedLink.style =
        'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
      deedLink.textContent = '[View Deed]';

      // Replace text with a clickable link
      instrumentCell.innerHTML = `${formattedInstrument} `;
      instrumentCell.appendChild(deedLink);
      console.log('✅ Deed link added successfully!');
    }
  });
}

// Observer to wait for deed history table to load dynamically
const observer = new MutationObserver(() => {
  console.log('🔄 DOM changed, checking for Deed History table...');
  updateMidlandDeedLinks();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateMidlandDeedLinks();
