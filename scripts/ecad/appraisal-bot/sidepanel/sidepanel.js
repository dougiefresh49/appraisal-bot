document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 Side Panel loaded!');

  // const reportSelector = document.getElementById('report-selector');
  // const selectFolderBtn = document.getElementById('select-folder');
  const settingsBtn = document.getElementById('settings-btn');

  // Comp Grid Elements
  const csvInput = document.getElementById('csv-input');
  const generateCompsBtn = document.getElementById('generate-comps-btn');
  const csvInputSection = document.getElementById('csv-input-section');
  const compDisplaySection = document.getElementById('comp-display-section');
  const compData = document.getElementById('comp-data');
  const compCounter = document.getElementById('comp-counter');
  const prevCompBtn = document.getElementById('prev-comp-btn');
  const nextCompBtn = document.getElementById('next-comp-btn');
  const backToInputBtn = document.getElementById('back-to-input-btn');

  // Tab Elements
  const gridDataTab = document.getElementById('grid-data-tab');
  const mlsTab = document.getElementById('mls-tab');
  const gridDataContent = document.getElementById('grid-data-content');
  const mlsContent = document.getElementById('mls-content');
  const mlsIframe = document.getElementById('mls-iframe');

  // Comp Grid State
  let compsData = [];
  let currentCompIndex = 0;
  let currentCompFilePath = '';

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

    currentCompFilePath = filePathIndex >= 0 ? comp[filePathIndex] || '' : '';

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
          // Open MLS URL in new tab
          const fileUrl = `file://${value}`;
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

  // Tab Event Listeners
  if (gridDataTab) {
    gridDataTab.addEventListener('click', () => switchTab('grid-data'));
  }

  if (mlsTab) {
    mlsTab.addEventListener('click', () => switchTab('mls'));
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

    // Use the file path directly from CSV data
    const fileUrl = `file://${currentCompFilePath}`;

    console.log('Loading MLS PDF from CSV path:', fileUrl);

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
