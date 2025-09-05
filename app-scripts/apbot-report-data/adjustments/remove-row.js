/**
 * Removes the selected adjustment row pair (selected row + row below)
 * after validating the selection.
 */
function removeSelectedAdjustmentRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();

  // 1. --- Validate Sheet Name ---
  if (!isValidAdjSheet(sheetName)) {
    ui.alert("This function can only be run on 'rentals-adjustments' or 'sales-adjustments' sheets.");
    return; 
  }

  // 2. --- Validate Active Cell Selection ---
  const activeCell = sheet.getActiveCell();
  const activeRow = activeCell.getRow();
  const activeCol = activeCell.getColumn();

  if (activeCol !== 1) { // Must select in Column A
    ui.alert("Please select a cell in Column A (the adjustment label) to remove the corresponding rows.");
    return;
  }
  
  if (activeCell.isBlank()) {
     ui.alert("Please select the cell containing the adjustment label, not a blank cell.");
     return;
  }

  // 3. --- Find Boundaries ---
  const propertyAdjustmentsLabel = "PROPERTY ADJUSTMENTS";
  const totalAdjustmentLabel = "Total Adjustment";
  const startSearchColumn = 1; // Column A

  const searchRange = sheet.getRange(1, startSearchColumn, sheet.getLastRow(), 1);
  const values = searchRange.getValues();
  let propertyAdjRowIndex = -1;
  let totalAdjRowIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (propertyAdjRowIndex === -1 && values[i][0] === propertyAdjustmentsLabel) {
      propertyAdjRowIndex = i + 1; // 1-based index
    } else if (values[i][0] === totalAdjustmentLabel) {
      totalAdjRowIndex = i + 1; // 1-based index
      break; // Stop searching once Total Adjustment is found
    }
  }

  if (propertyAdjRowIndex === -1 || totalAdjRowIndex === -1) {
    ui.alert(`Could not find boundary labels "${propertyAdjustmentsLabel}" or "${totalAdjustmentLabel}" in Column A.`);
    return;
  }

  // 4. --- Validate Row is Within Boundaries ---
  if (activeRow <= propertyAdjRowIndex || activeRow >= totalAdjRowIndex) {
     ui.alert(`Please select an adjustment label between row ${propertyAdjRowIndex + 1} and row ${totalAdjRowIndex - 1}.`);
     return;
  }
  
  // 5. --- Confirmation ---
  const selectedLabel = activeCell.getValue() || `Row ${activeRow}`; 
  const response = ui.alert(
     `Remove Adjustment: ${selectedLabel}`,
     `Are you sure you want to remove this adjustment row and the row below it (Rows ${activeRow} and ${activeRow + 1})?`,
     ui.ButtonSet.YES_NO);

  // 6. --- Delete Rows ---
  if (response == ui.Button.YES) {
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(`Removing rows ${activeRow} and ${activeRow + 1}...`, 'Working', -1);
      sheet.deleteRows(activeRow, 2); 
      SpreadsheetApp.getActiveSpreadsheet().toast('Rows removed.', 'Success', 5);
    } catch (e) {
      Logger.log(`Error in removeSelectedAdjustmentRow: ${e}`);
      SpreadsheetApp.getActiveSpreadsheet().toast('Error removing rows. Check Logs.', 'Error', 10);
      ui.alert(`An error occurred while removing rows: ${e.message}`);
    }
  } else {
     SpreadsheetApp.getActiveSpreadsheet().toast('Removal cancelled.', 'Info', 3);
  }
}
