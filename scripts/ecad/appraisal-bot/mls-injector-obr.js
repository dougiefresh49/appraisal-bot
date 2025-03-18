console.log('MLS Link Injector: Script loaded!');

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

function formatMidlandCad(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function formatCad(apn, county) {
  return county === 'Midland' ? formatMidlandCad(apn) : formatEctorCad(apn);
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
      // Stop observing once we successfully update the link
      observer.disconnect();
      console.log('MutationObserver disconnected.');
    }
  });
}

// Observer to wait for Tax ID field to load dynamically
const observer = new MutationObserver(() => {
  console.log('DOM changed, checking for Tax ID field...');
  updateMlsTaxIdLink();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial run in case the element is already there
updateMlsTaxIdLink();
