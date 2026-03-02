console.log('[AppraisalBot] Andrews CAD Injector loaded');

(function () {
  const DEEDS_BASE = 'https://andrewscountytx-web.tylerhost.net/web/search/DOCSEARCH642S1';

  function getMapLinks() {
    const links = { google: null, gis: null };
    const items = document.querySelectorAll('#map-links .dropdown-menu a');
    items.forEach((a) => {
      const text = a.textContent.trim().toLowerCase();
      if (text.includes('google')) links.google = a.href;
      else if (text.includes('interactive')) links.gis = a.href;
    });
    return links;
  }

  function enhancePropertyId() {
    const rows = document.querySelectorAll('#detail-page table.table-bordered tbody tr');
    for (const row of rows) {
      const th = row.querySelector('th');
      if (!th || !th.textContent.includes('Property ID:')) continue;

      const td = row.querySelector('td');
      if (!td || td.querySelector('.apbot-enhanced')) return;

      const mapLinks = getMapLinks();
      const idText = td.textContent.trim();
      td.innerHTML = '';

      const span = document.createElement('span');
      span.textContent = idText + ' ';
      td.appendChild(span);

      if (mapLinks.google) {
        const pin = document.createElement('a');
        pin.href = mapLinks.google;
        pin.target = '_blank';
        pin.textContent = '📍';
        pin.title = 'Google Maps';
        pin.className = 'apbot-enhanced';
        pin.style.cssText = 'text-decoration:none; margin-right:6px; cursor:pointer;';
        td.appendChild(pin);
      }

      if (mapLinks.gis) {
        const gis = document.createElement('a');
        gis.href = mapLinks.gis;
        gis.target = '_blank';
        gis.textContent = '[GIS]';
        gis.className = 'apbot-enhanced';
        gis.style.cssText = 'color:#0044cc; font-weight:bold; text-decoration:underline; cursor:pointer;';
        td.appendChild(gis);
      }

      return;
    }
  }

  function enhanceDeedHistory() {
    const panels = document.querySelectorAll('.panel-heading');
    let deedPanel = null;
    for (const p of panels) {
      if (p.textContent.includes('Property Deed History')) {
        deedPanel = p.closest('.panel');
        break;
      }
    }
    if (!deedPanel) return;

    const table = deedPanel.querySelector('table');
    if (!table || table.dataset.apbotProcessed) return;
    table.dataset.apbotProcessed = 'true';

    const headerRow = table.querySelector('tr');
    if (!headerRow) return;

    const headers = Array.from(headerRow.querySelectorAll('th')).map((th) => th.textContent.trim());
    const volIdx = headers.indexOf('Volume');
    const pageIdx = headers.indexOf('Page');
    const numIdx = headers.indexOf('Number');

    if (numIdx === -1) return;

    const dataRows = table.querySelectorAll('tr:not(:first-child)');
    dataRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length <= numIdx) return;

      const numberVal = cells[numIdx] ? cells[numIdx].textContent.trim() : '';
      const volumeVal = volIdx >= 0 && cells[volIdx] ? cells[volIdx].textContent.trim() : '';
      const pageVal = pageIdx >= 0 && cells[pageIdx] ? cells[pageIdx].textContent.trim() : '';

      let url = null;
      if (numberVal) {
        url = `${DEEDS_BASE}?doc=${encodeURIComponent(numberVal)}`;
      } else if (volumeVal && pageVal) {
        url = `${DEEDS_BASE}?volume=${encodeURIComponent(volumeVal)}&page=${encodeURIComponent(pageVal)}`;
      }

      if (!url) return;

      const targetCell = numberVal ? cells[numIdx] : cells[volIdx];
      if (targetCell.querySelector('.apbot-deed-link')) return;

      const originalText = targetCell.textContent.trim();
      targetCell.innerHTML = '';

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = 'apbot-deed-link';
      link.textContent = originalText;
      link.style.cssText = 'color:#0044cc; font-weight:bold; text-decoration:underline;';
      targetCell.appendChild(link);
    });
  }

  enhancePropertyId();
  enhanceDeedHistory();
})();
