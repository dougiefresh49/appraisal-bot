console.log('MLS Link Injector: Script loaded!');

let lastObservedSequence = ''; // Store the last detected sequence
let updateTimeout = null; // Track update delay

function formatEctorCadNumber(cadNumber) {
  // Remove any non-numeric characters
  const cleanNumber = cadNumber.replace(/[^0-9]/g, '');

  // Ensure we have exactly 15 digits
  if (cleanNumber.length !== 15) {
    console.warn(`Invalid CAD number length: ${cleanNumber.length} digits`);
    return cadNumber; // Return original if invalid
  }

  // Format as xxxxx.xxxxx.xxxxx
  return `${cleanNumber.substring(0, 5)}.${cleanNumber.substring(
    5,
    10
  )}.${cleanNumber.substring(10)}`;
}

function ensureMidlandCadStartsWithR(cadNumber) {
  // If it's a Midland CAD ID and doesn't start with "R", add it
  if (!cadNumber.startsWith('R')) {
    return 'R' + cadNumber;
  }
  return cadNumber; // Already formatted correctly
}

function linkAddressToGoogleMaps(address, addressElement) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
  const googleMapsLink = document.createElement('a');
  googleMapsLink.href = googleMapsUrl;
  googleMapsLink.target = '_blank';
  googleMapsLink.textContent = '📍'; // change to map icon
  googleMapsLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  addressElement.insertAdjacentElement('afterend', googleMapsLink);
}

function updatePageTitle(fullAddress) {
  try {
    // Extract street address (remove city, state, zip)
    // Common patterns: "1234 Some St, Midland, TX 79703" or "1234 Some St, Midland, TX"
    const addressMatch = fullAddress.match(
      /^(.+?)(?:\s*,\s*[^,]+(?:\s*,\s*[A-Z]{2}\s*\d{5})?)?$/
    );

    if (addressMatch && addressMatch[1]) {
      const streetAddress = addressMatch[1].trim();
      const newTitle = `${streetAddress} - MLS`;

      // Update the document title
      document.title = newTitle;
      console.log(`📝 Updated page title to: "${newTitle}"`);
    } else {
      console.warn('Could not parse address for title update:', fullAddress);
    }
  } catch (error) {
    console.error('Error updating page title:', error);
  }
}

function updateMLSPropertyLinks() {
  // Locate the property address
  const addressElement = document.querySelector('.listingInfoAddress span');
  if (!addressElement) {
    console.log('❌ Property address field not found.');
    return;
  }

  const currentAddress = addressElement.textContent.trim();
  if (!currentAddress) {
    console.log('❌ Property address is empty.');
    return;
  }
  linkAddressToGoogleMaps(currentAddress, addressElement);
  // Update page title with property address
  updatePageTitle(currentAddress);

  console.log(`📌 Detected property address change: ${currentAddress}`);
  const isOdessa = currentAddress.includes('Odessa, TX');

  // Locate the existing MLS Tax Suite CAD link
  const existingCadLink = document.querySelector('a.taxIDLink');
  if (!existingCadLink) {
    console.log('❌ No MLS Tax Suite CAD link found. Skipping...');
    return;
  }

  // Get the property ID from the existing MLS link
  let propertyId = existingCadLink.textContent.trim();
  if (!propertyId) {
    console.log('❌ No Parcel ID found inside link. Skipping...');
    return;
  }

  // Ensure Midland CAD IDs start with "R"
  if (!isOdessa) {
    propertyId = ensureMidlandCadStartsWithR(propertyId);
  }

  // Check if already modified
  if (existingCadLink.parentElement.querySelector('.custom-cad-link')) {
    console.log('🔵 CAD link already exists. Skipping...');
    return;
  }

  console.log(`📌 Final CAD ID: ${propertyId}`);

  // Generate appropriate CAD link
  let cadUrl;
  if (isOdessa) {
    const formattedParcelId = formatEctorCadNumber(propertyId);
    cadUrl = `https://search.ectorcad.org/parcel/${formattedParcelId}`;
  } else {
    cadUrl = `https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=${propertyId}`;
  }

  // Create the new CAD link
  const cadLink = document.createElement('a');
  cadLink.href = cadUrl;
  cadLink.target = '_blank';
  cadLink.className = 'custom-cad-link';
  cadLink.style =
    'color: #0044cc; font-weight: bold; text-decoration: underline; margin-left: 8px;';
  cadLink.textContent = '[View in CAD]';

  // Append the new CAD link next to the existing MLS Tax Suite link
  existingCadLink.insertAdjacentElement('afterend', cadLink);

  console.log('✅ CAD link updated successfully!');

  addGisLink(cadLink, propertyId, isOdessa);
}

