// Global reference for subject data (set from DOMContentLoaded scope)
let _subjectDataObj = null;

// Utility functions for generating links based on county and APN format

// Function to check if text matches Ector CAD format (xxxxx.xxxxx.xxxxx)
function isEctorCAD(text) {
  return /^\d{5}\.\d{5}\.\d{5}$/.test(text);
}

// Function to check if text matches Midland CAD format (R followed by 9 numbers)
function isMidlandCAD(text) {
  return /^R\d{9}$/.test(text);
}

// Upton County format checkers
function isUptonAPN(text) {
  return /^\d{4}$/.test(text);
}

function isUptonDeed(text) {
  return /^\d{6}$/.test(text);
}

// Ward County format checker (assume 6 digits for APN)
function isWardAPN(text) {
  return /^\d{4,6}$/.test(text);
}

// Function to get CAD URL based on county and APN
function getCadUrl(apn, county) {
  if (!apn || !county) return null;

  const normalizedCounty = county.toLowerCase();

  switch (normalizedCounty) {
    case 'ector':
      if (isEctorCAD(apn)) {
        return `https://search.ectorcad.org/parcel/${apn}`;
      }
      return 'https://search.ectorcad.org/';

    case 'midland':
      if (isMidlandCAD(apn)) {
        return `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${apn}`;
      }
      return 'https://www.southwestdatasolution.com/webSearchAddress.aspx?dbkey=MIDLANDCAD';

    case 'upton':
      if (isUptonAPN(apn)) {
        return `https://uptoncad.org/Home/Details?parcelId=${apn}`;
      }
      return 'https://uptoncad.org/home';

    case 'ward':
      if (isWardAPN(apn)) {
        return `https://www.wardcad.org/Home/Details?parcelId=${apn}`;
      }
      return 'https://www.wardcad.org/home';

    default:
      return null;
  }
}

// Function to get GIS URL based on county and APN
function getGisUrl(apn, county) {
  if (!apn || !county) return null;

  const normalizedCounty = county.toLowerCase();

  switch (normalizedCounty) {
    case 'ector':
      if (isEctorCAD(apn)) {
        return `https://search.ectorcad.org/map/#${apn}`;
      }
      return 'https://search.ectorcad.org/map/';

    case 'midland':
      if (isMidlandCAD(apn)) {
        return `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${apn}`;
      }
      return 'https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47';

    case 'upton':
      if (isUptonAPN(apn)) {
        return `https://maps.pandai.com/UptonCAD/?find=${apn}`;
      }
      return 'https://maps.pandai.com/UptonCAD/';

    case 'ward':
      if (isWardAPN(apn)) {
        return `https://maps.pandai.com/WardCAD/?find=${apn}`;
      }
      return 'https://maps.pandai.com/WardCAD/';

    default:
      return null;
  }
}

// Function to get Deeds URL based on county and APN
function getDeedsUrl(apn, county) {
  if (!county) return null;

  const normalizedCounty = county.toLowerCase();

  switch (normalizedCounty) {
    case 'ector':
      return 'https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1';

    case 'midland':
      return 'https://midland.tx.publicsearch.us/';

    case 'upton':
      if (isUptonDeed(apn)) {
        return `https://i2j.uslandrecords.com/TX/Upton/D/default.aspx?doc=${apn}`;
      }
      return 'https://i2j.uslandrecords.com/TX/Upton/D/default.aspx';

    default:
      return null;
  }
}

