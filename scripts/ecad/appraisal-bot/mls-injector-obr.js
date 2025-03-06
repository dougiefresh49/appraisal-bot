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

function updateMlsTaxIdLink() {
  const taxIdContainers = document.querySelectorAll(
    '.exp-HeaderAndFieldContainer'
  );

  taxIdContainers.forEach((container) => {
    const label = container.querySelector('label');
    const valueSpan = container.querySelector('span');

    if (label && valueSpan && label.textContent.trim() === 'Tax ID:') {
      const parcelId = formatEctorCadNumber(valueSpan.textContent.trim());

      // Ensure we don't modify it multiple times
      if (valueSpan.querySelector('a')) {
        console.log('CAD Link already exists, skipping...');
        return;
      }

      console.log(`Found Tax ID: ${parcelId}`);

      // Create the CAD search URL
      const cadUrl = `https://search.ectorcad.org/parcel/${parcelId}`;

      // Replace text with a clickable link with inline styles
      valueSpan.innerHTML = `<a href="${cadUrl}" target="_blank" 
        style="color: #0044cc; font-weight: bold; text-decoration: underline; cursor: pointer;">
        ${parcelId}
      </a>`;

      console.log('✅ MLS Tax ID link updated successfully!');

      addGisLink(valueSpan, parcelId);
      // Stop observing once we successfully update the link
      observer.disconnect();
      console.log('MutationObserver disconnected.');
    }
  });
}

function addGisLink(cadLink, apn) {
  const gisUrl = `https://search.ectorcad.org/map/#${apn}`;
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
  cadLink.insertAdjacentElement('afterend', gisLink);

  console.log('✅ GIS link updated successfully!');
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
