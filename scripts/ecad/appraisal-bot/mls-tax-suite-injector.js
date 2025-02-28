console.log('MLS Tax Suite Injector: Script loaded!');

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

function updateMLSPropertyLinks() {
  // Find the Parcel ID/CAD row
  const cadRow = document.evaluate(
    "//tr[th[text()='Parcel ID/CAD']]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (!cadRow) {
    console.log('❌ Parcel ID/CAD row not found.');
    return;
  }

  const cadValueCell = cadRow.querySelector('td span.wsp');
  if (!cadValueCell) {
    console.log('❌ No Parcel ID found.');
    return;
  }

  let propertyId = cadValueCell.textContent.trim();
  if (!propertyId) {
    console.log('❌ Parcel ID is empty.');
    return;
  }

  // Check if already modified
  if (cadValueCell.querySelector('a')) {
    console.log('🔵 Parcel ID is already a link. Skipping...');
    return;
  }

  console.log(`📌 Found Parcel ID: ${propertyId}`);

  // Try to extract the existing county CAD link
  const existingCadLinkElement = document.querySelector(
    '.link-listing.donotprint a'
  );
  let countyCadUrl = existingCadLinkElement
    ?.getAttribute('onclick')
    ?.match(/https:\/\/[^']+/)?.[0];

  if (!countyCadUrl) {
    console.log('❌ No existing county CAD link found, generating manually.');
    // Default to Midland CAD (MCAD) if no link found
    countyCadUrl = `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${propertyId}`;
  }

  // Create a new clickable link
  const cadLink = document.createElement('a');
  cadLink.href = countyCadUrl;
  cadLink.target = '_blank';
  cadLink.style = 'color: #0044cc; text-decoration: underline;';
  cadLink.textContent = propertyId;

  // Replace the plain text with the new link
  cadValueCell.innerHTML = '';
  cadValueCell.appendChild(cadLink);

  console.log('✅ Parcel ID successfully turned into a clickable link!');
}

// Observer to handle dynamic page changes
const observer = new MutationObserver(() => {
  console.log('🔄 DOM changed, checking Parcel ID field...');
  updateMLSPropertyLinks();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateMLSPropertyLinks();