// Function to get Google Maps URL
function getGoogleMapsUrl(address) {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 Side Panel loaded!');

  // const reportSelector = document.getElementById('report-selector');
  // const selectFolderBtn = document.getElementById('select-folder');
  const settingsBtn = document.getElementById('settings-btn');

  // Comp Grid Data functionality
  const csvInput = document.getElementById('csv-input');
  const generateCompsBtn = document.getElementById('generate-comps-btn');
  const saveDataBtn = document.getElementById('save-data-btn');
  const selectCsvFileBtn = document.getElementById('select-csv-file-btn');
  const csvFileInput = document.getElementById('csv-file-input');
  const csvBasePathInput = document.getElementById('csv-base-path');
  const compDisplaySection = document.getElementById('comp-display-section');
  const csvInputSection = document.getElementById('csv-input-section');
  const compData = document.getElementById('comp-data');
  const prevCompBtn = document.getElementById('prev-comp-btn');
  const nextCompBtn = document.getElementById('next-comp-btn');
  const compCounter = document.getElementById('comp-counter');
  const backToInputBtn = document.getElementById('back-to-input-btn');
  const gridDataTab = document.getElementById('grid-data-tab');
  const mlsTab = document.getElementById('mls-tab');
  const gridDataContent = document.getElementById('grid-data-content');
  const mlsContent = document.getElementById('mls-content');
  const mlsIframe = document.getElementById('mls-iframe');

  // Subject Data functionality
  const subjectCsvInput = document.getElementById('subject-csv-input');
  const generateSubjectBtn = document.getElementById('generate-subject-btn');
  const saveSubjectDataBtn = document.getElementById('save-subject-data-btn');
  const selectSubjectCsvFileBtn = document.getElementById(
    'select-subject-csv-file-btn',
  );
  const subjectCsvFileInput = document.getElementById('subject-csv-file-input');
  const subjectDisplaySection = document.getElementById(
    'subject-display-section',
  );
  const subjectCsvInputSection = document.getElementById(
    'subject-csv-input-section',
  );
  const subjectData = document.getElementById('subject-data');
  const backToSubjectInputBtn = document.getElementById(
    'back-to-subject-input-btn',
  );
  const subjectGridDataTab = document.getElementById('subject-grid-data-tab');
  const subjectMlsTab = document.getElementById('subject-mls-tab');
  const subjectGridDataContent = document.getElementById(
    'subject-grid-data-content',
  );
  const subjectMlsContent = document.getElementById('subject-mls-content');
  const subjectMlsIframe = document.getElementById('subject-mls-iframe');
  const subjectCadLink = document.getElementById('subject-cad-link');
  const subjectDeedsLink = document.getElementById('subject-deeds-link');
  const subjectGisLink = document.getElementById('subject-gis-link');
  const subjectMapsLink = document.getElementById('subject-maps-link');

  const compAddressBar = document.getElementById('comp-address-bar');
  const compReorderBtn = document.getElementById('comp-reorder-btn');
  const compEditBtn = document.getElementById('comp-edit-btn');
  const compReorderPanel = document.getElementById('comp-reorder-panel');
  const compReorderList = document.getElementById('comp-reorder-list');
  const compReorderSave = document.getElementById('comp-reorder-save');
  const compReorderCancel = document.getElementById('comp-reorder-cancel');

  let compsData = { headers: [], data: [] };
  let currentCompIndex = 0;
  let currentCompFilePath = '';
  let csvFilePath = ''; // Store the path of the selected CSV file
  let csvBasePath = ''; // Store the manual base path
  let compEditMode = false;

  // Effective date
  const effectiveDateInput = document.getElementById('effective-date-input');

  // Subject form elements
  const subjectInputToggle = document.querySelector('.subject-input-toggle');
  const subjectModeFormBtn = document.getElementById('subject-mode-form');
  const subjectModeCsvBtn = document.getElementById('subject-mode-csv');
  const subjectFormInputSection = document.getElementById('subject-form-input-section');
  const subjectFormAddress = document.getElementById('subject-form-address');
  const subjectFormCounty = document.getElementById('subject-form-county');
  const subjectFormCad = document.getElementById('subject-form-cad');
  const subjectFormEffDate = document.getElementById('subject-form-eff-date');
  const subjectFormYearBuilt = document.getElementById('subject-form-year-built');
  const subjectFormGla = document.getElementById('subject-form-gla');
  const generateSubjectFormBtn = document.getElementById('generate-subject-form-btn');
  const saveSubjectFormBtn = document.getElementById('save-subject-form-btn');

  // Subject data variables
  let subjectDataObj = { headers: [], data: [] };
  let currentSubjectFilePath = '';
  let subjectCsvFilePath = '';

  // Load saved CSV data on page load
  chrome.storage.local.get(
    [
      'apbotCompGridData',
      'apbotCsvFilePath',
      'apbotCsvBasePath',
      'apbotSubjectData',
      'apbotSubjectCsvFilePath',
      'apbotEffectiveDate',
    ],
    (result) => {
      if (result.apbotCompGridData) {
        csvInput.value = result.apbotCompGridData;
        console.log('📋 Loaded saved CSV data from storage');
      }
      if (result.apbotCsvFilePath) {
        csvFilePath = result.apbotCsvFilePath;
        console.log('📁 Loaded saved CSV file path:', csvFilePath);
      }
      if (result.apbotCsvBasePath) {
        csvBasePath = result.apbotCsvBasePath;
        csvBasePathInput.value = csvBasePath;
        console.log('📂 Loaded saved CSV base path:', csvBasePath);
      }
      if (result.apbotSubjectData) {
        subjectCsvInput.value = result.apbotSubjectData;
        populateFormFromCsv(result.apbotSubjectData);
        console.log('📋 Loaded saved subject data from storage');
      }
      if (result.apbotSubjectCsvFilePath) {
        subjectCsvFilePath = result.apbotSubjectCsvFilePath;
        console.log(
          '📁 Loaded saved subject CSV file path:',
          subjectCsvFilePath,
        );
      }
      if (result.apbotEffectiveDate) {
        effectiveDateInput.value = result.apbotEffectiveDate;
        subjectFormEffDate.value = result.apbotEffectiveDate;
        console.log('📅 Loaded saved effective date:', result.apbotEffectiveDate);
      }
    },
  );

  // Save effective date to storage on change
  effectiveDateInput.addEventListener('change', () => {
    const dateValue = effectiveDateInput.value;
    chrome.storage.local.set({ apbotEffectiveDate: dateValue }, () => {
      console.log('📅 Saved effective date:', dateValue);
    });
  });

  // Handle CSV file selection
  selectCsvFileBtn.addEventListener('click', () => {
    csvFileInput.click();
  });

  csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('📁 File selected:', {
        name: file.name,
        path: file.path,
        webkitRelativePath: file.webkitRelativePath,
        size: file.size,
        type: file.type,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        csvInput.value = content;

        // Store the file path for relative path resolution
        csvFilePath = file.path || file.webkitRelativePath || '';
        console.log('📁 Selected CSV file path:', csvFilePath);

        // If we don't have a path, try to construct one from the file name
        if (!csvFilePath) {
          console.warn(
            '⚠️ No file path available, using file name as fallback',
          );
          csvFilePath = file.name;
        }

        // Save both the content and file path
        chrome.storage.local.set(
          {
            apbotCompGridData: content,
            apbotCsvFilePath: csvFilePath,
          },
          () => {
            console.log('💾 Saved CSV data and file path to storage');
          },
        );
      };
      reader.readAsText(file);
    }
  });

  // Handle Subject CSV file selection
  selectSubjectCsvFileBtn.addEventListener('click', () => {
    subjectCsvFileInput.click();
  });

  subjectCsvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('📁 Subject file selected:', {
        name: file.name,
        path: file.path,
        webkitRelativePath: file.webkitRelativePath,
        size: file.size,
        type: file.type,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        subjectCsvInput.value = content;

        // Store the file path for relative path resolution
        subjectCsvFilePath = file.path || file.webkitRelativePath || '';
        console.log('📁 Selected subject CSV file path:', subjectCsvFilePath);

        // If we don't have a path, try to construct one from the file name
        if (!subjectCsvFilePath) {
          console.warn(
            '⚠️ No subject file path available, using file name as fallback',
          );
          subjectCsvFilePath = file.name;
        }

        // Save both the content and file path
        chrome.storage.local.set(
          {
            apbotSubjectData: content,
            apbotSubjectCsvFilePath: subjectCsvFilePath,
          },
          () => {
            console.log('💾 Saved subject data and file path to storage');
          },
        );
      };
      reader.readAsText(file);
    }
  });

  // Save CSV data to local storage
  saveDataBtn.addEventListener('click', () => {
    const csvData = csvInput.value.trim();
    if (csvData) {
      chrome.storage.local.set(
        {
          apbotCompGridData: csvData,
          apbotCsvFilePath: csvFilePath,
          apbotCsvBasePath: csvBasePath,
        },
        () => {
          console.log('💾 Saved CSV data and base path to storage');
          showSaveSuccess();
        },
      );
    } else {
      console.warn('⚠️ No CSV data to save');
    }
  });

  // Save Subject data to local storage
  saveSubjectDataBtn.addEventListener('click', () => {
    const subjectData = subjectCsvInput.value.trim();
    if (subjectData) {
      chrome.storage.local.set(
        {
          apbotSubjectData: subjectData,
          apbotSubjectCsvFilePath: subjectCsvFilePath,
        },
        () => {
          console.log('💾 Saved subject data to storage');
          showSubjectSaveSuccess();
        },
      );
    } else {
      console.warn('⚠️ No subject data to save');
    }
  });

  function showSubjectSaveSuccess() {
    const originalText = saveSubjectDataBtn.textContent;
    saveSubjectDataBtn.textContent = '✅ Saved!';
    saveSubjectDataBtn.style.backgroundColor = '#059669'; // green-600

    setTimeout(() => {
      saveSubjectDataBtn.textContent = originalText;
      saveSubjectDataBtn.style.backgroundColor = ''; // Reset to CSS default
    }, 1500);
  }

  function showSaveSuccess() {
    const originalText = saveDataBtn.textContent;
    saveDataBtn.textContent = '✅ Saved!';
    saveDataBtn.style.backgroundColor = '#059669'; // green-600

    setTimeout(() => {
      saveDataBtn.textContent = originalText;
      saveDataBtn.style.backgroundColor = ''; // Reset to CSS default
    }, 1500);
  }

  // Handle base path input changes
  csvBasePathInput.addEventListener('input', (event) => {
    csvBasePath = event.target.value.trim();
    console.log('📂 Base path updated:', csvBasePath);

    // Save the base path
    chrome.storage.local.set({ apbotCsvBasePath: csvBasePath }, () => {
      console.log('💾 Saved CSV base path to storage');
    });
  });

  // Function to resolve relative paths to absolute paths
  function resolveRelativePath(relativePath) {
    console.log('🔍 Starting path resolution...');
    console.log('📁 CSV file path:', csvFilePath);
    console.log('📂 CSV base path:', csvBasePath);
    console.log('📄 Relative path from CSV:', relativePath);

    if (!relativePath) {
      console.warn('⚠️ No relative path provided');
      return relativePath;
    }

    // Remove leading slash if present
    const cleanRelativePath = relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath;

    console.log('🧹 Cleaned relative path:', cleanRelativePath);

    let baseDir = '';

    // Use manual base path if provided
    if (csvBasePath) {
      baseDir = csvBasePath.endsWith('/') ? csvBasePath : csvBasePath + '/';
      console.log('📂 Using manual base path:', baseDir);
    } else if (csvFilePath) {
      // Try to extract directory from CSV file path
      const lastSlashIndex = csvFilePath.lastIndexOf('/');
      console.log('📍 Last slash index in CSV path:', lastSlashIndex);

      if (lastSlashIndex === -1) {
        console.error('❌ No directory separator found in CSV path');
        return relativePath;
      }

      baseDir = csvFilePath.substring(0, lastSlashIndex + 1);
      console.log('📂 Using CSV file directory:', baseDir);
    } else {
      console.error('❌ No base path available');
      return relativePath;
    }

    // Combine the base directory with the relative path
    const absolutePath = baseDir + cleanRelativePath;

    console.log('🔄 Path resolution result:', {
      baseDir,
      relativePath: cleanRelativePath,
      resolvedPath: absolutePath,
    });

    return absolutePath;
  }

  // --- Edition / Feature Toggle System ---
  const EDITION_DEFAULTS = {
    pro: { 'comp-grid': true, 'subject-data': true, 'report-data': true, 'navica-tools': true },
    standard: { 'comp-grid': false, 'subject-data': false, 'report-data': false, 'navica-tools': true },
  };
  const SECTION_IDS = ['comp-grid', 'subject-data', 'report-data', 'navica-tools'];

  const settingsPanel = document.getElementById('settings-panel');
  const editionSelect = document.getElementById('edition-select');
  const settingsSaveBtn = document.getElementById('settings-save');
  const settingsExtLink = document.getElementById('settings-ext-link');

  function applySectionVisibility(visibility) {
    SECTION_IDS.forEach((id) => {
      const sectionEl = document.querySelector(`[data-section-id="${id}"]`);
      if (sectionEl) {
        sectionEl.classList.toggle('hidden', !visibility[id]);
      }
    });
  }

  function syncCheckboxes(visibility) {
    SECTION_IDS.forEach((id) => {
      const cb = document.getElementById(`vis-${id}`);
      if (cb) cb.checked = !!visibility[id];
    });
  }

  chrome.storage.local.get(['apbotEdition', 'apbotSectionVisibility'], (result) => {
    const edition = result.apbotEdition || 'pro';
    const visibility = result.apbotSectionVisibility || EDITION_DEFAULTS[edition];
    if (editionSelect) editionSelect.value = edition;
    syncCheckboxes(visibility);
    applySectionVisibility(visibility);
  });

  if (editionSelect) {
    editionSelect.addEventListener('change', () => {
      const vis = EDITION_DEFAULTS[editionSelect.value] || EDITION_DEFAULTS.pro;
      syncCheckboxes(vis);
    });
  }

  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      const edition = editionSelect ? editionSelect.value : 'pro';
      const visibility = {};
      SECTION_IDS.forEach((id) => {
        const cb = document.getElementById(`vis-${id}`);
        visibility[id] = cb ? cb.checked : true;
      });
      chrome.storage.local.set({ apbotEdition: edition, apbotSectionVisibility: visibility }, () => {
        applySectionVisibility(visibility);
        if (settingsPanel) settingsPanel.classList.add('hidden');
        console.log('⚙️ Settings saved:', { edition, visibility });
      });
    });
  }

  if (settingsExtLink) {
    settingsExtLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
    });
  }

  // --- Quick Links Search Buttons ---
  document.querySelectorAll('.link[data-search-url]').forEach((linkEl) => {
    const searchUrl = linkEl.getAttribute('data-search-url');
    const placeholder = linkEl.getAttribute('data-search-placeholder') || '';
    const parent = linkEl.parentNode;

    const row = document.createElement('div');
    row.className = 'link-row';
    parent.insertBefore(row, linkEl);
    row.appendChild(linkEl);

    const btn = document.createElement('button');
    btn.className = 'link-search-btn';
    btn.textContent = '🔍';
    btn.title = 'Search by ' + placeholder;
    row.appendChild(btn);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'link-search-input';
    input.placeholder = placeholder;
    parent.insertBefore(input, row.nextSibling);

    btn.addEventListener('click', () => {
      const isVisible = input.classList.toggle('visible');
      btn.classList.toggle('active', isVisible);
      if (isVisible) input.focus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          const url = searchUrl.replace('{q}', encodeURIComponent(val));
          chrome.tabs.create({ url });
        }
      }
    });
  });

  // Non-searchable links remain as plain links (no wrapping needed)

  // Handle collapsible sections
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const sectionName = header.getAttribute('data-section');
      const content = document.querySelector(
        `.section-content[data-section="${sectionName}"]`,
      );
      const icon = header.querySelector('.toggle-icon');

      if (content.classList.contains('collapsed')) {
        // Expand the section
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        header.classList.add('expanded');
        icon.textContent = '▼';

        // Save expanded state
        chrome.storage.local.set({ [`section_${sectionName}_expanded`]: true });
      } else {
        // Collapse the section
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        header.classList.remove('expanded');
        icon.textContent = '▶';

        // Save collapsed state
        chrome.storage.local.set({
          [`section_${sectionName}_expanded`]: false,
        });
      }
    });
  });

  // Load section states
  chrome.storage.local.get(null, (data) => {
    Object.keys(data).forEach((key) => {
      if (key.startsWith('section_') && key.endsWith('_expanded')) {
        const sectionName = key
          .replace('section_', '')
          .replace('_expanded', '');
        const header = document.querySelector(
          `.section-header[data-section="${sectionName}"]`,
        );
        const content = document.querySelector(
          `.section-content[data-section="${sectionName}"]`,
        );
        const icon = header?.querySelector('.toggle-icon');

        if (data[key] && header && content && icon) {
          // Expand the section
          content.classList.remove('collapsed');
          content.classList.add('expanded');
          header.classList.add('expanded');
          icon.textContent = '▼';
        }
      }
    });
  });

  // Comp Grid Functions
  function parseCSV(str) {
    const arr = [];
    let quote = false;
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
      let cc = str[c],
        nc = str[c + 1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc == '"' && quote && nc == '"') {
        arr[row][col] += cc;
        ++c;
        continue;
      }
      if (cc == '"') {
        quote = !quote;
        continue;
      }
      if (cc == ',' && !quote) {
        ++col;
        continue;
      }
      if (cc == '\n' && !quote) {
        ++row;
        col = 0;
        continue;
      }
      arr[row][col] += cc;
    }
    return arr.map((row) =>
      row.map((cell) => cell.trim().replace(/^"|"$/g, '')),
    );
  }

  function copyToClipboard(text, element) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard:', text);
        // Find the clicked element and show success feedback
        showCopySuccess(element);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  }

  function showCopySuccess(element) {
    // Store original content
    const originalContent = element.getAttribute('data-value');

    // Change icon to checkmark
    element.style.setProperty('--copy-icon', '"✅"');

    // Reset after 1.5 seconds
    setTimeout(() => {
      element.style.setProperty('--copy-icon', '"📋"');
    }, 1500);
  }

  function getCompAddress(comp) {
    const headers = compsData.headers;
    const addrIdx = headers.findIndex(
      (h) => h.toLowerCase() === 'property address',
    );
    return addrIdx >= 0 ? (comp[addrIdx] || '').trim() : '';
  }

  function displayComp(index) {
    if (
      !compsData.data ||
      compsData.data.length === 0 ||
      index < 0 ||
      index >= compsData.data.length
    ) {
      return;
    }

    const comp = compsData.data[index];
    const headers = compsData.headers;

    compData.innerHTML = '';

    // Populate address bar
    const address = getCompAddress(comp);
    compAddressBar.textContent = address || `Comp ${index + 1}`;
    compAddressBar.title = address ? 'Click to copy address' : '';

    // Look for the mls-url column specifically
    const filePathIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'mls-url',
    );

    // Get the MLS URL and resolve relative paths
    const mlsUrlValue = filePathIndex >= 0 ? comp[filePathIndex] || '' : '';
    currentCompFilePath = resolveRelativePath(mlsUrlValue);

    headers.forEach((header, i) => {
      const value = comp[i] || '';
      const dataItem = document.createElement('div');
      dataItem.className = 'comp-data-item';
      const isMlsUrl = header.toLowerCase() === 'mls-url';

      if (compEditMode && !isMlsUrl) {
        dataItem.innerHTML = `
          <span class="comp-data-label">${header}</span>
          <input class="comp-data-edit-input" type="text"
            data-header-index="${i}"
            value="${value.replace(/"/g, '&quot;')}" />
        `;
        const input = dataItem.querySelector('.comp-data-edit-input');
        input.addEventListener('change', () => {
          compsData.data[currentCompIndex][i] = input.value;
        });
      } else {
        dataItem.innerHTML = `
          <span class="comp-data-label">${header}</span>
          <div class="comp-data-value ${
            isMlsUrl ? 'mls-url-value' : ''
          }" data-value="${value.replace(/"/g, '&quot;')}" title="${
            isMlsUrl ? 'Click to open in new tab' : 'Click to copy'
          }">
            ${value}
          </div>
        `;
        const valueElement = dataItem.querySelector('.comp-data-value');
        valueElement.addEventListener('click', () => {
          if (isMlsUrl) {
            const fileUrl = `file://${currentCompFilePath}`;
            chrome.tabs.create({ url: fileUrl });
          } else {
            copyToClipboard(value, valueElement);
          }
        });
      }

      compData.appendChild(dataItem);
    });

    compCounter.textContent = `Comp ${index + 1} of ${compsData.data.length}`;
    prevCompBtn.disabled = index === 0;
    nextCompBtn.disabled = index === compsData.data.length - 1;

    // Update edit button visual state
    if (compEditBtn) {
      compEditBtn.classList.toggle('active', compEditMode);
    }

    if (mlsContent.classList.contains('active')) {
      loadMLSPDF();
    }
  }

  function generateComps() {
    const csvText = csvInput.value.trim();
    if (!csvText) {
      alert('Please paste CSV data first.');
      return;
    }

    try {
      const parsedData = parseCSV(csvText);
      if (parsedData.length < 2) {
        alert(
          'Invalid CSV data. Please provide at least a header and one row of data.',
        );
        return;
      }

      compsData = {
        headers: parsedData[0],
        data: parsedData.slice(1),
      };

      currentCompIndex = 0;
      displayComp(currentCompIndex);

      // Switch to display mode
      csvInputSection.classList.add('hidden');
      compDisplaySection.classList.remove('hidden');

      console.log('Generated comps:', compsData);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV data. Please check the format.');
    }
  }

  function nextComp() {
    if (currentCompIndex < compsData.data.length - 1) {
      currentCompIndex++;
      displayComp(currentCompIndex);
    }
  }

  function prevComp() {
    if (currentCompIndex > 0) {
      currentCompIndex--;
      displayComp(currentCompIndex);
    }
  }

  function backToInput() {
    compEditMode = false;
    csvInputSection.classList.remove('hidden');
    compDisplaySection.classList.add('hidden');
    compsData = [];
    currentCompIndex = 0;
  }

  // --- Address bar click to copy ---
  if (compAddressBar) {
    compAddressBar.addEventListener('click', () => {
      const addr = compAddressBar.textContent.trim();
      if (addr) {
        copyToClipboard(addr, compAddressBar);
      }
    });
  }

  // --- Edit mode toggle ---
  if (compEditBtn) {
    compEditBtn.addEventListener('click', () => {
      compEditMode = !compEditMode;
      if (!compEditMode) {
        // Exiting edit mode: persist changes to storage
        saveCompsDataToStorage();
      }
      displayComp(currentCompIndex);
    });
  }

  // --- Reorder mode ---
  function showReorderPanel() {
    if (!compsData.data || compsData.data.length === 0) return;

    compReorderPanel.classList.remove('hidden');
    compReorderBtn.classList.add('active');
    renderReorderList();
  }

  function hideReorderPanel() {
    compReorderPanel.classList.add('hidden');
    compReorderBtn.classList.remove('active');
  }

  function renderReorderList() {
    compReorderList.innerHTML = '';
    compsData.data.forEach((comp, idx) => {
      const item = document.createElement('div');
      item.className = 'comp-reorder-item';
      item.setAttribute('data-idx', idx);

      const numSpan = document.createElement('span');
      numSpan.className = 'reorder-num';
      numSpan.textContent = idx + 1;

      const addrSpan = document.createElement('span');
      addrSpan.className = 'reorder-addr';
      addrSpan.textContent = getCompAddress(comp) || `Comp ${idx + 1}`;

      const arrows = document.createElement('span');
      arrows.className = 'reorder-arrows';

      const upBtn = document.createElement('button');
      upBtn.className = 'reorder-arrow-btn';
      upBtn.textContent = '▲';
      upBtn.disabled = idx === 0;
      upBtn.addEventListener('click', () => moveComp(idx, idx - 1));

      const downBtn = document.createElement('button');
      downBtn.className = 'reorder-arrow-btn';
      downBtn.textContent = '▼';
      downBtn.disabled = idx === compsData.data.length - 1;
      downBtn.addEventListener('click', () => moveComp(idx, idx + 1));

      arrows.appendChild(upBtn);
      arrows.appendChild(downBtn);

      item.appendChild(numSpan);
      item.appendChild(addrSpan);
      item.appendChild(arrows);
      compReorderList.appendChild(item);
    });
  }

  function moveComp(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= compsData.data.length) return;
    const [moved] = compsData.data.splice(fromIdx, 1);
    compsData.data.splice(toIdx, 0, moved);
    renderReorderList();
  }

  if (compReorderBtn) {
    compReorderBtn.addEventListener('click', () => {
      if (compReorderPanel.classList.contains('hidden')) {
        showReorderPanel();
      } else {
        hideReorderPanel();
      }
    });
  }

  if (compReorderSave) {
    compReorderSave.addEventListener('click', () => {
      hideReorderPanel();
      currentCompIndex = 0;
      displayComp(currentCompIndex);
      saveCompsDataToStorage();
    });
  }

  if (compReorderCancel) {
    compReorderCancel.addEventListener('click', () => {
      hideReorderPanel();
    });
  }

  // --- Save comps data back to storage ---
  function saveCompsDataToStorage() {
    if (!compsData.headers || !compsData.data) return;
    // Rebuild CSV text from compsData
    const escapeCell = (val) => {
      if (val == null) val = '';
      val = String(val);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    };
    const headerLine = compsData.headers.map(escapeCell).join(',');
    const dataLines = compsData.data.map((row) =>
      row.map(escapeCell).join(','),
    );
    const csvText = [headerLine, ...dataLines].join('\n');

    csvInput.value = csvText;
    chrome.storage.local.set(
      {
        apbotCompGridData: csvText,
        apbotCsvFilePath: csvFilePath,
        apbotCsvBasePath: csvBasePath,
      },
      () => {
        console.log('💾 Saved updated comp data to storage');
      },
    );
  }

  // Subject Data Functions
  function displaySubjectData() {
    if (!subjectDataObj.data || subjectDataObj.data.length === 0) {
      return;
    }

    const subject = subjectDataObj.data[0]; // Only one subject
    const headers = subjectDataObj.headers;

    subjectData.innerHTML = '';

    // Look for the mls-url column specifically
    const filePathIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'mls-url',
    );

    // Get the MLS URL and resolve relative paths
    const mlsUrlValue = filePathIndex >= 0 ? subject[filePathIndex] || '' : '';
    console.log('📄 Subject MLS URL value from CSV:', mlsUrlValue);

    currentSubjectFilePath = resolveRelativePath(mlsUrlValue);
    console.log('🎯 Final resolved subject path:', currentSubjectFilePath);

    // Update quick links
    updateSubjectQuickLinks(subject, headers);

    headers.forEach((header, i) => {
      const value = subject[i] || '';
      const dataItem = document.createElement('div');
      dataItem.className = 'comp-data-item';

      // Check if this is the mls-url field
      const isMlsUrl = header.toLowerCase() === 'mls-url';

      dataItem.innerHTML = `
        <span class="comp-data-label">${header}</span>
        <div class="comp-data-value ${
          isMlsUrl ? 'mls-url-value' : ''
        }" data-value="${value.replace(/"/g, '&quot;')}" title="${
          isMlsUrl ? 'Click to open in new tab' : 'Click to copy'
        }">
          ${value}
        </div>
      `;

      // Add click event listener to the value element
      const valueElement = dataItem.querySelector('.comp-data-value');
      valueElement.addEventListener('click', () => {
        if (isMlsUrl) {
          // Open MLS URL in new tab using resolved path
          const fileUrl = `file://${currentSubjectFilePath}`;
          chrome.tabs.create({ url: fileUrl });
        } else {
          // Copy other values to clipboard
          copyToClipboard(value, valueElement);
        }
      });

      subjectData.appendChild(dataItem);
    });

    // If currently on MLS tab, reload the PDF
    if (subjectMlsContent.classList.contains('active')) {
      loadSubjectMLSPDF();
    }
  }

  function updateSubjectQuickLinks(subject, headers) {
    // Find APN and county fields
    const apnIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'apn',
    );
    const countyIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'county',
    );
    const addressIndex = headers.findIndex(
      (header) =>
        header.toLowerCase().includes('address') ||
        header.toLowerCase().includes('property'),
    );

    const apn = apnIndex >= 0 ? subject[apnIndex] || '' : '';
    const county = countyIndex >= 0 ? subject[countyIndex] || '' : '';
    const address = addressIndex >= 0 ? subject[addressIndex] || '' : '';

    console.log('🔗 Updating subject quick links:', { apn, county, address });

    // Update CAD link
    if (apn && county) {
      const cadUrl = getCadUrl(apn, county);
      if (cadUrl) {
        subjectCadLink.href = cadUrl;
        subjectCadLink.style.display = 'inline-block';
      } else {
        subjectCadLink.style.display = 'none';
      }
    } else {
      subjectCadLink.style.display = 'none';
    }

    // Update Deeds link
    if (apn && county) {
      const deedsUrl = getDeedsUrl(apn, county);
      if (deedsUrl) {
        subjectDeedsLink.href = deedsUrl;
        subjectDeedsLink.style.display = 'inline-block';
      } else {
        subjectDeedsLink.style.display = 'none';
      }
    } else {
      subjectDeedsLink.style.display = 'none';
    }

    // Update GIS link
    if (apn && county) {
      const gisUrl = getGisUrl(apn, county);
      if (gisUrl) {
        subjectGisLink.href = gisUrl;
        subjectGisLink.style.display = 'inline-block';
      } else {
        subjectGisLink.style.display = 'none';
      }
    } else {
      subjectGisLink.style.display = 'none';
    }

    // Update Maps link
    if (address) {
      const mapsUrl = getGoogleMapsUrl(address);
      if (mapsUrl) {
        subjectMapsLink.href = mapsUrl;
        subjectMapsLink.style.display = 'inline-block';
      } else {
        subjectMapsLink.style.display = 'none';
      }
    } else {
      subjectMapsLink.style.display = 'none';
    }
  }

  function generateSubjectData() {
    const csvText = subjectCsvInput.value.trim();
    if (!csvText) {
      alert('Please paste subject CSV data first.');
      return;
    }

    try {
      const parsedData = parseCSV(csvText);
      if (parsedData.length < 2) {
        alert(
          'Invalid CSV data. Please provide at least a header and one row of data.',
        );
        return;
      }

      subjectDataObj = {
        headers: parsedData[0],
        data: parsedData.slice(1),
      };
      _subjectDataObj = subjectDataObj;

      // Save to storage so content scripts always have the latest
      chrome.storage.local.set(
        { apbotSubjectData: csvText, apbotSubjectCsvFilePath: subjectCsvFilePath },
        () => console.log('💾 Auto-saved subject data on generate'),
      );

      // Switch to display mode
      subjectInputToggle.classList.add('hidden');
      subjectCsvInputSection.classList.add('hidden');
      subjectFormInputSection.classList.add('hidden');
      subjectDisplaySection.classList.remove('hidden');

      displaySubjectData();
      loadCompsSearchConfig();

      console.log('Generated subject data:', subjectDataObj);
    } catch (error) {
      console.error('Error parsing subject CSV:', error);
      alert('Error parsing subject CSV data. Please check the format.');
    }
  }

  function backToSubjectInput() {
    subjectDisplaySection.classList.add('hidden');
    subjectInputToggle.classList.remove('hidden');
    subjectDataObj = [];
    if (subjectModeFormBtn.classList.contains('active')) {
      subjectFormInputSection.classList.remove('hidden');
      subjectCsvInputSection.classList.add('hidden');
    } else {
      subjectCsvInputSection.classList.remove('hidden');
      subjectFormInputSection.classList.add('hidden');
    }
  }

  // Subject Tab switching function
  function switchSubjectTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.subject-tab');
    tabs.forEach((tab) => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    // Update tab content
    const panels = document.querySelectorAll('.subject-tab-panel');
    panels.forEach((panel) => {
      panel.classList.remove('active');
    });

    if (tabName === 'subject-grid-data') {
      subjectGridDataContent.classList.add('active');
    } else if (tabName === 'subject-mls') {
      subjectMlsContent.classList.add('active');
      // Load MLS PDF when switching to MLS tab
      loadSubjectMLSPDF();
    }
  }

  // Load Subject MLS PDF function
  function loadSubjectMLSPDF() {
    if (!currentSubjectFilePath) {
      console.warn('No subject file path found in CSV data');
      subjectMlsIframe.src = '';
      return;
    }

    // Use the resolved file path
    const fileUrl = `file://${currentSubjectFilePath}`;

    console.log('Loading subject MLS PDF from resolved path:', fileUrl);

    // Set up error handler
    subjectMlsIframe.onerror = () => {
      console.error('Failed to load subject MLS PDF:', fileUrl);
      subjectMlsIframe.src = '';
    };

    // Set up success handler
    subjectMlsIframe.onload = () => {
      console.log('Subject MLS PDF loaded successfully:', fileUrl);
      subjectMlsIframe.onerror = null;
    };

    // Set the iframe source
    subjectMlsIframe.src = fileUrl;
  }

  // Comp Grid Event Listeners
  if (generateCompsBtn) {
    generateCompsBtn.addEventListener('click', generateComps);
  }

  if (nextCompBtn) {
    nextCompBtn.addEventListener('click', nextComp);
  }

  if (prevCompBtn) {
    prevCompBtn.addEventListener('click', prevComp);
  }

  if (backToInputBtn) {
    backToInputBtn.addEventListener('click', backToInput);
  }

  // Subject Data Event Listeners
  if (generateSubjectBtn) {
    generateSubjectBtn.addEventListener('click', generateSubjectData);
  }

  if (backToSubjectInputBtn) {
    backToSubjectInputBtn.addEventListener('click', backToSubjectInput);
  }

  // Subject input mode toggle
  subjectModeFormBtn.addEventListener('click', () => {
    subjectModeFormBtn.classList.add('active');
    subjectModeCsvBtn.classList.remove('active');
    subjectFormInputSection.classList.remove('hidden');
    subjectCsvInputSection.classList.add('hidden');
  });

  subjectModeCsvBtn.addEventListener('click', () => {
    subjectModeCsvBtn.classList.add('active');
    subjectModeFormBtn.classList.remove('active');
    subjectCsvInputSection.classList.remove('hidden');
    subjectFormInputSection.classList.add('hidden');
  });

  function buildCsvFromForm() {
    const address = subjectFormAddress.value.trim();
    const county = subjectFormCounty.value;
    const cad = subjectFormCad.value.trim();
    const yearBuilt = subjectFormYearBuilt.value.trim();
    const gla = subjectFormGla.value.trim();

    const headers = ['Address', 'county', 'apn', 'Gross Living Area', 'Year Built'];
    const escapedAddress = address.includes(',') ? `"${address}"` : address;
    const row = [escapedAddress, county, cad, gla, yearBuilt];
    return headers.join(',') + '\n' + row.join(',');
  }

  function populateFormFromCsv(csvText) {
    if (!csvText) return;
    try {
      const parsed = parseCSV(csvText);
      if (parsed.length < 2) return;
      const headers = parsed[0].map((h) => h.toLowerCase().trim());
      const data = parsed[1];

      const addrIdx = headers.indexOf('address');
      const countyIdx = headers.indexOf('county');
      const apnIdx = headers.indexOf('apn');
      const glaIdx = headers.findIndex((h) => h.includes('gross living'));
      const ybIdx = headers.findIndex((h) => h.includes('year built'));

      if (addrIdx >= 0 && data[addrIdx]) subjectFormAddress.value = data[addrIdx];
      if (countyIdx >= 0 && data[countyIdx]) subjectFormCounty.value = data[countyIdx];
      if (apnIdx >= 0 && data[apnIdx]) subjectFormCad.value = data[apnIdx];
      if (glaIdx >= 0 && data[glaIdx]) subjectFormGla.value = data[glaIdx];
      if (ybIdx >= 0 && data[ybIdx]) subjectFormYearBuilt.value = data[ybIdx];
    } catch (e) {
      console.warn('Could not populate form from CSV:', e);
    }
  }

  generateSubjectFormBtn.addEventListener('click', () => {
    const csvText = buildCsvFromForm();
    subjectCsvInput.value = csvText;

    if (subjectFormEffDate.value) {
      effectiveDateInput.value = subjectFormEffDate.value;
      chrome.storage.local.set({ apbotEffectiveDate: subjectFormEffDate.value });
    }

    generateSubjectData();
  });

  saveSubjectFormBtn.addEventListener('click', () => {
    const csvText = buildCsvFromForm();
    subjectCsvInput.value = csvText;

    if (subjectFormEffDate.value) {
      effectiveDateInput.value = subjectFormEffDate.value;
      chrome.storage.local.set({ apbotEffectiveDate: subjectFormEffDate.value });
    }

    chrome.storage.local.set({ apbotSubjectData: csvText }, () => {
      console.log('💾 Saved subject form data to storage as CSV');
      showSubjectFormSaveSuccess();
    });
  });

  function showSubjectFormSaveSuccess() {
    const originalText = saveSubjectFormBtn.textContent;
    saveSubjectFormBtn.textContent = '✅ Saved!';
    saveSubjectFormBtn.style.backgroundColor = '#059669';
    setTimeout(() => {
      saveSubjectFormBtn.textContent = originalText;
      saveSubjectFormBtn.style.backgroundColor = '';
    }, 1500);
  }

  // Tab Event Listeners
  if (gridDataTab) {
    gridDataTab.addEventListener('click', () => switchTab('grid-data'));
  }

  if (mlsTab) {
    mlsTab.addEventListener('click', () => switchTab('mls'));
  }

  if (subjectGridDataTab) {
    subjectGridDataTab.addEventListener('click', () =>
      switchSubjectTab('subject-grid-data'),
    );
  }

  if (subjectMlsTab) {
    subjectMlsTab.addEventListener('click', () =>
      switchSubjectTab('subject-mls'),
    );
  }

  // Tab switching function
  function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.comp-tab');
    tabs.forEach((tab) => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    // Update tab content
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach((panel) => {
      panel.classList.remove('active');
    });

    if (tabName === 'grid-data') {
      gridDataContent.classList.add('active');
    } else if (tabName === 'mls') {
      mlsContent.classList.add('active');
      // Load MLS PDF when switching to MLS tab
      loadMLSPDF();
    }
  }

  // Load MLS PDF function
  function loadMLSPDF() {
    if (!currentCompFilePath) {
      console.warn('No file path found in CSV data for current comp');
      mlsIframe.src = '';
      return;
    }

    // Use the resolved file path
    const fileUrl = `file://${currentCompFilePath}`;

    console.log('Loading MLS PDF from resolved path:', fileUrl);

    // Set up error handler
    mlsIframe.onerror = () => {
      console.error('Failed to load MLS PDF:', fileUrl);
      mlsIframe.src = '';
    };

    // Set up success handler
    mlsIframe.onload = () => {
      console.log('MLS PDF loaded successfully:', fileUrl);
      mlsIframe.onerror = null;
    };

    // Set the iframe source
    mlsIframe.src = fileUrl;
  }

  // Make copyToClipboard available globally
  window.copyToClipboard = copyToClipboard;

  // Load the last selected report path
  chrome.storage.local.get(['selectedReport'], (data) => {
    if (data.selectedReport) {
      console.log('📂 Using saved report:', data.selectedReport);
      updateDropdownWithSelectedReport(data.selectedReport);
    }
  });

  // Initialize Navica Tools
  initializeNavicaTools();

  // Handle file selection
  // selectFolderBtn.addEventListener('click', async () => {
  //   try {
  //     // Ask the user to select a file instead of a folder
  //     const [fileHandle] = await window.showOpenFilePicker({
  //       types: [
  //         {
  //           description: 'Appraisal Reports',
  //           accept: { 'text/*': ['.txt', '.pdf', '.docx'] },
  //         },
  //       ],
  //       excludeAcceptAllOption: true,
  //       multiple: false,
  //     });

  //     const file = await fileHandle.getFile();
  //     const filePath = file.name; // Get the selected file name

  //     console.log('✅ Selected file:', filePath);

  //     // Save to storage
  //     await chrome.storage.local.set({ selectedReport: filePath });

  //     updateDropdownWithSelectedReport(filePath);
  //   } catch (error) {
  //     if (error.name === 'AbortError') {
  //       console.warn('⚠️ User canceled file selection.');
  //     } else {
  //       console.error('❌ Error selecting file:', error);
  //     }
  //   }
  // });

  // function updateDropdownWithSelectedReport(filePath) {
  //   reportSelector.innerHTML = `<option value="${filePath}" selected>${filePath}</option>`;
  // }

  // Save the selected report when changed
  // reportSelector.addEventListener('change', () => {
  //   const selectedReport = reportSelector.value;
  //   chrome.storage.local.set({ selectedReport }, () => {
  //     console.log(`📌 Selected report saved: ${selectedReport}`);
  //   });
  // });

  // Handle download MLS button
  const downloadMlsBtn = document.getElementById('download-mls');
  if (downloadMlsBtn) {
    downloadMlsBtn.addEventListener('click', () => {
      console.log('📥 Download MLS Data clicked');
      // TODO: Implement MLS data download functionality
      // This could send a message to the active tab to extract MLS data
    });
  }

  // Report Data Event Listeners
  const generateReportDataBtn = document.getElementById(
    'generate-report-data-btn',
  );
  const saveReportDataBtn = document.getElementById('save-report-data-btn');
  const backToReportInputBtn = document.getElementById(
    'back-to-report-input-btn',
  );
  const selectReportFileBtn = document.getElementById('select-report-file-btn');
  const reportFileInput = document.getElementById('report-file-input');

  if (generateReportDataBtn) {
    generateReportDataBtn.addEventListener('click', generateReportData);
  }

  if (saveReportDataBtn) {
    saveReportDataBtn.addEventListener('click', saveReportData);
  }

  if (backToReportInputBtn) {
    backToReportInputBtn.addEventListener('click', backToReportInput);
  }

  // Handle Report JSON file selection
  if (selectReportFileBtn) {
    selectReportFileBtn.addEventListener('click', () => {
      reportFileInput.click();
    });
  }

  if (reportFileInput) {
    reportFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        console.log('📁 Report JSON file selected:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          document.getElementById('report-data-input').value = content;

          // Save the loaded content
          chrome.storage.local.set({
            apbotReportData: content,
          });

          console.log('📁 Report JSON file loaded successfully');
        };

        reader.onerror = () => {
          console.error('❌ Error reading report JSON file');
          alert('Error reading the selected file. Please try again.');
        };

        reader.readAsText(file);
      }
    });
  }

  // Load saved report data
  chrome.storage.local.get(['apbotReportData'], (result) => {
    if (result.apbotReportData) {
      document.getElementById('report-data-input').value =
        result.apbotReportData;
    }
  });
});

