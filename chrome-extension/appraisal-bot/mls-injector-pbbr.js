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

function ensureMidlandCadStartsWithR(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function linkAddressToGoogleMaps(address, addressElement) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;
  const googleMapsLink = document.createElement('a');
  googleMapsLink.href = googleMapsUrl;
  googleMapsLink.target = '_blank';
  googleMapsLink.textContent = '📍'; // change to map icon
  googleMapsLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  addressElement.insertAdjacentElement('afterend', googleMapsLink);
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

function updateMLSPropertyLinks() {
  // Locate the property address
  const addressElement = document.querySelector('.listingInfoAddress span');
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
  // Update page title with property address
  updatePageTitle(currentAddress);

  console.log(`📌 Detected property address change: ${currentAddress}`);
  const isOdessa = currentAddress.includes('Odessa, TX');

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

  // Ensure Midland CAD IDs start with "R"
  if (!isOdessa) {
    propertyId = ensureMidlandCadStartsWithR(propertyId);
  }

  // Check if already modified
  if (existingCadLink.parentElement.querySelector('.custom-cad-link')) {
    console.log('🔵 CAD link already exists. Skipping...');
    return;
  }

  console.log(`📌 Final CAD ID: ${propertyId}`);

  // Generate appropriate CAD link
  let cadUrl;
  if (isOdessa) {
    const formattedParcelId = formatEctorCadNumber(propertyId);
    cadUrl = `https://search.ectorcad.org/parcel/${formattedParcelId}`;
  } else {
    cadUrl = `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${propertyId}`;
  }

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

  addGisLink(cadLink, propertyId, isOdessa);
}

function addGisLink(cadLink, apn, isOdessa) {
  const gisUrl = isOdessa
    ? `https://search.ectorcad.org/map/#${apn}`
    : `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${apn}`;
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
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

// NavicaTools is loaded from navica-tools.js (shared with mls-injector-obr.js)
