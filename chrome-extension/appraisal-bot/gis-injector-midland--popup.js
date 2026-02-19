function addMCADLinkToPopup() {
  // Select the GIS popup
  const popup = document.querySelector('.esriPopupWrapper');
  if (!popup) {
    console.log('❌ GIS popup not found.');
    return;
  }

  // Find the row containing SHORT_R
  const shortRRow = Array.from(popup.querySelectorAll('tr')).find((row) => {
    return row.querySelector('.attrName')?.textContent.trim() === 'LONG_R';
  });

  if (!shortRRow) {
    console.log('⚠️ No LONG_R found in GIS popup.');
    return;
  }

  const shortRCell = shortRRow.querySelector('.attrValue');
  if (!shortRCell) {
    console.log('❌ LONG_R value not found.');
    return;
  }

  let shortR = shortRCell.textContent.trim();
  if (!shortR.startsWith('R')) {
    console.log("⚠️ LONG_R does not start with 'R', skipping...");
    return;
  }

  // Ensure we don’t add the link multiple times
  if (shortRCell.querySelector('.mcad-link')) {
    console.log('🔵 MCAD link already added.');
    return;
  }

  console.log(`📌 Found LONG_R: ${shortR}`);

  // Create MCAD search URL
  const mcadUrl = `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${shortR}`;

  // Create MCAD link element
  const mcadLink = document.createElement('a');
  mcadLink.href = mcadUrl;
  mcadLink.target = '_blank';
  mcadLink.className = 'mcad-link';
  mcadLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  mcadLink.textContent = '[View in MCAD]';

  // Insert the link inside the popup
  shortRCell.appendChild(mcadLink);
  console.log('✅ MCAD link added to GIS popup!');
}

// Observer to detect when the popup appears
const observer = new MutationObserver(() => {
  console.log('🔄 GIS popup detected, checking for SHORT_R...');
  addMCADLinkToPopup();
});

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
