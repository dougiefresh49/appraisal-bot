document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 Popup loaded!');

  const reportSelector = document.getElementById('report-selector');
  const selectFolderBtn = document.getElementById('select-folder');

  // Load the last selected report path
  chrome.storage.local.get(['selectedReport'], (data) => {
    if (data.selectedReport) {
      console.log('📂 Using saved report:', data.selectedReport);
      updateDropdownWithSelectedReport(data.selectedReport);
    }
  });

  // Handle file selection
  selectFolderBtn.addEventListener('click', async () => {
    try {
      // Ask the user to select a file instead of a folder
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Appraisal Reports',
            accept: { 'text/*': ['.txt', '.pdf', '.docx'] },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const filePath = file.name; // Get the selected file name

      console.log('✅ Selected file:', filePath);

      // Save to storage
      await chrome.storage.local.set({ selectedReport: filePath });

      updateDropdownWithSelectedReport(filePath);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ User canceled file selection.');
      } else {
        console.error('❌ Error selecting file:', error);
      }
    }
  });

  function updateDropdownWithSelectedReport(filePath) {
    reportSelector.innerHTML = `<option value="${filePath}" selected>${filePath}</option>`;
  }

  // Save the selected report when changed
  reportSelector.addEventListener('change', () => {
    const selectedReport = reportSelector.value;
    chrome.storage.local.set({ selectedReport }, () => {
      console.log(`📌 Selected report saved: ${selectedReport}`);
    });
  });
});
