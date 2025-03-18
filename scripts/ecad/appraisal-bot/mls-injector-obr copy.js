console.log('📍 MLS Link Injector: Script loaded!');

let lastObservedSequence = ''; // Store the last detected property change
let updateTimeout = null; // Track update delay

function formatEctorCadNumber(cadNumber) {
  // Ensure the Ector CAD number is in the correct format: xxxxx.xxxxx.xxxxx
  if (!cadNumber.includes('.')) {
    return `${cadNumber.substring(0, 5)}.${cadNumber.substring(
      5,
      10
    )}.${cadNumber.substring(10)}`;
  }
  return cadNumber; // Already formatted correctly
}

function ensureMidlandCadStartsWithR(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function detectCounty() {
  // Find all labels inside `.exp-Row`
  const rows = document.querySelectorAll('.exp-Row');

  for (let row of rows) {
    const label = row.querySelector('.exp-RowLabel');
    if (label && label.textContent.trim() === 'County:') {
      const countyElement = row.querySelector('.exp-RowData');
      if (countyElement) {
        const county = countyElement.textContent.trim();
        console.log(`📌 Detected County: ${county}`);
        return county;
      }
    }
  }

  console.log('❌ County field not found.');
  return null;
}

function updateMLSPropertyLinks() {
  const county = detectCounty();
  if (!county) {
    console.log('❌ Could not determine county.');
    return;
  }

  // Locate the existing MLS Tax Suite CAD link
  const existingCadLink = document.querySelector('a.taxIDLink');
  if (!existingCadLink) {
    console.log('❌ No MLS Tax Suite CAD link found. Skipping...');
    return;
  }

  // Get the property ID from the existing MLS link
  let propertyId = existingCadLink.textContent.trim();
  if (!propertyId) {
    console.log('❌ No Parcel ID found inside link. Skipping...');
    return;
  }

  let cadUrl;
  if (county === 'Ector') {
    propertyId = formatEctorCadNumber(propertyId);
    cadUrl = `https://search.ectorcad.org/parcel/${propertyId}`;
  } else if (county === 'Midland') {
    propertyId = ensureMidlandCadStartsWithR(propertyId);
    cadUrl = `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${propertyId}`;
  } else {
    console.log(`⚠️ Unrecognized county: ${county}. Skipping update.`);
    return;
  }

  // Ensure we don’t modify multiple times
  if (existingCadLink.parentElement.querySelector('.custom-cad-link')) {
    console.log('🔵 CAD link already exists. Skipping...');
    return;
  }

  console.log(`📌 Final CAD ID: ${propertyId}`);

  // Create the new CAD link
  const cadLink = document.createElement('a');
  cadLink.href = cadUrl;
  cadLink.target = '_blank';
  cadLink.className = 'custom-cad-link';
  cadLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  cadLink.textContent = '[View in CAD]';

  // Append the new CAD link next to the existing MLS Tax Suite link
  existingCadLink.insertAdjacentElement('afterend', cadLink);

  console.log('✅ CAD link updated successfully!');

  addGisLink(cadLink, propertyId, county);
}

function addGisLink(cadLink, apn, county) {
  const gisUrl =
    county === 'Ector'
      ? `https://search.ectorcad.org/map/#${apn}`
      : `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${apn}`;
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
  gisLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  cadLink.insertAdjacentElement('afterend', gisLink);

  console.log('✅ GIS link updated successfully!');
}

// Observer to watch `#JsDisplaySequence` for property changes
const sequenceObserver = new MutationObserver(() => {
  const sequenceElement = document.querySelector('#JsDisplaySequence span');
  if (!sequenceElement) {
    console.log('❌ Sequence element not found. Skipping...');
    return;
  }

  const currentSequence = sequenceElement.textContent.trim();
  if (currentSequence === lastObservedSequence) {
    console.log('🔵 Sequence unchanged, skipping update.');
    return;
  }

  console.log(`🔄 Detected property change: ${currentSequence}`);
  lastObservedSequence = currentSequence;

  // Clear any existing timeout to avoid duplicate runs
  if (updateTimeout) clearTimeout(updateTimeout);

  // Wait 1 second before updating to ensure all data is loaded
  updateTimeout = setTimeout(updateMLSPropertyLinks, 1000);
});

// Start observing `#JsDisplaySequence`
const sequenceElement = document.querySelector('#JsDisplaySequence');
if (sequenceElement) {
  sequenceObserver.observe(sequenceElement, { childList: true, subtree: true });
  console.log('👀 Watching for property changes...');
} else {
  console.log('⚠️ Sequence element not found, will retry on next mutation.');
}

// Initial run in case the element is already there
updateMLSPropertyLinks();
