console.log('[AppraisalBot] Andrews Deed Injector loaded');

let searchClicked = false;
let instrumentNumber = '';

chrome.storage.local.get(['andrewsSearchState'], (result) => {
  if (result.andrewsSearchState) {
    console.log('Resuming from previous state:', result.andrewsSearchState);
    instrumentNumber = result.andrewsSearchState.instrumentNumber;

    if (result.andrewsSearchState.stage === 'recordingInfo') {
      watchForRecordingInfo();
    }
  } else {
    autoFillAndSearch();
  }
});

function clearAllFormFields() {
  const fieldsToClear = [
    '#field_BothNamesID',
    '#field_GrantorID',
    '#field_GranteeID',
    '#field_RecDateID_DOT_StartDate',
    '#field_RecDateID_DOT_EndDate',
    '#field_DocNumID',
    '#field_BookVolPageID_DOT_Book',
    '#field_BookVolPageID_DOT_Volume',
    '#field_BookVolPageID_DOT_Page',
    '#field_PlattedLegalID_DOT_Town',
    '#field_PlattedLegalID_DOT_Subdivision',
    '#field_PlattedLegalID_DOT_Lot',
    '#field_PlattedLegalID_DOT_Block',
    '#field_PlattedLegalID_DOT_Tract',
    '#field_PlattedLegalID_DOT_Unit',
    '#field_PlattedLegalID_DOT_Custom1',
    '#field_PlattedLegalID_DOT_Custom2',
    '#field_PlattedLegalID_DOT_Custom3',
    '#field_selfservice_documentTypes',
  ];

  fieldsToClear.forEach((selector) => {
    const field = document.querySelector(selector);
    if (field) field.value = '';
  });

  const typeaheadFields = [
    'field_BothNamesID',
    'field_GrantorID',
    'field_GranteeID',
    'field_PlattedLegalID_DOT_Subdivision',
    'field_selfservice_documentTypes',
  ];

  typeaheadFields.forEach((fieldId) => {
    const holderInput = document.querySelector(`#${fieldId}-holderInput`);
    const holderValue = document.querySelector(`#${fieldId}-holderValue`);
    if (holderInput) holderInput.value = '';
    if (holderValue) holderValue.value = '';

    const holder = document.querySelector(`#${fieldId}-holder`);
    if (holder) {
      holder
        .querySelectorAll('.cblist-input-list.transition-background')
        .forEach((tag) => tag.remove());
    }
  });

  const checkboxField = document.querySelector('#field_UseAdvancedSearch');
  if (checkboxField) checkboxField.checked = false;
}

function autoFillAndSearch() {
  const params = new URLSearchParams(window.location.search);
  const doc = params.get('doc');
  const volume = params.get('volume');
  const page = params.get('page');

  if (!doc && !(volume && page)) return;

  clearAllFormFields();

  if (doc) {
    instrumentNumber = doc;
    const inputField = document.querySelector('#field_DocNumID');
    if (inputField) {
      inputField.value = doc;
      setTimeout(() => {
        if (!searchClicked) {
          const searchButton = document.querySelector('#searchButton');
          if (searchButton) {
            searchButton.click();
            searchClicked = true;
            watchForResults();
          }
        }
      }, 500);
    }
  } else if (volume && page) {
    instrumentNumber = `${volume}/${page}`;
    const volumeField = document.getElementById('field_BookVolPageID_DOT_Volume');
    const pageField = document.getElementById('field_BookVolPageID_DOT_Page');
    if (volumeField && pageField) {
      volumeField.value = volume;
      pageField.value = page;
      setTimeout(() => {
        if (!searchClicked) {
          const searchButton = document.querySelector('#searchButton');
          if (searchButton) {
            searchButton.click();
            searchClicked = true;
            watchForResults();
          }
        }
      }, 500);
    }
  }
}

function watchForResults() {
  const checkResults = setInterval(() => {
    const listItems = document.querySelectorAll('.selfServiceSearchResultList li');
    const targetItem = Array.from(listItems).find((li) =>
      li.textContent.includes(instrumentNumber)
    );

    if (targetItem) {
      clearInterval(checkResults);
      targetItem.click();
      watchForFullResult();
    }
  }, 500);

  setTimeout(() => clearInterval(checkResults), 10000);
}

function watchForFullResult() {
  const checkFullResult = setInterval(() => {
    const fullResult = document.querySelector(
      '.selfServiceSearchFullResult.selfServiceSearchResultNavigation'
    );
    if (fullResult) {
      clearInterval(checkFullResult);

      chrome.storage.local.set({
        andrewsSearchState: {
          instrumentNumber,
          stage: 'recordingInfo',
        },
      });

      fullResult.click();
    }
  }, 500);

  setTimeout(() => clearInterval(checkFullResult), 10000);
}

function watchForRecordingInfo() {
  const checkRecordingInfo = setInterval(() => {
    const utilityBoxes = document.querySelectorAll('.ss-utility-box-vertical');

    const recordingInfoBox = Array.from(utilityBoxes).find((box) => {
      const heading = box.querySelector('.ui-li-divider');
      return heading && heading.textContent.includes('Names');
    });

    if (recordingInfoBox) {
      clearInterval(checkRecordingInfo);

      const infoLi = recordingInfoBox.querySelector('.ui-li-static');
      if (infoLi) {
        const table = infoLi.querySelector('table');
        if (table) {
          const rows = table.querySelectorAll('tr');
          const data = {};

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
              const label = cell
                .querySelector('strong')
                ?.textContent.trim()
                .replace(':', '')
                .toLowerCase();
              const value = cell
                .querySelector('div:not(:has(strong))')
                ?.textContent.trim();
              if (label && value) {
                data[label] = value;
              }
            });
          });

          chrome.storage.local.remove(['andrewsSearchState']);

          chrome.runtime.sendMessage({
            action: 'deedData',
            data: data,
          });
        }
      }
    }
  }, 500);

  setTimeout(() => clearInterval(checkRecordingInfo), 10000);
}

const observer = new MutationObserver(() => {
  if (!searchClicked) {
    autoFillAndSearch();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