function addGisLink(cadLink, apn, isOdessa) {
  const gisUrl = isOdessa
    ? `https://search.ectorcad.org/map/#${apn}`
    : `https://maps.midlandtexas.gov/portal/apps/webappviewer/index.html?id=3cce4985d5f94f1c8c5d0ea06e1e5b47&apn=${apn}`;
  const gisLink = document.createElement('a');
  gisLink.href = gisUrl;
  gisLink.target = '_blank';
  gisLink.textContent = '[GIS]';
  cadLink.insertAdjacentElement('afterend', gisLink);

  console.log('✅ GIS link updated successfully!');
}

// Observer to watch `#JsDisplaySequence` for property changes
const sequenceObserver = new MutationObserver(() => {
  const sequenceElement = document.querySelector('#JsDisplaySequence span');
  if (!sequenceElement) {
    console.log('❌ Sequence element not found. Skipping...');
    return;
  }

  const currentSequence = sequenceElement.textContent.trim();
  if (currentSequence === lastObservedSequence) {
    console.log('🔵 Sequence unchanged, skipping update.');
    return;
  }

  console.log(`🔄 Detected property change: ${currentSequence}`);
  lastObservedSequence = currentSequence;

  // Clear any existing timeout to avoid duplicate runs
  if (updateTimeout) clearTimeout(updateTimeout);

  // Wait 1 second before updating to ensure all data is loaded
  updateTimeout = setTimeout(updateMLSPropertyLinks, 1000);
});

// Start observing `#JsDisplaySequence`
const sequenceElement = document.querySelector('#JsDisplaySequence');
if (sequenceElement) {
  sequenceObserver.observe(sequenceElement, { childList: true, subtree: true });
  console.log('👀 Watching for property changes...');
} else {
  console.log('⚠️ Sequence element not found, will retry on next mutation.');
}

// Initial run in case the element is already there
updateMLSPropertyLinks();

// Navica Tools functionality
class NavicaTools {
  constructor() {
    this.subjectData = null;
    this.queueKey = 'navica_action_queue';
    this.init();
  }

  // Queue management methods
  addToQueue(action, data = {}) {
    const queueItem = {
      action,
      data,
      timestamp: Date.now(),
      url: window.location.href,
    };
    localStorage.setItem(this.queueKey, JSON.stringify(queueItem));
    console.log('📝 Added to queue:', queueItem);
  }

  getFromQueue() {
    const queueData = localStorage.getItem(this.queueKey);
    if (queueData) {
      try {
        return JSON.parse(queueData);
      } catch (e) {
        console.error('❌ Error parsing queue data:', e);
        return null;
      }
    }
    return null;
  }

  clearQueue() {
    localStorage.removeItem(this.queueKey);
    console.log('🗑️ Queue cleared');
  }

  async processQueue() {
    const queueItem = this.getFromQueue();
    if (!queueItem) return;

    console.log('🔄 Processing queue item:', queueItem);

    // Check if we're still on a Navica page
    if (!window.location.href.includes('next.navicamls.net/381')) {
      console.log('❌ Not on Navica page, clearing queue');
      this.clearQueue();
      return;
    }

    // Process the queued action
    try {
      switch (queueItem.action) {
        case 'saveStats':
          await this.processSaveStats();
          break;
        case 'saveMcReport':
          await this.processSaveMcReport();
          break;
        case 'exportCsv':
          await this.processExportCsv();
          break;
        default:
          console.warn('❓ Unknown queue action:', queueItem.action);
          this.clearQueue();
      }
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      this.clearQueue();
    }
  }

