console.log('Deed Link Enhancer: Content script loaded!');

let isUpdating = false;
let lastProcessedContent = '';

/* MutationObserver to react to DOM changes */
const observer = new MutationObserver((mutations) => {
  if (isUpdating) return;

  // Only process if there are actual content changes in the grid table
  const hasGridChanges = mutations.some((mutation) => {
    // Check if the mutation is in the grid table
    const isGridMutation = mutation.target.closest('table.grid');
    if (!isGridMutation) return false;

    // Get the current content of the grid
    const currentContent = Array.from(
      document.querySelectorAll('table.grid tbody tr')
    )
      .map((row) => {
        const header = row.querySelector('th');
        const value = row.querySelector('td');
        return `${header?.textContent.trim()}:${value?.textContent.trim()}`;
      })
      .join('|');

    // Only process if the content has actually changed
    if (currentContent === lastProcessedContent) return false;

    lastProcessedContent = currentContent;
    return true;
  });

  if (hasGridChanges) {
    console.log('🔄 Grid content changed, reprocessing links...');
    updateLinks();
  }
});

// Start observing the body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial run in case the element is already there
updateLinks();

// Fetch and inject current-year tax data once on load
requestAndInsertTaxSection();

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

      // Skip if this row already has our custom elements
      if (
        valueCell.querySelector('.AppraisalBot-deed-link') ||
        valueCell.querySelector('.AppraisalBot-google-maps-link')
      ) {
        return;
      }

      switch (label) {
        case 'Last Sale Instrument':
          console.log('valueText for instrument', valueText);
          updateDeedLink(valueCell, valueText);
          requestAndInsertParcels(valueText, row);
          break;
        case 'Location':
          linkAddressToGoogleMaps(valueCell, valueText);
          requestAndInsertZoning(valueText, row);
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

  const deedBaseUrl =
    'https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1';
  const advSearchUrl = `https://search.ectorcad.org/search/adv?query[sale][instr_num]=${instrument}&type=r`;
  // Detect volume/page format (e.g., 1417/044)
  const [_, volume, page] =
    instrument.match(/^(\d{3,5})\s*\/\s*(\d{1,4})$/) ?? [];
  const hasVolumePage = !!volume && !!page;
  const deedUrl = `${deedBaseUrl}?${
    hasVolumePage ? `volume=${volume}&page=${page}` : `doc=${instrument}`
  }`;

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
  console.log('Requesting deed info from background script...');
  chrome.runtime.sendMessage({ action: 'searchDeed', deedUrl }, (response) => {
    console.log('Received response from background script:', response);

    if (!response) {
      console.error('No response received from background script');
      infoContainer.textContent = 'Error: No response from background script';
      infoContainer.style.color = '#ff0000';
      return;
    }

    if (response.success) {
      infoContainer.textContent = '';

      const { grantor, grantee } = response.data;
      console.log('Successfully received deed data:', { grantor, grantee });

      // Create a new row for Grantor
      const grantorRow = document.createElement('tr');
      const grantorLabelCell = document.createElement('th');
      grantorLabelCell.textContent = 'Last Sale Grantor';
      grantorLabelCell.style.textAlign = 'left';
      const grantorNameCell = document.createElement('td');
      grantorNameCell.textContent = grantor || 'N/A';
      grantorRow.appendChild(grantorLabelCell);
      grantorRow.appendChild(grantorNameCell);

      // Create a new row for Grantee
      const granteeRow = document.createElement('tr');
      const granteeLabelCell = document.createElement('th');
      granteeLabelCell.textContent = 'Last Sale Grantee';
      granteeLabelCell.style.textAlign = 'left';
      const granteeNameCell = document.createElement('td');
      granteeNameCell.textContent = grantee || 'N/A';
      granteeRow.appendChild(granteeLabelCell);
      granteeRow.appendChild(granteeNameCell);

      // Append the new rows under the Last Sale Instrument row
      const lastSaleInstrumentRow = cell.closest('tr');
      lastSaleInstrumentRow.insertAdjacentElement('afterend', grantorRow);
      grantorRow.insertAdjacentElement('afterend', granteeRow);
    } else {
      console.error('Error from background script:', response.error);
      infoContainer.textContent = `Error: ${response.error || 'Unknown error'}`;
      infoContainer.style.color = '#ff0000';
    }
  });

  console.log('✅ Added deed & search links!');
}

