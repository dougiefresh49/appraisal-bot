/**
 * Removes a specified comparable column, shifting subsequent columns and calculations.
 */
function removeCompColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); 
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();

  // 1. --- Validate Sheet Name ---
if (!isValidAdjSheet(sheetName)) {
    ui.alert("This function can only be run on 'land-adjustments', 'rentals-adjustments' or 'sales-adjustments' sheets.");
    return; 
  }

  const firstCompColumn = 3; // Column C
  const compHeaderRow = 3; // Row where comp numbers (1, 2, 3...) are
  const adjMeanLabel = "Adjusted Mean $ / SF"; // Used only to find calc block start row
  const startSearchColumnA = 1; // Column A

  // 2. --- Find Last Comp Column ---
  const headerRowValues = sheet.getRange(compHeaderRow, 1, 1, sheet.getMaxColumns()).getValues()[0];
  let lastCompColumn = firstCompColumn - 1; 
  let firstCompNum = Infinity;
  let lastCompNum = -Infinity;
  let compColIndices = []; 

  for (let col = firstCompColumn - 1; col < headerRowValues.length; col++) { 
      const val = headerRowValues[col];
      if (val !== "" && !isNaN(Number(val))) { 
          const compNum = Number(val);
          lastCompColumn = col + 1; 
          compColIndices.push(lastCompColumn); 
          if (compNum < firstCompNum) firstCompNum = compNum;
          if (compNum > lastCompNum) lastCompNum = compNum;
      } else if (lastCompColumn >= firstCompColumn) {
          break; 
      }
  }

  if (lastCompColumn < firstCompColumn) {
      ui.alert(`Could not find any comp number in Row ${compHeaderRow} starting from Column C.`);
      return;
  }
  Logger.log(`Detected Comps from Col ${compColIndices[0]} to ${lastCompColumn}. Numbers ${firstCompNum} to ${lastCompNum}.`);

  // 3. --- Prompt User for Comp Number to Remove ---
  const promptTitle = "Remove Comparable";
  const promptText = `Enter the Comp Number to remove (between ${firstCompNum} and ${lastCompNum}):`;
  const promptResponse = ui.prompt(promptTitle, promptText, ui.ButtonSet.OK_CANCEL);

  if (promptResponse.getSelectedButton() !== ui.Button.OK) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Removal cancelled.', 'Info', 3);
    return;
  }

  const compNumToRemove = parseInt(promptResponse.getResponseText(), 10);

  // 4. --- Validate Input and Find Column Index ---
  if (isNaN(compNumToRemove) || compNumToRemove < firstCompNum || compNumToRemove > lastCompNum) {
    ui.alert(`Invalid input. Please enter a number between ${firstCompNum} and ${lastCompNum}.`);
    return;
  }

  let colToRemove = -1;
  for (let col = firstCompColumn; col <= lastCompColumn; col++) {
      // Check if cell exists before getting value
      if (col <= sheet.getMaxColumns() && sheet.getRange(compHeaderRow, col).getValue() == compNumToRemove) {
          colToRemove = col;
          break;
      }
  }


  if (colToRemove === -1) {
      ui.alert(`Could not find column for Comp Number ${compNumToRemove}.`);
      return;
  }
  const colLetter = sheet.getRange(1, colToRemove).getA1Notation().replace(/[0-9]/g, ''); // Get column letter
  Logger.log(`Identified column ${colToRemove} (${colLetter}) for removal (Comp ${compNumToRemove}).`);

  // 5. --- Find Calculation Block Start Row (Needed for confirmation message clarity) ---
  const searchRangeA = sheet.getRange(1, startSearchColumnA, sheet.getLastRow(), 1);
  const valuesA = searchRangeA.getValues();
  const lastSheetRow = sheet.getLastRow(); 
  let adjMeanRow = -1;
  for (let i = 0; i < valuesA.length; i++) {
    if (valuesA[i][0] === adjMeanLabel) {
      adjMeanRow = i + 1; 
      break;
    }
  }
  // Note: We don't strictly need adjMeanRow for the deletion logic anymore, but keep it for context.

  // 6. --- Confirmation ---
   const confirmResponse = ui.alert(
     `Confirm Removal: Comp ${compNumToRemove} (Column ${colLetter})`,
     `Are you sure you want to remove this comparable column? Subsequent columns (including calculations) will shift left. This cannot be undone easily.`,
     ui.ButtonSet.YES_NO);

   if (confirmResponse !== ui.Button.YES) {
     SpreadsheetApp.getActiveSpreadsheet().toast('Removal cancelled.', 'Info', 3);
     return;
   }

  // --- Perform Removal ---
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Removing Comp ${compNumToRemove}...`, 'Working', -1);
    const numCalcRowsMove = lastSheetRow - adjMeanRow + 1;
    const sourceCalcRange = sheet.getRange(adjMeanRow, colToRemove, numCalcRowsMove, 1);
    const targetCalcRange = sheet.getRange(adjMeanRow, colToRemove - 1, numCalcRowsMove, 1); 
    Logger.log(`Moving calculation block from ${sourceCalcRange.getA1Notation()} to ${targetCalcRange.getA1Notation()}`);
    sourceCalcRange.moveTo(targetCalcRange); 

    // --- Delete the identified column ---
    // Sheets will automatically shift columns to the right of the deleted column
    // one position to the left. This includes other comps and the calculation block.
    Logger.log(`Deleting column ${colToRemove} (${colLetter})`);
    sheet.deleteColumn(colToRemove); 

    SpreadsheetApp.getActiveSpreadsheet().toast(`Comp ${compNumToRemove} removed.`, 'Success', 5); 

  } catch (e) {
    Logger.log(`Error in removeCompColumn: ${e}`);
    SpreadsheetApp.getActiveSpreadsheet().toast('Error removing column. Check Logs.', 'Error', 10);
    ui.alert(`An error occurred: ${e.message}. Check Extensions > Apps Script > Executions for details.`);
  }
}
