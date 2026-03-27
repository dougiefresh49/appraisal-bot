// Navica Tools - Automation for MLS website tasks
// Shared across both OBR (/377/) and PBBR (/381/) injectors

class NavicaTools {
  constructor() {
    this.subjectData = null;
    this.effectiveDate = '';
    this.searchConfig = {};
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
    if (!window.location.href.includes('next.navicamls.net')) {
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
            sendResponse({ success: true }),
          );
          break;
        case 'addSearchCriteriaNbh':
          this.addSearchCriteriaNbh().then(() =>
            sendResponse({ success: true }),
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
        case 'downloadListings':
          this.downloadListings().then(() => sendResponse({ success: true }));
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
    return new Promise((resolve) => {
      chrome.storage.local.get(['apbotSubjectData', 'apbotEffectiveDate', 'apbotSearchConfig'], (result) => {
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
        this.effectiveDate = result.apbotEffectiveDate || '';
        console.log('📅 Effective date:', this.effectiveDate || '(not set, will use today)');

        this.searchConfig = result.apbotSearchConfig || {};
        console.log('⚙️ Search config:', this.searchConfig);
        resolve();
      });
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
      row.map((cell) => cell.trim().replace(/^"|"$/g, '')),
    );
  }

  // Add search criteria for comps
  async addSearchCriteriaComps() {
    await this.loadSubjectData();
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
    await this.loadSubjectData();
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
      'From_26', // Closing Date From
      'To_26', // Closing Date To
    ];

    for (const fieldId of fieldsToClear) {
      const element = document.getElementById(fieldId);
      if (element) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Clear months back dropdown
    const monthsBack = document.getElementById('monthsBack');
    if (monthsBack) {
      monthsBack.value = '';
      monthsBack.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Clear Property Type multi-select
    const propertyType = document.getElementById('Sections_1__ListingFields_0__V');
    if (propertyType) {
      for (const option of propertyType.options) {
        option.selected = false;
      }
      propertyType.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Clear Property Status multi-select
    const propertyStatus = document.getElementById('Sections_1__ListingFields_5__V');
    if (propertyStatus) {
      for (const option of propertyStatus.options) {
        option.selected = false;
      }
      propertyStatus.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // Strip commas and units from numeric strings before parsing
  parseNum(value) {
    if (!value) return 0;
    // Remove commas, then strip trailing non-numeric text like " sf", " acres"
    const cleaned = String(value).replace(/,/g, '').replace(/\s*(sf|sqft|acres?)$/i, '').trim();
    return parseFloat(cleaned) || 0;
  }

  // Case-insensitive lookup from subject data
  getSubjectField(...keys) {
    for (const key of keys) {
      const val = this.subjectData[key] || this.subjectData[key.toLowerCase()];
      if (val) return val;
    }
    return '';
  }

  getSubjectYearBuilt() {
    const yearBuilt = this.parseNum(this.getSubjectField('Year Built', 'year built'));
    if (yearBuilt > 0) return yearBuilt;

    const age = this.parseNum(this.getSubjectField('Actual Age', 'actual age'));
    if (age > 0) {
      const refYear = this.effectiveDate
        ? parseInt(this.effectiveDate.split('-')[0])
        : new Date().getFullYear();
      return refYear - age;
    }
    return 0;
  }

  // Get search config value with defaults
  getConfigValue(key) {
    const defaults = { glaPercent: 15, yearRange: 10, monthsBack: 12 };
    return this.searchConfig?.[key] ?? defaults[key];
  }

  // Reload search config from storage (called before populating fields)
  async reloadSearchConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apbotSearchConfig'], (result) => {
        this.searchConfig = result.apbotSearchConfig || {};
        console.log('⚙️ Reloaded search config:', this.searchConfig);
        resolve();
      });
    });
  }

  // Format a Date object as mm/dd/yyyy
  formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // Get the effective date as a Date object (falls back to today)
  getEffectiveDate() {
    if (this.effectiveDate) {
      // effectiveDate is yyyy-mm-dd from the date input
      const parts = this.effectiveDate.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  }

  // Populate closing date, property type, and property status fields
  async populateCommonSearchFields() {
    const effDate = this.getEffectiveDate();
    const monthsBack = this.getConfigValue('monthsBack');

    // Closing date range: N months back from effective date to effective date
    const fromDate = new Date(effDate);
    fromDate.setMonth(fromDate.getMonth() - monthsBack);
    const fromStr = this.formatDate(fromDate);
    const toStr = this.formatDate(effDate);

    console.log('Closing date range:', fromStr, 'to', toStr);

    // Set closing date fields (text inputs with datepicker)
    await this.setFieldValue('From_26', fromStr);
    await this.setFieldValue('To_26', toStr);

    // Set Property Type to Single Family (RS)
    const propertyType = document.getElementById('Sections_1__ListingFields_0__V');
    if (propertyType) {
      for (const option of propertyType.options) {
        option.selected = (option.value === 'RS');
      }
      propertyType.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Property Type set to Single Family (RS)');
    }

    // Set Property Status to A, M, P, O, U, S, T
    const statusValues = ['A', 'M', 'P', 'O', 'U', 'S', 'T'];
    const propertyStatus = document.getElementById('Sections_1__ListingFields_5__V');
    if (propertyStatus) {
      for (const option of propertyStatus.options) {
        option.selected = statusValues.includes(option.value);
      }
      propertyStatus.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Property Status set to:', statusValues.join(', '));
    }
  }

  async populateCompSearchCriteria() {
    // Reload config from storage (sidepanel saves it right before sending action)
    await this.reloadSearchConfig();

    const currentYear = new Date().getFullYear();
    const gla = this.parseNum(this.getSubjectField('Gross Living Area', 'gross living area'));
    const subjectYearBuilt = this.getSubjectYearBuilt();
    let siteSize = this.parseNum(this.getSubjectField('Site', 'site'));

    // Get configurable values
    const glaPercent = this.getConfigValue('glaPercent') / 100;
    const yearRange = this.getConfigValue('yearRange');

    console.log('Comp search - gla:', gla, 'yearBuilt:', subjectYearBuilt, 'siteSize (raw):', siteSize,
      'glaPercent:', glaPercent, 'yearRange:', yearRange);

    // Convert site size from sf to acres if needed (assuming sf if > 1)
    if (siteSize > 1) {
      siteSize = siteSize / 43560; // Convert sf to acres
    }

    // Calculate ranges using configurable percentages
    const sqftMin = Math.round(gla * (1 - glaPercent));
    const sqftMax = Math.round(gla * (1 + glaPercent));
    const yearMin = subjectYearBuilt - yearRange;
    const yearMax = Math.min(subjectYearBuilt + yearRange, currentYear);
    const acresMin = Math.round(siteSize * 0.85 * 100) / 100;
    const acresMax = Math.round(siteSize * 2 * 100) / 100;

    // Populate fields
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_0_',
      sqftMin.toString(),
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_2__V_1_',
      sqftMax.toString(),
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_0_',
      yearMin.toString(),
    );
    await this.setFieldValue(
      'Sections_1__ListingFields_12__V_1_',
      yearMax.toString(),
    );
    // Note: only set the site size parameters if the site is larger than normal residential lot size
    if (siteSize > 0.19) {
      await this.setFieldValue(
        'Sections_1__ListingFields_13__V_0_',
        acresMin.toString(),
      );
      await this.setFieldValue(
        'Sections_1__ListingFields_13__V_1_',
        acresMax.toString(),
      );
    }

    // Populate closing date, property type, and property status
    await this.populateCommonSearchFields();
  }

  async populateNbhSearchCriteria() {
    // Reload config for months back value
    await this.reloadSearchConfig();
    // For neighborhood search, only populate property type, status, and closing date
    // Leave sqft, year built, and acreage empty to capture the full neighborhood
    await this.populateCommonSearchFields();
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
            `Attempt ${attempts + 1}: Print button not found, waiting...`,
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
            }: Market Conditions checkbox not found, waiting...`,
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
            'input[type="submit"][value="Run Report"]',
          );
          if (!runReportBtn) {
            console.log(
              `Attempt ${attempts + 1}: Run Report button not found, waiting...`,
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
            'attempts',
          );
          this.clearQueue();
        }
      } else {
        console.warn(
          'Market Conditions checkbox not found after',
          maxAttempts,
          'attempts',
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
            `Attempt ${attempts + 1}: CSV export button not found, waiting...`,
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
          'input[value="ViewExport"]',
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
          'attempts',
        );
        this.clearQueue();
      }
    } else {
      console.log('❌ Not on export page, clearing queue');
      this.clearQueue();
    }
  }

  // Ensure all listings are selected via the master checkbox
  async ensureAllSelected() {
    const masterCheckbox = document.querySelector('.masterListingItemCheckBox');
    if (masterCheckbox && !masterCheckbox.checked) {
      console.log('☑️ Checking "Select All" checkbox...');
      masterCheckbox.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async saveStats() {
    try {
      await this.ensureAllSelected();

      // Click the Stats icon
      const statsIcon = document.querySelector(
        '.jsQuickStatsForSelectedListings',
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
          'Stats icon not found. Please ensure you are on the search results page.',
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
      await this.ensureAllSelected();

      // Click the Reports icon
      const reportsIcon = document.querySelector(
        '.jsReportsForSelectedListings',
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
          'Reports icon not found. Please ensure you are on the search results page.',
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
      await this.ensureAllSelected();

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
          'Export icon not found. Please ensure you are on the search results page.',
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
          'input[type="submit"][value="Export"]',
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

  // --- Download Listings as PDF ---

  async waitForTaxIdLink(maxWaitMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const containers = document.querySelectorAll(
        '.exp-HeaderAndFieldContainer',
      );
      for (const container of containers) {
        const label = container.querySelector('label');
        const valueSpan = container.querySelector('span');
        if (
          label &&
          valueSpan &&
          label.textContent.trim() === 'Tax ID:' &&
          valueSpan.querySelector('a')
        ) {
          return true;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }

  async retryTaxIdWithPrevNext() {
    console.log('🔄 Tax ID not linked, trying prev/next workaround...');
    const prevBtn = document.querySelector('#prevButton');
    const nextBtn = document.querySelector('#nextButton');

    if (prevBtn && prevBtn.style.display !== 'none') {
      prevBtn.click();
      await new Promise((r) => setTimeout(r, 2500));
      const nextAfterPrev = document.querySelector('#nextButton');
      if (nextAfterPrev) nextAfterPrev.click();
      await new Promise((r) => setTimeout(r, 2500));
    } else if (nextBtn && nextBtn.style.display !== 'none') {
      nextBtn.click();
      await new Promise((r) => setTimeout(r, 2500));
      const prevAfterNext = document.querySelector('#prevButton');
      if (prevAfterNext) prevAfterNext.click();
      await new Promise((r) => setTimeout(r, 2500));
    }

    return this.waitForTaxIdLink(8000);
  }

  async waitForSequenceChange(currentSeq) {
    return new Promise((resolve) => {
      const seqEl = document.querySelector('#JsDisplaySequence span');
      if (!seqEl) {
        setTimeout(resolve, 3000);
        return;
      }

      const timeout = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 15000);

      const observer = new MutationObserver(() => {
        const newSeq = seqEl.textContent.trim();
        if (newSeq !== currentSeq) {
          observer.disconnect();
          clearTimeout(timeout);
          resolve();
        }
      });
      observer.observe(seqEl.parentElement || seqEl, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
  }

  sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, ' ').trim();
  }

  async sendMessageToBackground(action, data = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            `Background message error (${action}):`,
            chrome.runtime.lastError.message,
          );
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }

  async downloadListings() {
    const expandedWrapper = document.querySelector('#expandedDisplayWrapper');
    if (!expandedWrapper) {
      alert(
        'Download Listings requires the Expanded View page. Navigate to a listing first.',
      );
      return;
    }

    const seqSpan = document.querySelector('#JsDisplaySequence span');
    const seqMatch = seqSpan
      ? seqSpan.textContent.trim().match(/Viewing\s+(\d+)\s+of\s+(\d+)/)
      : null;
    const totalListings = seqMatch ? parseInt(seqMatch[2], 10) : '?';

    console.log(`📥 Starting download of ${totalListings} listings as PDF...`);

    // chrome.downloads only accepts paths relative to the downloads directory,
    // so we just use a simple "comps" subfolder there.
    const compsDir = 'comps';

    // Attach debugger once for the whole batch
    const attachResult = await this.sendMessageToBackground('debuggerAttach');
    if (!attachResult.success) {
      alert('Failed to attach debugger: ' + (attachResult.error || 'unknown'));
      return;
    }

    let downloadCount = 0;

    try {
      while (true) {
        // Wait for the Tax ID to be hyperlinked (mls-injector-obr.js has finished)
        let linked = await this.waitForTaxIdLink(10000);
        if (!linked) {
          linked = await this.retryTaxIdWithPrevNext();
        }
        if (!linked) {
          console.warn(
            '⚠️ Tax ID link not found after retries, printing anyway...',
          );
        }

        // Extra delay for the page title to update
        await new Promise((r) => setTimeout(r, 500));

        // Use the page title as the filename
        const pageTitle = document.title || 'listing';
        const filename =
          compsDir + '/' + this.sanitizeFilename(pageTitle) + '.pdf';

        console.log(`📄 Printing listing ${downloadCount + 1}: "${pageTitle}"`);

        const printResult = await this.sendMessageToBackground('printToPdf', {
          filename,
        });
        if (!printResult.success) {
          console.error('❌ PDF print failed:', printResult.error);
        } else {
          downloadCount++;
          console.log(`✅ Saved: ${filename}`);
        }

        // Check if Next button is available
        const nextBtn = document.querySelector(
          '#stickyButtonWrapper #nextButton',
        );
        if (!nextBtn || nextBtn.style.display === 'none') {
          console.log('🏁 No more listings (Next button hidden). Done.');
          break;
        }

        // Record current sequence before clicking Next
        const currentSeqEl = document.querySelector(
          '#JsDisplaySequence span',
        );
        const currentSeq = currentSeqEl
          ? currentSeqEl.textContent.trim()
          : '';

        nextBtn.click();
        console.log('➡️ Clicked Next, waiting for page update...');

        await this.waitForSequenceChange(currentSeq);
        // Additional settle time for DOM + mls-injector-obr.js observer delay
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (error) {
      console.error('❌ Download listings error:', error);
    } finally {
      // Detach debugger when done
      await this.sendMessageToBackground('debuggerDetach');
      console.log(
        `📥 Download complete. Saved ${downloadCount} listing PDF(s).`,
      );
    }
  }

  // Highlight listings functionality
  async highlightListings() {
    await this.loadSubjectData();
    if (!this.subjectData) {
      alert('Please load subject data first in the Subject Data section.');
      return;
    }

    try {
      console.log('🎯 Starting highlight process...');

      // Wait a moment for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const subjectGla = this.parseNum(this.getSubjectField('Gross Living Area', 'gross living area'));
      const subjectYearBuilt = this.getSubjectYearBuilt();

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
          listingRows.length,
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
          'No listing rows found. Please ensure you are on the search results page with listings displayed.',
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
          `Row ${index}: MLS=${mlsNumber}, Status=${propertyStatus}, Sqft=${sqft}, Year=${yearBuilt}, Close=${closingDate}`,
        );

        // Parse closing date
        let daysFromToday = 9999; // Default for active listings
        if (closingDate && closingDate !== '') {
          const closeDate = new Date(closingDate);
          if (!isNaN(closeDate.getTime())) {
            daysFromToday = Math.abs(
              Math.floor((today - closeDate) / (1000 * 60 * 60 * 24)),
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
        (l) => l.propertyStatus === 'A',
      ).length;
      const underContractCount = listings.filter(
        (l) => l.propertyStatus === 'U' || l.propertyStatus === 'C',
      ).length;
      const closedCount = listings.filter(
        (l) => l.propertyStatus === 'S',
      ).length;

      console.log(
        `📊 Summary: ${activeCount} active, ${underContractCount} under contract, ${closedCount} closed sales`,
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