/* Google Maps link for address */
function linkAddressToGoogleMaps(cell, address) {
  if (!address) return;
  // Prevent duplicate links
  if (
    cell.querySelector('.AppraisalBot-google-maps-link') ||
    cell.querySelector('.AppraisalBot-zoning-link')
  )
    return;

  // If address contains <br> or <br/>, replace with space for display and link
  let addressHtml = cell.innerHTML;
  let cleanAddress = addressHtml
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    cleanAddress
  )}`;
  const zoningUrl = `https://www.arcgis.com/apps/webappviewer/index.html?id=0264ff5463fa42a6b7ead58e42a46541&addr=${encodeURIComponent(
    cleanAddress
  )}`;

  // Create container for address and links
  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.gap = '8px';
  container.style.alignItems = 'center';

  // Add address text
  const addressSpan = document.createElement('span');
  addressSpan.textContent = cleanAddress + ' ';
  container.appendChild(addressSpan);

  // Add Google Maps link
  addLinkElement(container, mapUrl, '📍', 'AppraisalBot-google-maps-link');
  // Add Zoning Map link
  addLinkElement(container, zoningUrl, '🏢', 'AppraisalBot-zoning-link');

  // Clear cell and add container
  cell.innerHTML = '';
  cell.appendChild(container);
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

function insertZoningRowAfter(
  locationRow,
  classification,
  description,
  isError = false,
  isLoading = false
) {
  console.log('Inserting zoning row:', {
    classification,
    description,
    isError,
    isLoading,
  });
  // Check if zoning row already exists
  if (
    locationRow.nextSibling &&
    locationRow.nextSibling.querySelector &&
    locationRow.nextSibling.querySelector('th') &&
    locationRow.nextSibling.querySelector('th').textContent.trim() === 'Zoning'
  ) {
    console.log('Zoning row already exists');
    // Already inserted
    // if (isLoading || isError) {
    // Update value cell if needed
    const valueCell = locationRow.nextSibling.querySelector('td');
    const newText = isError ? 'Error' : `${classification}, ${description}`;
    console.log('Updating zoning value:', newText);
    valueCell.textContent = isLoading ? 'Loading zoning...' : newText;
    // }
    return;
  }
  const zoningRow = document.createElement('tr');
  const zoningLabelCell = document.createElement('th');
  zoningLabelCell.textContent = 'Zoning';
  zoningLabelCell.style.textAlign = 'left';
  const zoningValueCell = document.createElement('td');
  zoningValueCell.textContent = isLoading
    ? 'Loading zoning...'
    : isError
    ? 'Error'
    : `${classification}, ${description}`;
  zoningRow.appendChild(zoningLabelCell);
  zoningRow.appendChild(zoningValueCell);
  locationRow.insertAdjacentElement('afterend', zoningRow);
}

function requestAndInsertZoning(address, locationRow) {
  // Prevent duplicate requests
  if (locationRow.dataset.zoningRequested) return;
  locationRow.dataset.zoningRequested = 'true';
  insertZoningRowAfter(locationRow, '', '', false, true); // Show loading
  chrome.runtime.sendMessage({ action: 'getZoning', address }, (response) => {
    console.log('[AppraisalBot] Zoning response:', response);
    if (!response || !response.success) {
      insertZoningRowAfter(locationRow, '', '', true, false); // Show error
      console.error(
        '[AppraisalBot] Failed to get zoning info:',
        response?.error
      );
      return;
    }
    const { classification, description } = response.data;
    console.log('Inserting zoning row:', {
      classification,
      description,
    });
    insertZoningRowAfter(locationRow, classification, description);
  });
}

function requestAndInsertParcels(instrumentNumber, lastSaleInstrumentRow) {
  // Prevent duplicate requests
  if (lastSaleInstrumentRow.dataset.parcelsRequested) return;
  lastSaleInstrumentRow.dataset.parcelsRequested = 'true';

  // Extract APN from the URL
  const apn = extractApnFromUrl();
  if (!apn) {
    console.error('[AppraisalBot] Could not extract APN from URL');
    return;
  }

  chrome.runtime.sendMessage(
    {
      action: 'getParcelsFromAdvSearch',
      instrumentNumber,
    },
    (response) => {
      console.log('[AppraisalBot] Parcels response:', response);
      if (!response || !response.success) {
        console.error(
          '[AppraisalBot] Failed to get parcels info:',
          response?.error
        );
        return;
      }
      const { parcels } = response.data;
      console.log('Received parcels:', parcels);

      // If there are multiple parcels, add the "Last Sale Inc. Parcels" row
      if (parcels && parcels.length > 0) {
        // Filter out the current parcel from the list
        const otherParcels = parcels.filter((parcel) => parcel !== apn);
        if (otherParcels.length > 0) {
          insertIncParcelsRow(lastSaleInstrumentRow, otherParcels);
        } else if (parcels.length === 1 && parcels[0] === apn) {
          // Only the current parcel found, no need to show anything
          console.log(
            '[AppraisalBot] Only current parcel found, no related parcels'
          );
        }
      }
    }
  );
}

function extractApnFromUrl() {
  // Extract APN from the URL path
  const pathMatch = window.location.pathname.match(/\/parcel\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  // Fallback: try to extract from page title
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    const titleMatch = titleElement.textContent.match(/Parcel\s+([^\s]+)/);
    if (titleMatch) {
      return titleMatch[1];
    }
  }

  console.error('[AppraisalBot] Could not extract APN from URL or title');
  return null;
}

function insertIncParcelsRow(targetRow, parcels) {
  // Check if the row already exists
  if (
    targetRow.previousSibling &&
    targetRow.previousSibling.querySelector &&
    targetRow.previousSibling.querySelector('th') &&
    targetRow.previousSibling.querySelector('th').textContent.trim() ===
      'Last Sale Inc. Parcels'
  ) {
    console.log('Inc Parcels row already exists');
    return;
  }

  const incParcelsRow = document.createElement('tr');
  const incParcelsLabelCell = document.createElement('th');
  incParcelsLabelCell.textContent = 'Last Sale Inc. Parcels';
  incParcelsLabelCell.style.textAlign = 'left';

  const incParcelsValueCell = document.createElement('td');

  // Create links for each parcel
  const linksContainer = document.createElement('div');
  linksContainer.style.display = 'inline-flex';
  linksContainer.style.flexWrap = 'wrap';
  linksContainer.style.gap = '8px';
  linksContainer.style.alignItems = 'center';

  parcels.forEach((parcel, index) => {
    const parcelLink = document.createElement('a');
    parcelLink.href = `https://search.ectorcad.org/parcel/${parcel}`;
    parcelLink.target = '_blank';
    parcelLink.textContent = parcel;
    parcelLink.style = `
      color: #0044cc;
      font-weight: bold;
      text-decoration: underline;
    `;

    linksContainer.appendChild(parcelLink);

    // Add separator between links (except for the last one)
    if (index < parcels.length - 1) {
      const separator = document.createElement('span');
      separator.textContent = '•';
      separator.style.color = '#666';
      separator.style.margin = '0 4px';
      linksContainer.appendChild(separator);
    }
  });

  incParcelsValueCell.appendChild(linksContainer);
  incParcelsRow.appendChild(incParcelsLabelCell);
  incParcelsRow.appendChild(incParcelsValueCell);

  // Insert after the Last Sale Instrument row
  targetRow.insertAdjacentElement('afterend', incParcelsRow);
}