// Report Data Functions
function generateReportData() {
  const jsonInput = document.getElementById('report-data-input').value.trim();
  if (!jsonInput) {
    alert('Please paste your Google Sheets export JSON data first.');
    return;
  }

  try {
    const reportData = JSON.parse(jsonInput);
    console.log('Parsed report data:', reportData);
    displayReportData(reportData);

    // Show the display section and hide the input section
    document
      .getElementById('report-data-input-section')
      .classList.add('hidden');
    document
      .getElementById('report-data-display-section')
      .classList.remove('hidden');
  } catch (error) {
    console.error('Error parsing JSON:', error);
    alert('Invalid JSON data. Please check your input and try again.');
  }
}

function displayReportData(reportData) {
  const container = document.getElementById('report-data-container');
  container.innerHTML = '';

  // Define the order and display names for sections
  const sectionOrder = [
    { key: 'ClientDataRange', title: 'Client Data' },
    { key: 'NeighborhoodBoundariesRange', title: 'Neighborhood Boundaries' },
    { key: 'ReportInputsRange', title: 'Report Inputs' },
    { key: 'SubjectRange', title: 'Subject' },
    { key: 'CompsLandSummaryRange', title: 'Comps Land Summary' },
    { key: 'CompsSalesSummaryRange', title: 'Comps Sales Summary' },
    { key: 'CompsRentalsSummaryRange', title: 'Comps Rentals Summary' },
    { key: 'TaxEntitiesRange', title: 'Tax Entities' },
    { key: 'FemaDataRange', title: 'FEMA Data' },
  ];

  sectionOrder.forEach(({ key, title }) => {
    if (
      reportData[key] &&
      Array.isArray(reportData[key]) &&
      reportData[key].length > 0
    ) {
      const sectionDiv = createReportSection(title, reportData[key]);
      container.appendChild(sectionDiv);
    }
  });
}

