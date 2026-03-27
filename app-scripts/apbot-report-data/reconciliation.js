/**
 * This script runs automatically when a user edits the spreadsheet.
 * It checks if a relevant control cell was edited and, if so,
 * updates the visibility of various row ranges.
 *
 * @param {Object} e The event object passed to onEdit.
 */
function onEdit(e) {
  const sheetName = 'reconciliation-chart';
  const controlCellsA1 = ['L26', 'L27', 'L28', 'O26', 'O27'];

  // Get the range that was just edited
  const range = e.range;
  const editedSheet = range.getSheet();

  // Check if the edit happened on the correct sheet and in a control cell
  if (
    editedSheet.getName() === sheetName &&
    controlCellsA1.indexOf(range.getA1Notation()) !== -1
  ) {
    // If a control cell was edited, update all row visibility
    updateRowVisibility();
  }
}

/**
 * Updates the visibility of all relevant row sections based on the
 * current state of the control checkboxes.
 */
function updateRowVisibility() {
  const sheetName = 'reconciliation-chart';
  const dataSheetName = 'reconciliation';
  const summarySignificantFactsSheetName = 'summary-significant-facts';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const reconSheet = ss.getSheetByName(dataSheetName);
  const summarySignificantFactsSheet = ss.getSheetByName(
    summarySignificantFactsSheetName
  );

  if (!sheet) {
    Logger.log(`Error: Sheet named "${sheetName}" not found.`);
    return;
  }

  // --- 1. Get the state of all control checkboxes ---
  const showSales = sheet.getRange('L26').getValue(); // Sales Approach
  const showCost = sheet.getRange('L27').getValue(); // Cost Approach
  const showIncome = sheet.getRange('L28').getValue(); // Income Approach

  const showLand = sheet.getRange('O26').getValue(); // Show Land?
  const showImprovements = sheet.getRange('O27').getValue(); // Show Improvements?

  // --- 2. Apply visibility logic for each section ---

  // Cost Approach (Rows 2-4)
  // Range: ReconciliationChartCostRange
  if (showCost === true) {
    sheet.showRows(2, 3); // Start row 2, show 3 rows
  } else {
    sheet.hideRows(2, 3);
  }

  // Income Approach (Rows 10-11)
  // Range: ReconciliationChartIncomeRange
  if (showIncome === true) {
    sheet.showRows(10, 2); // Start row 10, show 2 rows
  } else {
    sheet.hideRows(10, 2);
  }

  // Weights Section (Rows 14-16)
  // Range: ReconciliationChartWeightsRange
  // Logic: Show/hide each weight row individually based on its approach.

  // Row 14: Cost Weight
  if (showCost === true) {
    sheet.showRows(14);
  } else {
    sheet.hideRows(14);
  }

  // Row 15: Sales Weight
  if (showSales === true) {
    sheet.showRows(15);
  } else {
    sheet.hideRows(15);
  }

  // Row 16: Income Weight
  if (showIncome === true) {
    sheet.showRows(16);
  } else {
    sheet.hideRows(16);
  }

  // Sales Approach (Rows 5-9) - with nested logic
  // Range: ReconciliationChartSalesRange
  if (showSales === true) {
    // First, show the entire block
    sheet.showRows(5, 5); // Start row 5, show 5 rows
    const showBoth = showLand && showImprovements;

    // Now, apply nested logic for Improvements and Land (Row 6-7)
    // Only show itemized if both are there
    if (showBoth) {
      sheet.showRows(6);
      sheet.showRows(7);
    } else {
      sheet.hideRows(6);
      sheet.hideRows(7);
    }
  } else {
    // If Sales Approach is hidden, hide the whole block
    sheet.hideRows(5, 5);
  }

  // --- 3. Apply visibility to ReconciliationData sheet ---

  // Check if the 'reconciliation' sheet was found
  if (!reconSheet) {
    Logger.log(`Error: Sheet named "${dataSheetName}" not found.`);
    return; // Exit if the data sheet isn't found
  }

  // Show/Hide Row 2 (Cost) on 'reconciliation' sheet
  if (showCost === true) {
    reconSheet.showRows(2);
  } else {
    reconSheet.hideRows(2);
  }

  // Show/Hide Row 3 (Sales) on 'reconciliation' sheet
  if (showSales === true) {
    reconSheet.showRows(3);
  } else {
    reconSheet.hideRows(3);
  }

  // Show/Hide Row 4 (Income) on 'reconciliation' sheet
  if (showIncome === true) {
    reconSheet.showRows(4);
  } else {
    reconSheet.hideRows(4);
  }

  // --- 4. Apply visibility to SummarySignificantFacts sheet ---
  if (showSales && showLand && !showImprovements) {
    summarySignificantFactsSheet.hideRows(8, 3);
  } else {
    summarySignificantFactsSheet.showRows(8, 3);
  }

  if (showCost) {
    summarySignificantFactsSheet.showRows(14);
  } else {
    summarySignificantFactsSheet.hideRows(14);
  }

  if (showSales) {
    summarySignificantFactsSheet.showRows(15);
  } else {
    summarySignificantFactsSheet.hideRows(15);
  }

  if (showIncome) {
    summarySignificantFactsSheet.showRows(16);
  } else {
    summarySignificantFactsSheet.hideRows(16);
  }
}