/**
 * Fetches current-year tax data from the Acctdetails/collections page via the
 * background script and injects a styled tax section before section.pp.
 * Styled to match section.land / section.grid2 so it blends with the page.
 */
function requestAndInsertTaxSection() {
  if (document.querySelector('.AppraisalBot-tax-section')) return;

  const apn = extractApnFromUrl();
  if (!apn) {
    console.error('[AppraisalBot] Could not extract APN for tax request');
    return;
  }

  const ppSection = document.querySelector('section.pp');
  if (!ppSection) {
    console.error('[AppraisalBot] Could not find section.pp for tax insertion');
    return;
  }

  // Insert a loading placeholder styled like section.land
  const taxSection = document.createElement('section');
  taxSection.className = 'AppraisalBot-tax-section';
  taxSection.innerHTML =
    '<h2>Taxes (Current Year)</h2>' +
    '<p style="padding: 8px 0; color: #666; font-style: italic;">Loading tax data...</p>';
  ppSection.insertAdjacentElement('beforebegin', taxSection);

  chrome.runtime.sendMessage({ action: 'getTaxData', apn }, (response) => {
    if (!response || !response.success) {
      taxSection.innerHTML =
        '<h2>Taxes (Current Year)</h2>' +
        `<p style="color: #cc0000;">Error loading tax data: ${response?.error || 'no response'}</p>`;
      console.error('[AppraisalBot] Failed to get tax data:', response?.error);
      return;
    }

    const { year, total, jurisdictions } = response.data;
    const jurisEntries = Object.entries(jurisdictions);

    const headerCells = jurisEntries.map(([k]) => `<th>${k}</th>`).join('');
    const valueCells = jurisEntries
      .map(([, v]) => `<td class="right">${v || '$0.00'}</td>`)
      .join('');

    taxSection.innerHTML =
      `<h2>Taxes ${year}</h2>` +
      '<div class="wide">' +
        '<table class="grid2">' +
          '<thead>' +
            '<tr>' + headerCells + '<th>TOTAL</th>' + '</tr>' +
          '</thead>' +
          '<tbody>' +
            '<tr>' + valueCells + `<td class="right"><strong>${total}</strong></td>` + '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';

    console.log('[AppraisalBot] Tax section injected for APN:', apn);
  });
}