function createReportSection(title, dataArray) {
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'report-section';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'report-section-title';
  titleDiv.textContent = title;
  sectionDiv.appendChild(titleDiv);

  // Special handling for Comp Summary sections
  if (title.includes('Comps') && title.includes('Summary')) {
    return createCompSummarySection(title, dataArray, sectionDiv);
  }

  // Special handling for Subject data
  if (title === 'Subject' && dataArray.length === 1) {
    const subjectData = dataArray[0];
    const keys = Object.keys(subjectData);

    // Sort keys to show most important fields first
    const importantFields = [
      'Address',
      'APN',
      'Legal',
      'Property Rights',
      'Type',
      'County',
      'City',
      'State',
      'Zip',
    ];
    const sortedKeys = [
      ...importantFields.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !importantFields.includes(key)),
    ];

    sortedKeys.forEach((key) => {
      const value = subjectData[key];
      if (value !== undefined && value !== null && value !== '') {
        const itemDiv = createSubjectDataItem(key, String(value));
        sectionDiv.appendChild(itemDiv);
      }
    });
  } else {
    // Standard handling for other data types
    dataArray.forEach((item) => {
      const itemDiv = createReportDataItem(item);
      sectionDiv.appendChild(itemDiv);
    });
  }

  return sectionDiv;
}

