console.log('[AppraisalBot] Andrews Deed Search Injector loaded');

function extractSearchResultData() {
  const checkResults = setInterval(() => {
    const resultList = document.querySelector('.selfServiceSearchResultList');
    if (!resultList) return;

    const rows = resultList.querySelectorAll('li.ss-search-row');
    if (rows.length === 0) return;

    clearInterval(checkResults);

    const results = [];

    rows.forEach((row) => {
      const entry = {};

      const h1 = row.querySelector('h1');
      if (h1) {
        const parts = h1.textContent.split('•').map((s) => s.trim());
        entry.documentNumber = parts[0] || '';
        entry.documentType = parts[1] || '';
      }

      const columns = row.querySelectorAll('.searchResultFourColumn');
      columns.forEach((col) => {
        const items = col.querySelectorAll('li');
        if (items.length >= 2) {
          const label = items[0].textContent.trim().toLowerCase();
          const value = items[1].querySelector('b')?.textContent.trim() || '';

          if (label.includes('recording date')) entry.recordingDate = value;
          else if (label.includes('grantor')) entry.grantor = value;
          else if (label.includes('grantee')) entry.grantee = value;
          else if (label.includes('legal')) entry.legalDescription = value;
        }
      });

      results.push(entry);
    });

    if (results.length > 0) {
      chrome.runtime.sendMessage({
        action: 'andrewsDeedSearchData',
        data: { results },
      });
    }
  }, 500);

  setTimeout(() => clearInterval(checkResults), 10000);
}

extractSearchResultData();
