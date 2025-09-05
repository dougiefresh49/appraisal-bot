/**
 * Adds a new comparable column, copying formats/formulas from the previous
 * comp column using separate paste types, applying specific borders, 
 * clearing percentage inputs, shifting calculation columns over, 
 * and clearing the original calculation area.
 */
function addCompColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); 
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();

  // 1. --- Validate Sheet Name ---
  if (!isValidAdjSheet(sheetName)) {
    ui.alert("This function can only be run on 'rentals-adjustments' or 'sales-adjustments' sheets.");
    return; 
  }

  const firstCompColumn = 3; // Column C
  const compHeaderRow = 3; // Row where comp numbers (1, 2, 3...) are
  const adjMeanLabel = "Adjusted Mean $ / SF";
  const startSearchColumnA = 1; // Column A
  
  const transactionAdjLabel = sheetName.toLowerCase().includes("rentals") ? "LEASE ADJUSTMENTS" : "TRANSACTION ADJUSTMENTS";
  const propertyAdjLabel = "PROPERTY ADJUSTMENTS";
  const totalAdjustmentLabel = "Total Adjustment"; 


  // 2. --- Find Last Comp Column ---
  const headerRowValues = sheet.getRange(compHeaderRow, 1, 1, sheet.getMaxColumns()).getValues()[0];
  let lastCompColumn = firstCompColumn - 1; 
  for (let col = headerRowValues.length - 1; col >= firstCompColumn - 1; col--) { 
      if (headerRowValues[col] !== "") {
          lastCompColumn = col + 1; 
          break;
      }
  }
  if (lastCompColumn < firstCompColumn) {
      ui.alert(`Could not find any comp number in Row ${compHeaderRow} starting from Column C.`);
      return;
  }
  Logger.log(`Last comp column detected: ${lastCompColumn}`);

  // 3. --- Find Key Row Indices ---
  const searchRangeA = sheet.getRange(1, startSearchColumnA, sheet.getLastRow(), 1);
  const valuesA = searchRangeA.getValues();
  let adjMeanRow = -1;
  let transactionAdjRow = -1;
  let propertyAdjRow = -1;
  let totalAdjRow = -1; 

  for (let i = 0; i < valuesA.length; i++) {
    const cellValue = valuesA[i][0];
    if (adjMeanRow === -1 && cellValue === adjMeanLabel) {
      adjMeanRow = i + 1; 
    }
    if (transactionAdjRow === -1 && cellValue === transactionAdjLabel) {
      transactionAdjRow = i + 1;
    }
    if (propertyAdjRow === -1 && cellValue === propertyAdjLabel) {
      propertyAdjRow = i + 1;
    }
     if (totalAdjRow === -1 && cellValue === totalAdjustmentLabel) {
      totalAdjRow = i + 1;
    }
    if (adjMeanRow !== -1 && transactionAdjRow !== -1 && propertyAdjRow !== -1 && totalAdjRow !== -1) {
        break;
    }
  }
  if (adjMeanRow === -1 || transactionAdjRow === -1 || propertyAdjRow === -1 || totalAdjRow === -1) {
    ui.alert(`Could not find one or more key labels ("${transactionAdjLabel}", "${propertyAdjLabel}", "${totalAdjustmentLabel}", "${adjMeanLabel}") in Column A.`);
    return;
  }

  const lastSheetRow = sheet.getLastRow(); 
  Logger.log(`Transaction Adj Row: ${transactionAdjRow}, Property Adj Row: ${propertyAdjRow}, Total Adj Row: ${totalAdjRow}, Calc block starts at row: ${adjMeanRow}, Last sheet row: ${lastSheetRow}`);

  // 4. --- Determine Insertion Point and New Column Index ---
  const insertBeforeColumn = lastCompColumn + 1; 
  const newCompColumn = insertBeforeColumn; 

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

  // --- Perform Insertion, Copying, Moving ---
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Adding comp column...', 'Working', -1); 

    // 5. --- Insert New Column ---
    sheet.insertColumnBefore(insertBeforeColumn);
    Logger.log(`Inserted new column at index: ${newCompColumn}`);

    // 6. --- Copy Formatting, Formulas, Validation Separately ---
    const sourceColRange = sheet.getRange(1, lastCompColumn, lastSheetRow, 1); 
    const targetColRange = sheet.getRange(1, newCompColumn, lastSheetRow, 1); 
    
    // Copy Formats first
    sourceColRange.copyTo(targetColRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    Logger.log(`Copied format from column ${lastCompColumn} to ${newCompColumn}`);

    // Copy Formulas (this should adjust relative references)
    sourceColRange.copyTo(targetColRange, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    Logger.log(`Copied formulas from column ${lastCompColumn} to ${newCompColumn}`);

    // Copy Data Validation (might be redundant if format included it, but safe)
    sourceColRange.copyTo(targetColRange, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    Logger.log(`Copied data validation from column ${lastCompColumn} to ${newCompColumn}`);

    // 7. --- Explicitly Copy Bottom Borders for Section Headers ---
    // Re-apply format copy just for these cells to ensure borders are correct
    sheet.getRange(transactionAdjRow, lastCompColumn).copyTo(sheet.getRange(transactionAdjRow, newCompColumn), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false); 
    sheet.getRange(propertyAdjRow, lastCompColumn).copyTo(sheet.getRange(propertyAdjRow, newCompColumn), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false); 
    Logger.log(`Re-applied specific borders for rows ${transactionAdjRow} and ${propertyAdjRow}`);

    // 8. --- Increment Comp Number in Row 3 ---
    const prevCompNumCell = sheet.getRange(compHeaderRow, lastCompColumn);
    const newCompNumCell = sheet.getRange(compHeaderRow, newCompColumn);
    const prevCompNum = prevCompNumCell.getValue();
    if (typeof prevCompNum === 'number') {
      newCompNumCell.setValue(prevCompNum + 1);
      Logger.log(`Set comp number in ${newCompNumCell.getA1Notation()} to ${prevCompNum + 1}`);
    } else {
      newCompNumCell.setValue(""); 
      Logger.log(`Previous comp header in ${prevCompNumCell.getA1Notation()} was not a number. Cleared ${newCompNumCell.getA1Notation()}`);
    }
    
    // 9. --- Clear Content and Apply Validation to Percentage Rows in NEW Column ---
    const sections = [
        { startLabelRow: transactionAdjRow + 1, endLabelRow: propertyAdjRow -1 }, 
        { startLabelRow: propertyAdjRow + 1, endLabelRow: totalAdjRow - 1 } 
    ];

    for (const section of sections) {
        for (let r = section.startLabelRow; r <= section.endLabelRow; r += 2) {
            const percentRow = r + 1;
            if (percentRow <= section.endLabelRow) { 
                const percentCell = sheet.getRange(percentRow, newCompColumn);
                percentCell.clearContent(); // Clear any value copied by PASTE_FORMULA if it wasn't a formula
                percentCell.setDataValidation(percentageValidationRule); // Ensure validation is set
                Logger.log(`Cleared content and set validation for ${percentCell.getA1Notation()}`);
            }
        }
    }

    // 10. --- Move Calculation Block from Original Location ---
    const sourceCalcCol = insertBeforeColumn + 1; 
    const targetCalcCol = sourceCalcCol + 1; 
    const numCalcRowsMove = lastSheetRow - adjMeanRow + 1;

    if (numCalcRowsMove > 0 && sheet.getMaxColumns() >= targetCalcCol) { 
        const sourceCalcRange = sheet.getRange(adjMeanRow, sourceCalcCol, numCalcRowsMove, 1);
        const targetCalcRange = sheet.getRange(adjMeanRow, targetCalcCol, numCalcRowsMove, 1);
        
        Logger.log(`Moving calculation block from ${sourceCalcRange.getA1Notation()} to ${targetCalcRange.getA1Notation()}`);
        sourceCalcRange.moveTo(targetCalcRange); 
        
        // 11. --- Explicitly Clear Original Calculation Area Content ---
        Logger.log(`Clearing original calculation area content: ${sourceCalcRange.getA1Notation()}`);
        try {
            const rangeToClear = sheet.getRange(adjMeanRow, lastCompColumn, numCalcRowsMove, 1); 
            rangeToClear.clearContent(); 
        } catch (clearError) {
            Logger.log(`Could not clear source calculation range ${sourceCalcRange.getA1Notation()} after move: ${clearError}`);
        }

    } else {
        Logger.log(`Skipping move/clear of calculation block. Source Col: ${sourceCalcCol}, Target Col: ${targetCalcCol}, Max Cols: ${sheet.getMaxColumns()}`);
    }


    SpreadsheetApp.getActiveSpreadsheet().toast('Comp column added.', 'Success', 5); 

  } catch (e) {
    Logger.log(`Error in addCompColumn: ${e}`);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error adding column. Check Logs.', 'Error', 10);
    ui.alert(`An error occurred: ${e.message}. Check Extensions > Apps Script > Executions for details.`);
  }
}
