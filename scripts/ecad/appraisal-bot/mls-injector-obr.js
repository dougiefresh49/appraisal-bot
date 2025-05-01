console.log('MLS Link Injector: Script loaded!');

let lastObservedSequence = ''; // Store the last detected sequence
let updateTimeout = null; // Track update delay

function formatEctorCadNumber(cadNumber) {
  // Remove any non-numeric characters
  const cleanNumber = cadNumber.replace(/[^0-9]/g, '');

  // Ensure we have exactly 15 digits
  if (cleanNumber.length !== 15) {
    console.warn(`Invalid CAD number length: ${cleanNumber.length} digits`);
    return cadNumber; // Return original if invalid
  }

  // Format as xxxxx.xxxxx.xxxxx
  return `${cleanNumber.substring(0, 5)}.${cleanNumber.substring(
    5,
    10
  )}.${cleanNumber.substring(10)}`;
}

function formatMidlandCadNumber(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function formatCad(apn, county) {
  return county === 'Midland'
    ? formatMidlandCadNumber(apn)
    : formatEctorCadNumber(apn);
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

function getCadUrl(parcelId, county) {
  if (county === 'Midland') {
    return `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${parcelId}`;
  } else if (county === 'Ector') {
    return `https://search.ectorcad.org/parcel/${parcelId}`;
  } else {
    console.log(`⚠️ Unrecognized county: ${county}.`);
    return `https://search.ectorcad.org/parcel/${parcelId}`;
  }
}

function addGisLink(valueSpan, parcelId, county) {
  const gisUrl =
    county === 'Midland'
      ? `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${parcelId}`
      : `https://search.ectorcad.org/map/#${parcelId}`;
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
  valueSpan.insertAdjacentElement('afterend', gisLink);
  console.log('✅ GIS link updated successfully!');
}

function updateMlsTaxIdLink() {
  const county = detectCounty();
  const taxIdContainers = document.querySelectorAll(
    '.exp-HeaderAndFieldContainer'
  );

  taxIdContainers.forEach((container) => {
    const label = container.querySelector('label');
    const valueSpan = container.querySelector('span');

    if (label && valueSpan && label.textContent.trim() === 'Tax ID:') {
      const parcelId = formatCad(valueSpan.textContent.trim(), county);

      // Ensure we don't modify it multiple times
      if (valueSpan.querySelector('a')) {
        console.log('CAD Link already exists, skipping...');
        return;
      }

      console.log(`Found Tax ID: ${parcelId}`);

      // Create the CAD search URL
      const cadUrl = getCadUrl(parcelId, county);

      // Replace text with a clickable link with inline styles
      valueSpan.innerHTML = `<a href="${cadUrl}" target="_blank" 
        style="color: #0044cc; font-weight: bold; text-decoration: underline; cursor: pointer;">
        ${parcelId}
      </a>`;

      console.log('✅ MLS Tax ID link updated successfully!');

      addGisLink(valueSpan, parcelId, county);
    }
  });
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
  updateTimeout = setTimeout(updateMlsTaxIdLink, 1000);
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
updateMlsTaxIdLink();