function createCompSummarySection(title, dataArray, sectionDiv) {
  if (!dataArray || dataArray.length === 0) {
    return sectionDiv;
  }

  // Create navigation container using existing comp grid styles
  const navContainer = document.createElement('div');
  navContainer.className = 'comp-navigation';

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '←';
  prevBtn.disabled = true;

  const counterSpan = document.createElement('span');
  counterSpan.id = 'comp-counter';
  counterSpan.textContent = `Row 1 of ${dataArray.length}`;

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '→';
  nextBtn.disabled = dataArray.length <= 1;

  navContainer.appendChild(prevBtn);
  navContainer.appendChild(counterSpan);
  navContainer.appendChild(nextBtn);

  // Create data container using existing comp grid styles
  const dataContainer = document.createElement('div');
  dataContainer.className = 'space-y-2';

  // Store current index
  let currentIndex = 0;

  // Function to update display
  function updateDisplay() {
    const currentItem = dataArray[currentIndex];
    dataContainer.innerHTML = '';

    // Sort keys to show important fields first
    const keys = Object.keys(currentItem);
    const importantFields = ['#', 'Address', 'Property Rights', 'Date of Sale'];
    const sortedKeys = [
      ...importantFields.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !importantFields.includes(key)),
    ];

    sortedKeys.forEach((key) => {
      const value = currentItem[key];
      if (value !== undefined && value !== null && value !== '') {
        const itemDiv = createCompDataItem(key, String(value));
        dataContainer.appendChild(itemDiv);
      }
    });

    // Update counter
    counterSpan.textContent = `Row ${currentIndex + 1} of ${dataArray.length}`;

    // Update navigation buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === dataArray.length - 1;
  }

  // Event listeners for navigation
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateDisplay();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < dataArray.length - 1) {
      currentIndex++;
      updateDisplay();
    }
  });

  // Initial display
  updateDisplay();

  sectionDiv.appendChild(navContainer);
  sectionDiv.appendChild(dataContainer);

  return sectionDiv;
}

