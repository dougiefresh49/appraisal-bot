console.log('[AppraisalBot] ECAD Tax Injector loaded');

/**
 * Extracts tax data from the Acctdetails/collections page and sends it
 * to the background script for storage and relay back to the parcel page.
 *
 * DOM structure expected:
 *   .detailstitle + div > table > tbody
 *     tr[0]: td[colspan=2] "Year: YYYY"  |  td[colspan=4] "TAX: $X"
 *     tr[1]: 6 td's with <strong> headers (ISD, OC, COU, HOS, ODE, ECUD)
 *     tr[2]: 6 td's with values
 *     tr[3]: 6 td's with <strong> headers (GOL, FMLR, CED, ESD1, ESD2, "")
 *     tr[4]: 6 td's with values
 */
function extractAndSendTaxData() {
  const detailsDiv = document.querySelector('.detailstitle');
  if (!detailsDiv) {
    return false;
  }

  const table = detailsDiv.nextElementSibling?.querySelector('table');
  if (!table) {
    return false;
  }

  const rows = table.querySelectorAll('tbody tr');
  if (rows.length < 5) {
    console.log('[AppraisalBot] Not enough rows in tax table:', rows.length);
    return false;
  }

  // Row 0: Year (colspan=2) + TAX total (colspan=4)
  const yearRowTds = rows[0].querySelectorAll('td');
  const yearText = yearRowTds[0]?.querySelector('p')?.textContent
    ?.replace('Year:', '').trim() || '';
  const totalText = yearRowTds[1]?.querySelector('p')?.textContent
    ?.replace('TAX:', '').trim() || '';

  if (!yearText || !totalText) {
    console.log('[AppraisalBot] Could not parse year/total from tax table');
    return false;
  }

  // Rows 1+2: header/value pairs for first group
  const headers1 = Array.from(rows[1].querySelectorAll('td'))
    .map((td) => td.querySelector('strong')?.textContent?.trim())
    .filter(Boolean);
  const values1 = Array.from(rows[2].querySelectorAll('td'))
    .map((td) => td.querySelector('p')?.textContent?.trim() || '');

  // Rows 3+4: header/value pairs for second group
  const headers2 = Array.from(rows[3].querySelectorAll('td'))
    .map((td) => td.querySelector('strong')?.textContent?.trim())
    .filter(Boolean);
  const values2 = Array.from(rows[4].querySelectorAll('td'))
    .map((td) => td.querySelector('p')?.textContent?.trim() || '');

  const jurisdictions = {};
  headers1.forEach((h, i) => { jurisdictions[h] = values1[i] || '$0.00'; });
  headers2.forEach((h, i) => { jurisdictions[h] = values2[i] || '$0.00'; });

  const data = { year: yearText, total: totalText, jurisdictions };
  console.log('[AppraisalBot] Extracted tax data:', data);

  chrome.runtime.sendMessage({ action: 'taxData', data });
  return true;
}

// Try immediately; page is server-rendered so data should be present at document_end.
// Retry with interval as a safety net for slow loads.
if (!extractAndSendTaxData()) {
  const retryInterval = setInterval(() => {
    if (extractAndSendTaxData()) {
      clearInterval(retryInterval);
    }
  }, 500);

  setTimeout(() => {
    clearInterval(retryInterval);
    console.error('[AppraisalBot] Tax data extraction timed out after 10s');
  }, 10000);
}
