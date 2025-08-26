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
        return `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${apn}`;
      }
      return 'https://iswdataclient.azurewebsites.net/webSearchAddress.aspx?dbkey=MIDLANDCAD';

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
    address
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
    'select-subject-csv-file-btn'
  );
  const subjectCsvFileInput = document.getElementById('subject-csv-file-input');
  const subjectDisplaySection = document.getElementById(
    'subject-display-section'
  );
  const subjectCsvInputSection = document.getElementById(
    'subject-csv-input-section'
  );
  const subjectData = document.getElementById('subject-data');
  const backToSubjectInputBtn = document.getElementById(
    'back-to-subject-input-btn'
  );
  const subjectGridDataTab = document.getElementById('subject-grid-data-tab');
  const subjectMlsTab = document.getElementById('subject-mls-tab');
  const subjectGridDataContent = document.getElementById(
    'subject-grid-data-content'
  );
  const subjectMlsContent = document.getElementById('subject-mls-content');
  const subjectMlsIframe = document.getElementById('subject-mls-iframe');
  const subjectCadLink = document.getElementById('subject-cad-link');
  const subjectDeedsLink = document.getElementById('subject-deeds-link');
  const subjectGisLink = document.getElementById('subject-gis-link');
  const subjectMapsLink = document.getElementById('subject-maps-link');

  let compsData = { headers: [], data: [] };
  let currentCompIndex = 0;
  let currentCompFilePath = '';
  let csvFilePath = ''; // Store the path of the selected CSV file
  let csvBasePath = ''; // Store the manual base path

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
        console.log('📋 Loaded saved subject data from storage');
      }
      if (result.apbotSubjectCsvFilePath) {
        subjectCsvFilePath = result.apbotSubjectCsvFilePath;
        console.log(
          '📁 Loaded saved subject CSV file path:',
          subjectCsvFilePath
        );
      }
    }
  );

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
            '⚠️ No file path available, using file name as fallback'
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
          }
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
            '⚠️ No subject file path available, using file name as fallback'
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
          }
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
        }
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
        }
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

  // Handle settings button click
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log(
        '⚙️ Settings button clicked, opening extension management page'
      );
      // Open the Chrome extension management page
      chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id,
      });
    });
  }

  // Handle collapsible sections
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const sectionName = header.getAttribute('data-section');
      const content = document.querySelector(
        `.section-content[data-section="${sectionName}"]`
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
          `.section-header[data-section="${sectionName}"]`
        );
        const content = document.querySelector(
          `.section-content[data-section="${sectionName}"]`
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
      row.map((cell) => cell.trim().replace(/^"|"$/g, ''))
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

    // Look for the mls-url column specifically
    const filePathIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'mls-url'
    );

    // Get the MLS URL and resolve relative paths
    const mlsUrlValue = filePathIndex >= 0 ? comp[filePathIndex] || '' : '';
    console.log('📄 MLS URL value from CSV:', mlsUrlValue);
    console.log('📁 Current CSV file path:', csvFilePath);

    currentCompFilePath = resolveRelativePath(mlsUrlValue);
    console.log('🎯 Final resolved path:', currentCompFilePath);

    headers.forEach((header, i) => {
      const value = comp[i] || '';
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
          const fileUrl = `file://${currentCompFilePath}`;
          chrome.tabs.create({ url: fileUrl });
        } else {
          // Copy other values to clipboard
          copyToClipboard(value, valueElement);
        }
      });

      compData.appendChild(dataItem);
    });

    compCounter.textContent = `Comp ${index + 1} of ${compsData.data.length}`;

    // Update navigation buttons
    prevCompBtn.disabled = index === 0;
    nextCompBtn.disabled = index === compsData.data.length - 1;

    // If currently on MLS tab, reload the PDF
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
          'Invalid CSV data. Please provide at least a header and one row of data.'
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
    csvInputSection.classList.remove('hidden');
    compDisplaySection.classList.add('hidden');
    compsData = [];
    currentCompIndex = 0;
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
      (header) => header.toLowerCase() === 'mls-url'
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
      (header) => header.toLowerCase() === 'apn'
    );
    const countyIndex = headers.findIndex(
      (header) => header.toLowerCase() === 'county'
    );
    const addressIndex = headers.findIndex(
      (header) =>
        header.toLowerCase().includes('address') ||
        header.toLowerCase().includes('property')
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
          'Invalid CSV data. Please provide at least a header and one row of data.'
        );
        return;
      }

      subjectDataObj = {
        headers: parsedData[0],
        data: parsedData.slice(1),
      };

      // Switch to display mode
      subjectCsvInputSection.classList.add('hidden');
      subjectDisplaySection.classList.remove('hidden');

      displaySubjectData();

      console.log('Generated subject data:', subjectDataObj);
    } catch (error) {
      console.error('Error parsing subject CSV:', error);
      alert('Error parsing subject CSV data. Please check the format.');
    }
  }

  function backToSubjectInput() {
    subjectCsvInputSection.classList.remove('hidden');
    subjectDisplaySection.classList.add('hidden');
    subjectDataObj = [];
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

  // Tab Event Listeners
  if (gridDataTab) {
    gridDataTab.addEventListener('click', () => switchTab('grid-data'));
  }

  if (mlsTab) {
    mlsTab.addEventListener('click', () => switchTab('mls'));
  }

  if (subjectGridDataTab) {
    subjectGridDataTab.addEventListener('click', () =>
      switchSubjectTab('subject-grid-data')
    );
  }

  if (subjectMlsTab) {
    subjectMlsTab.addEventListener('click', () =>
      switchSubjectTab('subject-mls')
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
});