function createCompDataItem(label, value) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'comp-data-item';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'comp-data-label';
  labelSpan.textContent = label;

  const valueSpan = document.createElement('div');
  valueSpan.className = 'comp-data-value';
  valueSpan.textContent = value;
  valueSpan.setAttribute('data-value', value);
  valueSpan.addEventListener('click', () => copyToClipboard(value, valueSpan));

  itemDiv.appendChild(labelSpan);
  itemDiv.appendChild(valueSpan);

  return itemDiv;
}

function createReportDataItem(item) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'report-data-item';

  // Handle different data structures
  let label, value, variableName;

  if (item.label && item.value !== undefined) {
    // Standard format: { label: "Client Name", value: "John Doe", variableName: "ClientName" }
    label = item.label;
    value = String(item.value);
    variableName = item.variableName;
  } else if (item.Side && item['Street Name']) {
    // Neighborhood boundaries format: { Side: "North", Street Name: "Business 20" }
    label = item.Side;
    value = item['Street Name'];
  } else if (item.Entity && item.Rate) {
    // Tax entities format: { Entity: "ECTOR COUNTY", Rate: "$0.35" }
    label = item.Entity;
    value = item.Rate;
  } else {
    // Subject data format: { Address: "360 SE LOOP 338...", Type: "Improvements", etc. }
    // Use the first property as label and second as value
    const keys = Object.keys(item);
    if (keys.length >= 2) {
      label = keys[0];
      value = String(item[keys[1]] || '');
    } else if (keys.length === 1) {
      label = keys[0];
      value = String(item[keys[0]] || '');
    } else {
      label = 'Unknown';
      value = '';
    }
  }

  const labelSpan = document.createElement('span');
  labelSpan.className = 'report-data-label';
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.className = 'report-data-value';
  valueSpan.textContent = value;
  valueSpan.setAttribute('data-value', value);
  valueSpan.addEventListener('click', () => copyReportValue(valueSpan));

  const copyBtn = document.createElement('button');
  copyBtn.className = 'report-copy-btn';
  copyBtn.innerHTML = `
    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>`;
  copyBtn.title = 'Copy value';
  copyBtn.addEventListener('click', () => copyReportValue(valueSpan));

  // Clear any existing content and append elements properly
  itemDiv.innerHTML = '';
  itemDiv.appendChild(labelSpan);
  itemDiv.appendChild(valueSpan);
  itemDiv.appendChild(copyBtn);

  return itemDiv;
}

