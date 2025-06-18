console.log('Midland Deed Link Injector: Script loaded!');
let didAddDeedLink = false;
let hasObserved = false;
let apn = null;
let gisUrl = null;
const GIS_BASE_URL =
  'https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=';

function addMidlandGISLink() {
  console.log('🔄 Adding Midland GIS link...');
  // Select the APN (Property ID) element
  const apnElement = document.getElementById('ucidentification_webprop_id');
  if (!apnElement) {
    console.log('❌ APN (Property ID) element not found.');
    return;
  }

  apn = apnElement.textContent.trim();
  if (!apn) {
    console.log('⚠️ APN is empty.');
    return;
  }

  const { situsEl, situs } = getSitusElement();
  updatePageMetadataTitle(apn, situs);

  // Check if GIS link already exists
  if (document.querySelector('.midland-gis-link')) {
    console.log('🔵 GIS link already added.');
    return;
  }

  console.log(`📌 Found APN: ${apn}`);

  // Create GIS search URL
  gisUrl = `${GIS_BASE_URL}${apn}`;

  if (!!situsEl) {
    linkAddressToGoogleMaps(apnElement, situs, `margin-left: 8px;`);
  }
  addLinkElement(
    apnElement,
    gisUrl,
    '[GIS]',
    'midland-gis-link',
    `margin-left: 8px;`
  );
  console.log('✅ GIS link added successfully!');
  return { gisUrl, apn };
}

function getSitusElement() {
  const situsEl = document.getElementById('webprop_situs');
  if (!situsEl) {
    console.log('❌ Situs element not found.');
    return null;
  }

  const situsText = situsEl.textContent.trim();
  const situsValue = situsText.replace('Situs:', '').trim();

  // Return early if "Not Applicable"
  if (situsValue === 'Not Applicable') {
    return situsValue;
  }

  // Normalize the address format
  const normalizedAddress = normalizeSitusAddress(situsValue);
  console.log(`📌 Found Situs: ${normalizedAddress}`);
  return { situsEl, situs: normalizedAddress };
}

function normalizeSitusAddress(situs) {
  // Split the address into parts and filter out empty strings
  const parts = situs.split(/\s+/).filter((part) => part);

  if (parts.length < 3) return situs; // Return original if not enough parts

  // Extract street type (ST, AVE, etc.)
  const streetType = parts[1];
  // Extract street number
  const number = parts[2];
  // Extract direction if it exists (N, S, E, W)
  const direction = parts[3] || '';
  // Get street name
  const streetName = parts[0];

  // Capitalize properly
  const formattedStreetName =
    streetName.charAt(0).toUpperCase() + streetName.slice(1).toLowerCase();
  const formattedStreetType =
    streetType.charAt(0).toUpperCase() + streetType.slice(1).toLowerCase();

  // Construct normalized address
  return `${number} ${direction} ${formattedStreetName} ${formattedStreetType}`.trim();
}

function updatePageMetadataTitle(apn, situs) {
  const titleElement = document.querySelector('title');
  if (!titleElement) {
    console.log('❌ Title element not found.');
    return;
  }

  const newTitle = `${situs ?? apn} - cad`;
  titleElement.textContent = newTitle;
  console.log(`✅ Title updated to: ${newTitle}`);
}

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

      // Ensure we don't modify it multiple times
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
      didAddDeedLink = true;
    }
  });

  if (!didAddDeedLink && !hasObserved) {
    console.log('❌ No deed links added. Manually running GIS link...');
    addMidlandGISLink();
  }
}

/* Google Maps link for address */
function linkAddressToGoogleMaps(cell, address, style) {
  if (!address || cell.querySelector('.AppraisalBot-google-maps-link')) return;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  addLinkElement(cell, mapUrl, '📍', 'AppraisalBot-google-maps-link', style);
}

/* Generic Link Creator */
function addLinkElement(parent, url, label, className, style) {
  if (parent.querySelector(`.${className}`)) return;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.className = className;
  link.textContent = label;
  link.style = `
    color: #0044cc;
    font-weight: bold;
    text-decoration: underline;
    ${style}
  `;

  parent.appendChild(link);
}

// Observer to wait for deed history table to load dynamically
const observer = new MutationObserver(() => {
  console.log('🔄 DOM changed, checking for updates to make...');
  hasObserved = true;
  addMidlandGISLink();
  updateMidlandDeedLinks();
  injectGISLayout(); // Ensure GIS layout is injected on DOM changes
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateMidlandDeedLinks();

function injectGISLayout() {
  // Prevent multiple injections
  if (document.querySelector('.appraisalbot-gis-layout')) return;

  // Find the first table sibling of the table with class propertyDetails
  const propertyDetailsTable = document.querySelector('table.propertyDetails');
  let mainTable = null;
  if (propertyDetailsTable) {
    let sibling = propertyDetailsTable.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'TABLE') {
        mainTable = sibling;
        break;
      }
      sibling = sibling.nextElementSibling;
    }
  }
  if (!mainTable) {
    console.log('❌ Main property info table not found.');
    return;
  }

  // Create wrapper table
  const wrapperTable = document.createElement('table');
  wrapperTable.className = 'appraisalbot-gis-layout';
  wrapperTable.style.width = '100%';
  wrapperTable.style.borderCollapse = 'separate';
  const row = wrapperTable.insertRow();

  // Left column: move all descendant tables of mainTable in order
  const leftCol = row.insertCell();
  leftCol.style.width = '40%';
  leftCol.style.verticalAlign = 'top';
  leftCol.style.padding = '10px 0 0 10px';
  const tables = Array.from(mainTable.querySelectorAll('table'));
  tables.forEach((table) => {
    if (table.parentNode) table.parentNode.removeChild(table);
    leftCol.appendChild(table);
  });

  // Middle spacing column
  const spacerCol = row.insertCell();
  spacerCol.style.width = '4%';
  spacerCol.style.background = 'none';
  spacerCol.style.border = 'none';

  // Right column: only GIS iframe
  const rightCol = row.insertCell();
  rightCol.style.width = '56%';
  rightCol.style.verticalAlign = 'top';
  rightCol.style.padding = '10px 30px 0 0';
  const iframe = document.createElement('iframe');
  iframe.src = gisUrl;
  iframe.className = 'gis-iframe';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  rightCol.appendChild(iframe);

  // Insert responsive CSS for iframe
  if (!document.getElementById('appraisalbot-gis-style')) {
    const style = document.createElement('style');
    style.id = 'appraisalbot-gis-style';
    style.textContent = `
      .gis-iframe {
        width: 100%;
        height: 600px;
        border: 0;
        border-radius: 8px;
        display: block;
      }
      @media (max-width: 768px) {
        .gis-iframe {
          height: 50vh;
          min-height: 300px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Replace main table with new layout
  mainTable.parentNode.replaceChild(wrapperTable, mainTable);
}
