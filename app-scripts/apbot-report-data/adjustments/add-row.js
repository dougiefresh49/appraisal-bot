/**
 * Inserts a new pair of rows for property adjustments, copying formatting,
 * validation, and formulas. Handles blank rows above Total Adjustment.
 * Dynamically finds the last comp column based on Row 3.
 * Assumes SUM formula in Total Adjustment row is dynamic.
 */
function addAdjustmentRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); 
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();

  // --- Basic Sheet Name Check ---
  if (!isValidAdjSheet(sheetName)){
    return; 
  }

  const totalAdjustmentLabel = "Total Adjustment";
  const propertyAdjustmentsLabel = "PROPERTY ADJUSTMENTS"; 
  const startSearchColumn = 1; // Column A
  const firstDataColumn = 3; // Column C (fixed start)

  // --- Dynamically Find Last Data Column based on Row 3 ---
  const headerRowValues = sheet.getRange(3, 1, 1, sheet.getMaxColumns()).getValues()[0];
  let lastDataColumn = firstDataColumn - 1; // Initialize to before the first data column
  for (let col = headerRowValues.length - 1; col >= firstDataColumn - 1; col--) { // Iterate backwards from last possible column
      if (headerRowValues[col] !== "") {
          lastDataColumn = col + 1; // Found the last non-blank column (1-based index)
          break;
      }
  }

  if (lastDataColumn < firstDataColumn) {
      ui.alert("Could not find any data in Row 3 starting from Column C.");
      return;
  }
  const numDataCols = lastDataColumn - firstDataColumn + 1;
  Logger.log(`Last data column detected: ${lastDataColumn}, Number of data columns: ${numDataCols}`);


  // --- Define Named Function Call Structure ---
  const adjustmentFunctionName = "GET_ADJUSTMENT_DATA"; 
  let sourceTableName;
  if (sheetName.toLowerCase().includes("rentals")) {
    sourceTableName = "CompsRentals";
  } else if (sheetName.toLowerCase().includes("sales")) {
    sourceTableName = "CompsSales";
  } else {
    // Should not happen due to earlier check, but keep for safety
    ui.alert("Could not determine source table (Rentals/Sales) based on sheet name.");
    return;
  }
  const sourceHeaderArg = `${sourceTableName}[#Headers]`;
  const sourceDataArg = `${sourceTableName}[#Data]`; 
  const subjectHeaderArg = "Subject[#Headers]";
  const subjectDataArg = "Subject[#Data]"; 

  // --- Define Data Validation ---
  const adjValSheetName = "'adj vals'"; 
  const adjValRange = `${adjValSheetName}!$D$4:$D$14`;
  let percentageValidationRule;
  try {
    const range = ss.getRange(adjValRange); 
    percentageValidationRule = SpreadsheetApp.newDataValidation()
                                  .requireValueInRange(range, true) 
                                  .setAllowInvalid(false) 
                                  .build();
  } catch (e) {
     ui.alert(`Error creating dropdown validation. Check if sheet "${adjValSheetName}" and range "${adjValRange}" exist.`);
     Logger.log(`Validation Error: ${e}`);
     return;
  }

  // Find the boundary rows
  const searchRange = sheet.getRange(1, startSearchColumn, sheet.getLastRow(), 1);
  const values = searchRange.getValues(); 
  let totalAdjustmentRowIndex = -1;
  let propertyAdjRowIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (propertyAdjRowIndex === -1 && values[i][0] === propertyAdjustmentsLabel) {
        propertyAdjRowIndex = i + 1; 
    }
    if (values[i][0] === totalAdjustmentLabel) {
      totalAdjustmentRowIndex = i + 1; 
      break; 
    }
  }

  if (totalAdjustmentRowIndex === -1 || propertyAdjRowIndex === -1) {
    ui.alert(`Could not find boundary labels "${propertyAdjustmentsLabel}" or "${totalAdjustmentLabel}" in Column A.`);
    return;
  }

  // Find last valid adjustment row pair to use as reference
  let refRow1 = -1; 
  let refRow2 = -1; 
  for (let i = totalAdjustmentRowIndex - 1; i > propertyAdjRowIndex; i--) {
      if (values[i - 1][0] !== '') { 
          refRow1 = i;       
          refRow2 = i + 1;   
          if (refRow2 >= totalAdjustmentRowIndex) {
              refRow1 = -1; 
              refRow2 = -1;
              continue; 
          }
          break; 
      }
  }

  if (refRow1 === -1 || refRow1 <= propertyAdjRowIndex) {
     ui.alert('Could not find a valid adjustment row pair above "Total Adjustment" to copy formatting from.');
     return;
  }
  
  Logger.log(`Using rows ${refRow1} and ${refRow2} as reference for copy.`);

  // --- Perform the insertion and formatting ---
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Adding adjustment rows...', 'Working', -1); 

    // Insert rows BEFORE the Total Adjustment row
    sheet.insertRowsBefore(totalAdjustmentRowIndex, 2);

    // New row indices (where the blank rows now are)
    // If Total Adjustment was row 35, new rows are 35, 36. Total moves to 37.
    // Start adding 1 row before Total Adjustment row
    const newRow1 = totalAdjustmentRowIndex - 1; 
    const newRow2 = totalAdjustmentRowIndex;

    // --- Column A (Label) ---
    const newRangeA = sheet.getRange(newRow1, 1, 2, 1);
    const refRangeA = sheet.getRange(refRow1, 1, 2, 1); 
    refRangeA.copyTo(newRangeA, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    refRangeA.copyTo(newRangeA, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    newRangeA.setBorder(true, null, null, null, null, null, null, SpreadsheetApp.BorderStyle.SOLID_MEDIUM); 
    newRangeA.mergeVertically(); 
    newRangeA.clearContent(); 

    // --- Column B (Subject Value) ---
    const newRangeB = sheet.getRange(newRow1, 2, 2, 1);
    const refRangeB = sheet.getRange(refRow1, 2, 2, 1); 
    refRangeB.copyTo(newRangeB, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    newRangeB.mergeVertically();
    const subjectFormula = `=${adjustmentFunctionName}(${subjectHeaderArg}, ${subjectDataArg})`;
    newRangeB.setFormula(subjectFormula);

    // --- Columns C to Last Data Column (Comp Value & Percentage) ---
    // Use dynamic numDataCols here
    const valueRowRange = sheet.getRange(newRow1, firstDataColumn, 1, numDataCols);
    const percentRowRange = sheet.getRange(newRow2, firstDataColumn, 1, numDataCols);
    const refValueRowRange = sheet.getRange(refRow1, firstDataColumn, 1, numDataCols); 
    const refPercentRowRange = sheet.getRange(refRow2, firstDataColumn, 1, numDataCols); 

    refValueRowRange.copyTo(valueRowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    refPercentRowRange.copyTo(percentRowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

    const compFormula = `=${adjustmentFunctionName}(${sourceHeaderArg}, ${sourceDataArg})`;
    valueRowRange.setFormula(compFormula); // Applies formula across the dynamic range

    percentRowRange.setDataValidation(percentageValidationRule); // Applies validation across the dynamic range
    percentRowRange.clearContent(); 

    SpreadsheetApp.getActiveSpreadsheet().toast('Adjustment rows added.', 'Success', 5); 

  } catch (e) {
    Logger.log(`Error in addAdjustmentRow: ${e}`);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error adding rows. Check Logs.', 'Error', 10);
    ui.alert(`An error occurred: ${e.message}. Check Extensions > Apps Script > Executions for details.`);
  }
}