function createSubjectDataItem(label, value) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'report-data-item';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'report-data-label';
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.className = 'report-data-value';
  valueSpan.textContent = value;
  valueSpan.setAttribute('data-value', value);
  valueSpan.addEventListener('click', () => copyReportValue(valueSpan));

  const copyBtn = document.createElement('button');
  copyBtn.className = 'report-copy-btn';
  copyBtn.innerHTML = `
    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>`;
  copyBtn.title = 'Copy value';
  copyBtn.addEventListener('click', () => copyReportValue(valueSpan));

  itemDiv.appendChild(labelSpan);
  itemDiv.appendChild(valueSpan);
  itemDiv.appendChild(copyBtn);

  return itemDiv;
}

function copyReportValue(element) {
  const value = element.getAttribute('data-value');
  if (!value) return;

  navigator.clipboard
    .writeText(value)
    .then(() => {
      // Find the copy button in the same item
      const copyBtn = element.parentElement.querySelector('.report-copy-btn');
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>`;
        copyBtn.classList.add('copied');

        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.classList.remove('copied');
        }, 1500);
      }
    })
    .catch((err) => {
      console.error('Failed to copy:', err);
      const copyBtn = element.parentElement.querySelector('.report-copy-btn');
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>`;
        copyBtn.classList.add('error');

        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.classList.remove('error');
        }, 2000);
      }
    });
}

function saveReportData() {
  const jsonInput = document.getElementById('report-data-input').value.trim();
  if (!jsonInput) {
    alert('Please paste your Google Sheets export JSON data first.');
    return;
  }

  try {
    // Validate JSON
    JSON.parse(jsonInput);

    chrome.storage.local.set({ apbotReportData: jsonInput }, () => {
      console.log('Report data saved successfully');
      showReportSaveSuccess();
    });
  } catch (error) {
    console.error('Error saving report data:', error);
    alert('Invalid JSON data. Please check your input and try again.');
  }
}

function showReportSaveSuccess() {
  const saveBtn = document.getElementById('save-report-data-btn');
  const originalText = saveBtn.textContent;
  const originalClass = saveBtn.className;

  saveBtn.textContent = 'Saved!';
  saveBtn.className = originalClass.replace(
    'bg-green-600 hover:bg-green-700',
    'bg-green-500',
  );

  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.className = originalClass;
  }, 2000);
}

function backToReportInput() {
  document
    .getElementById('report-data-display-section')
    .classList.add('hidden');
  document
    .getElementById('report-data-input-section')
    .classList.remove('hidden');
}

// Navica Tools Functions
function initializeNavicaTools() {
  console.log('🔧 Initializing Navica Tools...');

  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      updateNavicaButtonStates(tabs[0].url);
    }
  });

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      updateNavicaButtonStates(tab.url);
    }
  });

  // Listen for tab activation changes
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url) {
        updateNavicaButtonStates(tab.url);
      }
    });
  });

  // Add event listeners for Navica Tools buttons
  const addSearchCriteriaCompsBtn = document.getElementById(
    'add-search-criteria-comps',
  );
  const addSearchCriteriaNbhBtn = document.getElementById(
    'add-search-criteria-nbh',
  );
  const saveStatsBtn = document.getElementById('save-stats');
  const saveMcReportBtn = document.getElementById('save-mc-report');
  const exportCsvBtn = document.getElementById('export-csv');
  const highlightListingsBtn = document.getElementById('highlight-listings');

  if (addSearchCriteriaCompsBtn) {
    addSearchCriteriaCompsBtn.addEventListener('click', () => {
      saveCompsSearchConfig();
      executeNavicaAction('addSearchCriteriaComps');
    });
  }

  if (addSearchCriteriaNbhBtn) {
    addSearchCriteriaNbhBtn.addEventListener('click', () => {
      saveCompsSearchConfig();
      executeNavicaAction('addSearchCriteriaNbh');
    });
  }

  if (saveStatsBtn) {
    saveStatsBtn.addEventListener('click', () => {
      executeNavicaAction('saveStats');
    });
  }

  if (saveMcReportBtn) {
    saveMcReportBtn.addEventListener('click', () => {
      executeNavicaAction('saveMcReport');
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      executeNavicaAction('exportCsv');
    });
  }

  if (highlightListingsBtn) {
    highlightListingsBtn.addEventListener('click', () => {
      executeNavicaAction('highlightListings');
    });
  }

  const downloadListingsBtn = document.getElementById('download-listings');
  if (downloadListingsBtn) {
    downloadListingsBtn.addEventListener('click', () => {
      executeNavicaAction('downloadListings');
    });
  }

  // Comps search config panel
  initCompsSearchConfig();
}

// --- Comps Search Config ---
const COMPS_CONFIG_DEFAULTS = { glaPercent: 15, yearRange: 10, monthsBack: 12 };