  init() {
    // Check for queued actions on page load
    setTimeout(() => {
      this.processQueue();
    }, 1000);

    // Listen for messages from the sidepanel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Received message:', request);

      switch (request.action) {
        case 'addSearchCriteriaComps':
          this.addSearchCriteriaComps().then(() =>
            sendResponse({ success: true })
          );
          break;
        case 'addSearchCriteriaNbh':
          this.addSearchCriteriaNbh().then(() =>
            sendResponse({ success: true })
          );
          break;
        case 'saveStats':
          this.addToQueue('saveStats');
          this.saveStats().then(() => sendResponse({ success: true }));
          break;
        case 'saveMcReport':
          this.addToQueue('saveMcReport');
          this.saveMcReport().then(() => sendResponse({ success: true }));
          break;
        case 'exportCsv':
          this.addToQueue('exportCsv');
          this.exportCsv().then(() => sendResponse({ success: true }));
          break;
        case 'highlightListings':
          this.highlightListings().then(() => sendResponse({ success: true }));
          break;
        case 'checkResultsTable':
          const hasTable = document.querySelector('#resultsDataTable') !== null;
          sendResponse({ hasTable: hasTable });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }

      return true; // Keep message channel open for async response
    });

    // Load subject data from storage
    this.loadSubjectData();
  }

  loadSubjectData() {
    chrome.storage.local.get(['apbotSubjectData'], (result) => {
      if (result.apbotSubjectData) {
        try {
          const csvData = this.parseCSV(result.apbotSubjectData);
          if (csvData.length >= 2) {
            const headers = csvData[0];
            const subjectRow = csvData[1];
            this.subjectData = {};

            headers.forEach((header, index) => {
              this.subjectData[header.toLowerCase()] = subjectRow[index] || '';
            });

            console.log('📋 Loaded subject data:', this.subjectData);
          }
        } catch (error) {
          console.error('Error parsing subject data:', error);
        }
      }
    });
  }

  parseCSV(str) {
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

  // Add search criteria for comps
  async addSearchCriteriaComps() {
    if (!this.subjectData) {
      alert('Please load subject data first in the Subject Data section.');
      return;
    }

    try {
      await this.clearSearchFields();
      await this.populateCompSearchCriteria();
      console.log('✅ Comp search criteria added successfully');
    } catch (error) {
      console.error('❌ Error adding comp search criteria:', error);
      alert('Error adding search criteria. Please try again.');
    }
  }

  // Add search criteria for neighborhood
  async addSearchCriteriaNbh() {
    if (!this.subjectData) {
      alert('Please load subject data first in the Subject Data section.');
      return;
    }

    try {
      await this.clearSearchFields();
      await this.populateNbhSearchCriteria();
      console.log('✅ Neighborhood search criteria added successfully');
    } catch (error) {
      console.error('❌ Error adding neighborhood search criteria:', error);
      alert('Error adding search criteria. Please try again.');
    }
  }

  async clearSearchFields() {
    const fieldsToClear = [
      'Sections_1__ListingFields_2__V_0_', // Apx SqFt From
      'Sections_1__ListingFields_2__V_1_', // Apx SqFt To
      'Sections_1__ListingFields_12__V_0_', // Year Built From
      'Sections_1__ListingFields_12__V_1_', // Year Built To
      'Sections_1__ListingFields_13__V_0_', // Apx Total Acres From
      'Sections_1__ListingFields_13__V_1_', // Apx Total Acres To
    ];

    for (const fieldId of fieldsToClear) {
      const element = document.getElementById(fieldId);
      if (element) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  async populateCompSearchCriteria() {
    const currentYear = new Date().getFullYear();
    const gla = parseFloat(this.subjectData['gross living area']) || 0;
    const age = parseFloat(this.subjectData['actual age']) || 0;
    let siteSize = parseFloat(this.subjectData['site']) || 0;

    // Convert site size from sf to acres if needed (assuming sf if > 1)
    if (siteSize > 1) {
      siteSize = siteSize / 43560; // Convert sf to acres
    }

    // Calculate ranges based on search rules
    const sqftMin = Math.round(gla * 0.85);
    const sqftMax = Math.round(gla * 1.15);
    const yearMin = currentYear - age - 10;
    const yearMax = Math.min(currentYear - age + 10, currentYear);
    const acresMin = Math.round(siteSize * 0.85 * 100) / 100; // Round to 2 decimal places
    const acresMax = Math.round(siteSize * 2 * 100) / 100;

    // Populate fields
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_0_',
      sqftMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_1_',
      sqftMax.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_0_',
      yearMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_1_',
      yearMax.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_13__V_0_',
      acresMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_13__V_1_',
      acresMax.toString()
    );
  }

  async populateNbhSearchCriteria() {
    // For neighborhood search, use broader ranges
    const currentYear = new Date().getFullYear();
    const gla = parseFloat(this.subjectData['gross living area']) || 0;
    const age = parseFloat(this.subjectData['actual age']) || 0;
    let siteSize = parseFloat(this.subjectData['site']) || 0;

    // Convert site size from sf to acres if needed (assuming sf if > 1)
    if (siteSize > 1) {
      siteSize = siteSize / 43560; // Convert sf to acres
    }

    // Broader ranges for neighborhood analysis
    const sqftMin = Math.round(gla * 0.7);
    const sqftMax = Math.round(gla * 1.3);
    const yearMin = currentYear - age - 15;
    const yearMax = Math.min(currentYear - age + 15, currentYear);
    const acresMin = Math.round(siteSize * 0.5 * 100) / 100; // Round to 2 decimal places
    const acresMax = Math.round(siteSize * 3 * 100) / 100;

    // Populate fields
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_0_',
      sqftMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_1_',
      sqftMax.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_0_',
      yearMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_1_',
      yearMax.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_13__V_0_',
      acresMin.toString()
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_13__V_1_',
      acresMax.toString()
    );
  }

  async setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // Small delay to ensure the change is processed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Save Stats functionality
  // Processing methods for queue system
  async processSaveStats() {
    console.log('🔄 Processing saveStats from queue');

    // Check if we're on the stats page
    if (window.location.href.includes('/Report/StatMenu')) {
      console.log('✅ On stats page, looking for print button');

      // Try to find and click print button with retries
      let printButton = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!printButton && attempts < maxAttempts) {
        printButton = document.getElementById('printButton');
        if (!printButton) {
          console.log(
            `Attempt ${attempts + 1}: Print button not found, waiting...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (printButton) {
        console.log('Found print button, clicking...');
        printButton.click();

        // Wait for print dialog to close (user action)
        await this.waitForUserAction();

        // Try to go back to results
        await this.goBackToResults();

        // Clear queue after successful completion
        this.clearQueue();
      } else {
        console.warn('Print button not found after', maxAttempts, 'attempts');
        this.clearQueue();
      }
    } else {
      console.log('❌ Not on stats page, clearing queue');
      this.clearQueue();
    }
  }

  async processSaveMcReport() {
    console.log('🔄 Processing saveMcReport from queue');

    // Check if we're on the reports page
    if (window.location.href.includes('/Report/')) {
      console.log('✅ On reports page, looking for Market Conditions checkbox');

      // Try to find Market Conditions checkbox with retries
      let mcCheckbox = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!mcCheckbox && attempts < maxAttempts) {
        mcCheckbox = document.getElementById('MarketConditions');
        if (!mcCheckbox) {
          console.log(
            `Attempt ${
              attempts + 1
            }: Market Conditions checkbox not found, waiting...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (mcCheckbox) {
        console.log('Found Market Conditions checkbox, checking it...');
        mcCheckbox.checked = true;
        mcCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait a moment for the checkbox change to register
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try to find Run Report button with retries
        let runReportBtn = null;
        attempts = 0;

        while (!runReportBtn && attempts < maxAttempts) {
          runReportBtn = document.querySelector(
            'input[type="submit"][value="Run Report"]'
          );
          if (!runReportBtn) {
            console.log(
              `Attempt ${attempts + 1}: Run Report button not found, waiting...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            attempts++;
          }
        }

        if (runReportBtn) {
          console.log('Found Run Report button, clicking...');
          runReportBtn.click();

          // Wait for report to load
          await this.waitForPageLoad();

          // Additional wait for report to fully render
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Print the report
          console.log('Printing report...');
          window.print();

          // Wait for print dialog to close (user action)
          await this.waitForUserAction();

          // Go back to results (two steps back)
          await this.goBackToResults();

          // Clear queue after successful completion
          this.clearQueue();
        } else {
          console.warn(
            'Run Report button not found after',
            maxAttempts,
            'attempts'
          );
          this.clearQueue();
        }
      } else {
        console.warn(
          'Market Conditions checkbox not found after',
          maxAttempts,
          'attempts'
        );
        this.clearQueue();
      }
    } else {
      console.log('❌ Not on reports page, clearing queue');
      this.clearQueue();
    }
  }

  async processExportCsv() {
    console.log('🔄 Processing exportCsv from queue');

    // Check if we're on the export page
    if (window.location.href.includes('/Export/')) {
      console.log('✅ On export page, looking for CSV export button');

      // Try to find CSV export button with retries
      let csvButton = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!csvButton && attempts < maxAttempts) {
        csvButton = this.findCsvExportButton();
        if (!csvButton) {
          console.log(
            `Attempt ${attempts + 1}: CSV export button not found, waiting...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (csvButton) {
        console.log('Found CSV export button, clicking...');
        csvButton.click();

        // Wait for export to complete
        await this.waitForPageLoad();

        // Try to click ViewExport button if available
        const viewExportBtn = document.querySelector(
          'input[value="ViewExport"]'
        );
        if (viewExportBtn) {
          console.log('Found ViewExport button, clicking...');
          viewExportBtn.click();
          await this.waitForPageLoad();
        }

        // Go back to results
        await this.goBackToResults();

        // Clear queue after successful completion
        this.clearQueue();
      } else {
        console.warn(
          'CSV export button not found after',
          maxAttempts,
          'attempts'
        );
        this.clearQueue();
      }
    } else {
      console.log('❌ Not on export page, clearing queue');
      this.clearQueue();
    }
  }

  async saveStats() {
    try {
      // Click the Stats icon
      const statsIcon = document.querySelector(
        '.jsQuickStatsForSelectedListings'
      );
      if (statsIcon) {
        console.log('📊 Clicking Stats icon...');
        statsIcon.click();

        // Wait for stats page to load
        await this.waitForPageLoad();

        console.log('✅ Stats page loaded, queue will handle the rest');
      } else {
        console.warn('Stats icon not found');
        alert(
          'Stats icon not found. Please ensure you are on the search results page.'
        );
      }
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      alert('Error saving stats. Please try again.');
    }
  }

  // Save MC Report functionality
  async saveMcReport() {
    try {
      // Click the Reports icon
      const reportsIcon = document.querySelector(
        '.jsReportsForSelectedListings'
      );
      if (reportsIcon) {
        console.log('📋 Clicking Reports icon...');
        reportsIcon.click();

        // Wait for reports page to load
        await this.waitForPageLoad();

        console.log('✅ Reports page loaded, queue will handle the rest');
      } else {
        console.warn('Reports icon not found');
        alert(
          'Reports icon not found. Please ensure you are on the search results page.'
        );
      }
    } catch (error) {
      console.error('❌ Error saving MC report:', error);
      alert('Error saving MC report. Please try again.');
    }
  }

  // Export CSV functionality
  async exportCsv() {
    try {
      // Click the Export icon
      const exportIcon = document.querySelector('.jsExportSelectedListings');
      if (exportIcon) {
        console.log('📤 Clicking Export icon...');
        exportIcon.click();

        // Wait for export page to load
        await this.waitForPageLoad();

        console.log('✅ Export page loaded, queue will handle the rest');
      } else {
        console.warn('Export icon not found');
        alert(
          'Export icon not found. Please ensure you are on the search results page.'
        );
      }
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    }
  }

  findCsvExportButton() {
    // Look for the export button in the table row with "[ALL] A La Mode - CSV"
    const tableRows = document.querySelectorAll('table tbody tr');

    for (const row of tableRows) {
      const nameCell = row.querySelector('td:first-child');
      if (nameCell && nameCell.textContent.includes('[ALL] A La Mode - CSV')) {
        const exportBtn = row.querySelector(
          'input[type="submit"][value="Export"]'
        );
        return exportBtn;
      }
    }

    return null;
  }

  async waitForPageLoad() {
    return new Promise((resolve) => {
      const checkLoad = () => {
        if (document.readyState === 'complete') {
          setTimeout(resolve, 1000); // Additional delay for dynamic content
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
  }

  async waitForUserAction() {
    // Wait for user to close print dialog or complete action
    return new Promise((resolve) => {
      setTimeout(resolve, 2000); // 2 second delay
    });
  }

  async goBackToResults() {
    try {
      // First try window.history.back()
      window.history.back();

      // Wait a moment for navigation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to click return to results button if available
      const returnBtn = document.getElementById('returnToResultsScreenButton');
      if (returnBtn) {
        returnBtn.click();
      }
    } catch (error) {
      console.warn('Error navigating back to results:', error);
    }
  }

  // Highlight listings functionality
  async highlightListings() {
    if (!this.subjectData) {
      alert('Please load subject data first in the Subject Data section.');
      return;
    }

    try {
      console.log('🎯 Starting highlight process...');

      // Wait a moment for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const subjectGla = parseFloat(this.subjectData['gross living area']) || 0;
      const subjectAge = parseFloat(this.subjectData['actual age']) || 0;
      const currentYear = new Date().getFullYear();
      const subjectYearBuilt = currentYear - subjectAge;

      console.log('🔍 Looking for listing rows...');
      console.log('Current URL:', window.location.href);
      console.log('Subject data:', {
        subjectGla,
        subjectAge,
        subjectYearBuilt,
      });

      // Try multiple selectors to find the table
      let listingRows = document.querySelectorAll('#resultsDataTable tbody tr');

      if (listingRows.length === 0) {
        // Try alternative selectors
        listingRows = document.querySelectorAll('table.resultsTable tbody tr');
        console.log('Tried resultsTable selector, found:', listingRows.length);
      }

      if (listingRows.length === 0) {
        listingRows = document.querySelectorAll('table.dataTable tbody tr');
        console.log('Tried dataTable selector, found:', listingRows.length);
      }

      if (listingRows.length === 0) {
        listingRows = document.querySelectorAll('tbody tr');
        console.log(
          'Tried generic tbody tr selector, found:',
          listingRows.length
        );
      }

      if (listingRows.length === 0) {
        // Debug: show what tables exist
        const allTables = document.querySelectorAll('table');
        console.log('Available tables:', allTables.length);
        allTables.forEach((table, index) => {
          console.log(`Table ${index}:`, table.id, table.className);
        });

        alert(
          'No listing rows found. Please ensure you are on the search results page with listings displayed.'
        );
        return;
      }

      console.log(`Found ${listingRows.length} listing rows`);

      // Clear existing highlights
      this.clearHighlights();

      const listings = [];
      const today = new Date();

      // Parse each listing row
      listingRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 15) {
          console.log(`Skipping row ${index} - only ${cells.length} cells`);
          return; // Skip if not enough columns
        }

        const mlsNumber = cells[2]?.textContent?.trim() || '';
        const propertyStatus = row.getAttribute('data-propertystatus') || '';
        const sqft = parseFloat(cells[12]?.textContent?.replace(/,/g, '') || 0);
        const yearBuilt = parseFloat(cells[18]?.textContent?.trim() || 0);
        const closingDate = cells[19]?.textContent?.trim() || '';

        console.log(
          `Row ${index}: MLS=${mlsNumber}, Status=${propertyStatus}, Sqft=${sqft}, Year=${yearBuilt}, Close=${closingDate}`
        );

        // Parse closing date
        let daysFromToday = 9999; // Default for active listings
        if (closingDate && closingDate !== '') {
          const closeDate = new Date(closingDate);
          if (!isNaN(closeDate.getTime())) {
            daysFromToday = Math.abs(
              Math.floor((today - closeDate) / (1000 * 60 * 60 * 24))
            );
          }
        }

        // Calculate similarity scores
        const sqftDiff = Math.abs(sqft - subjectGla);
        const yearDiff = Math.abs(yearBuilt - subjectYearBuilt);

        // Weighted score (lower is better)
        const similarityScore =
          (sqftDiff / subjectGla) * 0.4 +
          (yearDiff / subjectYearBuilt) * 0.3 +
          (daysFromToday / 365) * 0.3;

        listings.push({
          row,
          mlsNumber,
          propertyStatus,
          sqft,
          yearBuilt,
          closingDate,
          daysFromToday,
          similarityScore,
          index,
        });
      });

      if (listings.length === 0) {
        alert('No valid listing data found. Please check the table structure.');
        return;
      }

      // Sort by similarity score
      listings.sort((a, b) => a.similarityScore - b.similarityScore);

      // Highlight listings
      listings.forEach((listing, rank) => {
        const { row, propertyStatus, similarityScore } = listing;

        // Always highlight active listings in green
        if (propertyStatus === 'A') {
          row.style.backgroundColor = '#d4edda'; // Light green
          row.style.borderLeft = '4px solid #28a745'; // Green border
        }
        // Always highlight under contract listings in orange
        else if (propertyStatus === 'U' || propertyStatus === 'C') {
          row.style.backgroundColor = '#fff3cd'; // Light orange
          row.style.borderLeft = '4px solid #ffc107'; // Orange border
        }
        // Highlight top 5 closed sales in red (best comps)
        else if (propertyStatus === 'S' && rank < 5) {
          row.style.backgroundColor = '#f8d7da'; // Light red
          row.style.borderLeft = '4px solid #dc3545'; // Red border
        }
      });

      console.log(`✅ Highlighted ${listings.length} listings`);

      // Show summary
      const activeCount = listings.filter(
        (l) => l.propertyStatus === 'A'
      ).length;
      const underContractCount = listings.filter(
        (l) => l.propertyStatus === 'U' || l.propertyStatus === 'C'
      ).length;
      const closedCount = listings.filter(
        (l) => l.propertyStatus === 'S'
      ).length;

      console.log(
        `📊 Summary: ${activeCount} active, ${underContractCount} under contract, ${closedCount} closed sales`
      );
    } catch (error) {
      console.error('❌ Error highlighting listings:', error);
      alert('Error highlighting listings. Please try again.');
    }
  }

  clearHighlights() {
    // Try multiple selectors to find the table rows
    let listingRows = document.querySelectorAll('#resultsDataTable tbody tr');

    if (listingRows.length === 0) {
      listingRows = document.querySelectorAll('table.resultsTable tbody tr');
    }

    if (listingRows.length === 0) {
      listingRows = document.querySelectorAll('table.dataTable tbody tr');
    }

    if (listingRows.length === 0) {
      listingRows = document.querySelectorAll('tbody tr');
    }

    listingRows.forEach((row) => {
      row.style.backgroundColor = '';
      row.style.borderLeft = '';
    });
  }
}

// Initialize Navica Tools
const navicaTools = new NavicaTools();
console.log('🔧 Navica Tools initialized');
