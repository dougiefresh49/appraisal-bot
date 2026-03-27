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
    10,
  )}.${cleanNumber.substring(10)}`;
}

function formatMidlandCadNumber(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function formatWardCadNumber(cadNumber) {
  // Ward CAD numbers are 4-6 digits, just digits, no formatting needed
  return cadNumber.replace(/[^0-9]/g, '');
}

function formatAndrewsCadNumber(cadNumber) {
  return cadNumber.replace(/[^0-9]/g, '');
}

function formatCad(apn, county) {
  switch (county) {
    case 'Midland':
      return formatMidlandCadNumber(apn);
    case 'Ward':
      return formatWardCadNumber(apn);
    case 'Andrews':
      return formatAndrewsCadNumber(apn);
    default:
      return formatEctorCadNumber(apn);
  }
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
  switch (county) {
    case 'Midland':
      return `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${parcelId}`;
    case 'Ector':
      return `https://search.ectorcad.org/parcel/${parcelId}`;
    case 'Ward':
      return `https://www.wardcad.org/Home/Details?parcelId=${parcelId}`;
    case 'Upton':
      return `https://uptoncad.org/Home/Details?parcelId=${parcelId}`;
    case 'Andrews':
      return `https://esearch.andrewscad.org/Property/View/${parcelId}`;
    default:
      console.log(`⚠️ Unrecognized county: ${county}.`);
      return `https://search.ectorcad.org/parcel/${parcelId}`;
  }
}

function addGisLink(valueSpan, parcelId, county) {
  let gisUrl;
  if (county === 'Midland') {
    gisUrl = `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${parcelId}`;
  } else if (county === 'Ward') {
    gisUrl = `https://maps.pandai.com/WardCAD/?find=${parcelId}`;
  } else if (county === 'Andrews') {
    gisUrl = `https://gis.bisclient.com/andrewscad/index.html?find=${parcelId}`;
  } else {
    gisUrl = `https://search.ectorcad.org/map/#${parcelId}`;
  }
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
  valueSpan.insertAdjacentElement('afterend', gisLink);
  console.log('✅ GIS link updated successfully!');
}

function linkAddressToGoogleMaps(address, addressElement) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;
  const googleMapsLink = document.createElement('a');
  googleMapsLink.href = googleMapsUrl;
  googleMapsLink.target = '_blank';
  googleMapsLink.textContent = '📍';
  googleMapsLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  addressElement.insertAdjacentElement('afterend', googleMapsLink);

  // Update page title with property address
  updatePageTitle(address);
}

function updatePageTitle(fullAddress) {
  try {
    // Extract street address (remove city, state, zip)
    // Common patterns: "1234 Some St, Midland, TX 79703" or "1234 Some St, Midland, TX"
    const addressMatch = fullAddress.match(
      /^(.+?)(?:\s*,\s*[^,]+(?:\s*,\s*[A-Z]{2}\s*\d{5})?)?$/,
    );

    if (addressMatch && addressMatch[1]) {
      const streetAddress = addressMatch[1].trim();
      const newTitle = `${streetAddress} - MLS`;

      // Update the document title
      document.title = newTitle;
      console.log(`📝 Updated page title to: "${newTitle}"`);
    } else {
      console.warn('Could not parse address for title update:', fullAddress);
    }
  } catch (error) {
    console.error('Error updating page title:', error);
  }
}

function updateMlsAddressLink() {
  const addressElement = document.querySelector('span.listingInfoAddress span');
  if (!addressElement) {
    console.log('❌ Property address field not found.');
    return;
  }

  const currentAddress = addressElement.textContent.trim();
  if (!currentAddress) {
    console.log('❌ Property address is empty.');
    return;
  }

  linkAddressToGoogleMaps(currentAddress, addressElement);
  console.log(`📌 Detected property address change: ${currentAddress}`);
}

function updateMlsTaxIdLink() {
  const county = detectCounty();
  const taxIdContainers = document.querySelectorAll(
    '.exp-HeaderAndFieldContainer',
  );

  taxIdContainers.forEach((container) => {
    const label = container.querySelector('label');
    const valueSpan = container.querySelector('span');

    if (label && valueSpan && label.textContent.trim() === 'Tax ID:') {
      if (valueSpan.querySelector('a')) {
        console.log('CAD Link already exists, skipping...');
        return;
      }

      const rawText = valueSpan.textContent.trim();

      // Split on & to support multiple property IDs (e.g. Andrews "6676&418838")
      const rawParts = rawText
        .split('&')
        .map((s) => s.trim())
        .filter(Boolean);
      const parcelIds = rawParts.map((part) => formatCad(part, county));

      console.log(`Found Tax ID(s): ${parcelIds.join(', ')}`);

      valueSpan.innerHTML = '';

      parcelIds.forEach((parcelId, idx) => {
        if (idx > 0) {
          valueSpan.appendChild(document.createTextNode(' & '));
        }

        const cadUrl = getCadUrl(parcelId, county);
        const link = document.createElement('a');
        link.href = cadUrl;
        link.target = '_blank';
        link.textContent = parcelId;
        link.style.cssText =
          'color: #0044cc; font-weight: bold; text-decoration: underline; cursor: pointer;';
        valueSpan.appendChild(link);
      });

      console.log('✅ MLS Tax ID link(s) updated successfully!');

      // Only one GIS link, using the first parcel ID
      addGisLink(valueSpan, parcelIds[0], county);
    }
  });

  updateMlsAddressLink();
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