function getSubjectApn() {
  if (_subjectDataObj && _subjectDataObj.data && _subjectDataObj.data.length > 0) {
    const subject = _subjectDataObj.data[0];
    const headers = _subjectDataObj.headers;
    const apnIdx = headers.findIndex(
      (h) => h.toLowerCase() === 'apn',
    );
    if (apnIdx !== -1) return (subject[apnIdx] || '').trim();
  }
  return '';
}

function initCompsSearchConfig() {
  const toggleBtn = document.getElementById('comps-config-toggle');
  const panel = document.getElementById('comps-config-panel');
  const glaInput = document.getElementById('config-gla-percent');
  const yearInput = document.getElementById('config-year-range');
  const monthsInput = document.getElementById('config-months-back');

  if (!toggleBtn || !panel) return;

  // Toggle panel visibility
  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    toggleBtn.classList.toggle('active', isHidden);
  });

  // Save config on any input change
  [glaInput, yearInput, monthsInput].forEach((input) => {
    if (input) {
      input.addEventListener('change', () => saveCompsSearchConfig());
    }
  });

  // Load saved config
  loadCompsSearchConfig();
}

function loadCompsSearchConfig() {
  const glaInput = document.getElementById('config-gla-percent');
  const yearInput = document.getElementById('config-year-range');
  const monthsInput = document.getElementById('config-months-back');

  chrome.storage.local.get(['apbotSearchConfig'], (result) => {
    const config = result.apbotSearchConfig;
    const currentApn = getSubjectApn();

    if (config && config.apn && config.apn === currentApn && currentApn !== '') {
      if (glaInput) glaInput.value = config.glaPercent ?? COMPS_CONFIG_DEFAULTS.glaPercent;
      if (yearInput) yearInput.value = config.yearRange ?? COMPS_CONFIG_DEFAULTS.yearRange;
      if (monthsInput) monthsInput.value = config.monthsBack ?? COMPS_CONFIG_DEFAULTS.monthsBack;
      console.log('⚙️ Loaded search config for APN:', currentApn, config);
    } else {
      // APN mismatch or no config - use defaults
      if (glaInput) glaInput.value = COMPS_CONFIG_DEFAULTS.glaPercent;
      if (yearInput) yearInput.value = COMPS_CONFIG_DEFAULTS.yearRange;
      if (monthsInput) monthsInput.value = COMPS_CONFIG_DEFAULTS.monthsBack;
      console.log('⚙️ Using default search config (APN mismatch or no saved config)');
    }
  });
}

function saveCompsSearchConfig() {
  const glaInput = document.getElementById('config-gla-percent');
  const yearInput = document.getElementById('config-year-range');
  const monthsInput = document.getElementById('config-months-back');
  const currentApn = getSubjectApn();

  const config = {
    apn: currentApn,
    glaPercent: parseInt(glaInput?.value) || COMPS_CONFIG_DEFAULTS.glaPercent,
    yearRange: parseInt(yearInput?.value) || COMPS_CONFIG_DEFAULTS.yearRange,
    monthsBack: parseInt(monthsInput?.value) || COMPS_CONFIG_DEFAULTS.monthsBack,
  };

  chrome.storage.local.set({ apbotSearchConfig: config }, () => {
    console.log('⚙️ Saved search config:', config);
  });
}

function updateNavicaButtonStates(currentUrl) {
  const isSearchPage =
    currentUrl &&
    currentUrl.includes('https://next.navicamls.net/381/Search/CriteriaFull');
  const isResultsPage =
    currentUrl &&
    currentUrl.includes('https://next.navicamls.net/381/Search/ResultsFull');
  const isNavica = currentUrl && currentUrl.includes('next.navicamls.net/');

  // Update status text
  const statusText = document.getElementById('navica-status-text');
  const statusContainer = document.querySelector('.navica-status');

  if (statusText && statusContainer) {
    if (isNavica) {
      statusText.textContent = 'On Navica MLS';
      statusContainer.classList.add('active');
    } else {
      statusText.textContent = 'Not on Navica MLS';
      statusContainer.classList.remove('active');
    }
  }

  // Enable/disable buttons based on current page
  const addSearchCriteriaCompsBtn = document.getElementById(
    'add-search-criteria-comps',
  );
  const addSearchCriteriaNbhBtn = document.getElementById(
    'add-search-criteria-nbh',
  );
  const saveStatsBtn = document.getElementById('save-stats');
  const saveMcReportBtn = document.getElementById('save-mc-report');
  const exportCsvBtn = document.getElementById('export-csv');
  const highlightListingsBtn = document.getElementById('highlight-listings');
  const downloadListingsBtn2 = document.getElementById('download-listings');

  // COMMENTED OUT RESTRICTIVE LOGIC - Enable all buttons if on Navica
  if (isNavica) {
    // Enable all buttons if on any Navica page
    if (addSearchCriteriaCompsBtn) addSearchCriteriaCompsBtn.disabled = false;
    if (addSearchCriteriaNbhBtn) addSearchCriteriaNbhBtn.disabled = false;
    if (saveStatsBtn) saveStatsBtn.disabled = false;
    if (saveMcReportBtn) saveMcReportBtn.disabled = false;
    if (exportCsvBtn) exportCsvBtn.disabled = false;
    if (highlightListingsBtn) highlightListingsBtn.disabled = false;
    if (downloadListingsBtn2) downloadListingsBtn2.disabled = false;
  } else {
    // Disable all buttons if not on Navica
    if (addSearchCriteriaCompsBtn) addSearchCriteriaCompsBtn.disabled = true;
    if (addSearchCriteriaNbhBtn) addSearchCriteriaNbhBtn.disabled = true;
    if (saveStatsBtn) saveStatsBtn.disabled = true;
    if (saveMcReportBtn) saveMcReportBtn.disabled = true;
    if (exportCsvBtn) exportCsvBtn.disabled = true;
    if (highlightListingsBtn) highlightListingsBtn.disabled = true;
    if (downloadListingsBtn2) downloadListingsBtn2.disabled = true;
  }

  /* ORIGINAL RESTRICTIVE LOGIC - COMMENTED OUT
  if (addSearchCriteriaCompsBtn)
    addSearchCriteriaCompsBtn.disabled = !isSearchPage;
  if (addSearchCriteriaNbhBtn) addSearchCriteriaNbhBtn.disabled = !isSearchPage;

  // For results page buttons, check if we're on results page AND table exists
  if (isResultsPage) {
    // Check for results table with a delay to account for slow loading
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (
          tabs[0] &&
          tabs[0].url.includes('next.navicamls.net/381/Search/ResultsFull')
        ) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'checkResultsTable' },
            (response) => {
              const hasResultsTable = response && response.hasTable;

              if (saveStatsBtn) saveStatsBtn.disabled = !hasResultsTable;
              if (saveMcReportBtn) saveMcReportBtn.disabled = !hasResultsTable;
              if (exportCsvBtn) exportCsvBtn.disabled = !hasResultsTable;
              if (highlightListingsBtn)
                highlightListingsBtn.disabled = !hasResultsTable;

              // Update status text to show table status
              if (statusText) {
                if (hasResultsTable) {
                  statusText.textContent = 'On Navica MLS - Results Loaded';
                } else {
                  statusText.textContent = 'On Navica MLS - Loading Results...';
                }
              }
            }
          );
        }
      });
    }, 2000); // Wait 2 seconds for page to load

    // Initially disable results buttons while checking
    if (saveStatsBtn) saveStatsBtn.disabled = true;
    if (saveMcReportBtn) saveMcReportBtn.disabled = true;
    if (exportCsvBtn) exportCsvBtn.disabled = true;
    if (highlightListingsBtn) highlightListingsBtn.disabled = true;
  } else {
    // Not on results page, disable all results buttons
    if (saveStatsBtn) saveStatsBtn.disabled = true;
    if (saveMcReportBtn) saveMcReportBtn.disabled = true;
    if (exportCsvBtn) exportCsvBtn.disabled = true;
    if (highlightListingsBtn) highlightListingsBtn.disabled = true;
  }
  */
}

function executeNavicaAction(action) {
  // Send message to content script to execute the action
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('next.navicamls.net/')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: action }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            'Navica Tools: Could not reach content script for action:',
            action,
            chrome.runtime.lastError.message,
          );
        } else {
          console.log('Action executed:', action, response);
        }
      });
    } else {
      alert('Please navigate to the Navica MLS website first.');
    }
  });
}
