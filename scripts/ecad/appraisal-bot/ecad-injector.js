console.log('Deed Link Enhancer: Content script loaded!');

let isUpdating = false;

/* MutationObserver to react to DOM changes */
const observer = new MutationObserver((mutations) => {
  if (isUpdating) return;

  const hasContentChanges = mutations.some(
    (mutation) =>
      mutation.type === 'childList' && mutation.addedNodes.length > 0
  );

  if (hasContentChanges) {
    console.log('🔄 DOM changed, reprocessing links...');
    updateLinks();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

updateLinks(); // Initial run

/* Main Function */
function updateLinks() {
  if (isUpdating) return;
  isUpdating = true;

  try {
    const rows = document.querySelectorAll('table.grid tbody tr');

    rows.forEach((row) => {
      const header = row.querySelector('th');
      const valueCell = row.querySelector('td');
      if (!header || !valueCell) return;

      const label = header.textContent.trim();
      const valueText = valueCell.textContent.trim();

      switch (label) {
        case 'Last Sale Instrument':
          updateDeedLink(valueCell, valueText);
          break;
        case 'Location':
          linkAddressToGoogleMaps(valueCell, valueText);
          break;
      }
    });
  } finally {
    isUpdating = false;
  }
}

/* Deed + Search Link */
function updateDeedLink(cell, instrument) {
  if (!instrument) {
    console.log('🔁 Skipping deed link — invalid.');
    return;
  }

  console.log(`📌 Found instrument: ${instrument}`);

  const deedUrl = `https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1?doc=${instrument}`;
  const advSearchUrl = `https://search.ectorcad.org/search/adv?query[sale][instr_num]=${instrument}&type=r`;

  // Create container for links and info
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';

  // Add deed link
  addLinkElement(container, deedUrl, instrument, 'AppraisalBot-deed-link');

  // Add search icon
  addLinkElement(container, advSearchUrl, '🔍', 'AppraisalBot-search-icon');

  // Add loading indicator for deed info
  const infoContainer = document.createElement('div');
  infoContainer.className = 'AppraisalBot-deed-info';
  infoContainer.style.fontSize = '0.9em';
  infoContainer.style.color = '#666';
  infoContainer.textContent = 'Loading deed info...';
  container.appendChild(infoContainer);

  // Clear cell and add container
  cell.innerHTML = '';
  cell.appendChild(container);

  // Request deed info from background script
  chrome.runtime.sendMessage(
    { action: 'searchDeed', instrument },
    (response) => {
      if (response.success) {
        const { grantor, grantee } = response.data;
        infoContainer.innerHTML = `
          <div>Grantor: ${grantor || 'N/A'}</div>
          <div>Grantee: ${grantee || 'N/A'}</div>
        `;
      } else {
        infoContainer.textContent = 'Failed to load deed info';
        infoContainer.style.color = '#ff0000';
      }
    }
  );

  console.log('✅ Added deed & search links!');
}

/* Google Maps link for address */
function linkAddressToGoogleMaps(cell, address) {
  if (!address || cell.querySelector('.AppraisalBot-google-maps-link')) return;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  addLinkElement(cell, mapUrl, '📍', 'AppraisalBot-google-maps-link');
}

/* Generic Link Creator */
function addLinkElement(parent, url, label, className) {
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
  `;

  parent.appendChild(link);
}
