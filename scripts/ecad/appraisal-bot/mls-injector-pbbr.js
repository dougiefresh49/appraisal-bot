console.log('MLS Link Injector: Script loaded!');

let lastObservedSequence = ''; // Store the last detected sequence
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
    cadUrl = `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${propertyId}`;
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
