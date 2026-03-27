/**
 * (Helper Function - Called by Named Function)
 * Retrieves and formats data from a source Named Range (headers assumed in row 1).
 * Prioritizes returning the source cell's display value, except for Date of Sale formatting.
 *
 * @param {string} sourceRangeName Name of the Named Range (e.g., "CompsSales"). Headers must be row 1.
 * @param {string} filterValueRefA1 A1 notation string of the cell containing the filter value/Subj (e.g., "C1").
 * @param {string} targetHeaderRefA1 A1 notation string of the cell containing the target header label (e.g., "A4").
 * @return The retrieved and formatted value, or an error message.
 */
function getSummaryData(sourceRangeName, filterValueRefA1, targetHeaderRefA1) {
  // Ensure inputs are strings
  sourceRangeName = `${String(sourceRangeName)}Range`;
  filterValueRefA1 = String(filterValueRefA1);
  targetHeaderRefA1 = String(targetHeaderRefA1);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- Get Values from Reference Cells ---
    const filterValueCell = ss.getRange(filterValueRefA1);
    const row1Value = filterValueCell.getDisplayValue(); 

    const targetHeaderCell = ss.getRange(targetHeaderRefA1);
    const targetHeaderRaw = targetHeaderCell.getValue().toString().trim(); 

    if (!targetHeaderRaw) return ""; 

    // --- Determine Case and Map Headers ---
    const isSubjectCase = row1Value.toLowerCase().includes("subj");
    const targetHeaderForMatch = (targetHeaderRaw === "Age") ? "Effective Age" : targetHeaderRaw;

    // --- Get Source Data (Headers + Data) ---
    const sourceRange = ss.getRangeByName(sourceRangeName);
    if (!sourceRange) throw new Error(`Named Range "${sourceRangeName}" not found.`);
    
    const allRawData = sourceRange.getValues();
    const allDisplayData = sourceRange.getDisplayValues();

    if (allRawData.length < 1) throw new Error(`Named Range "${sourceRangeName}" is empty.`);
    if (allRawData.length < 2 && !isSubjectCase) throw new Error(`Named Range "${sourceRangeName}" has no data rows for filtering.`);

    // --- Separate Headers and Data ---
    const headers = allRawData[0].map(h => String(h).trim()); 
    const tableRawData = allRawData.slice(1); 
    const tableDisplayData = allDisplayData.slice(1); 

    // --- Find Target Column Index (using potentially mapped header) ---
    const targetColIndex = headers.indexOf(targetHeaderForMatch);
    if (targetColIndex === -1) {
      throw new Error(`Header "${targetHeaderForMatch}" (mapped from "${targetHeaderRaw}") not found in headers of "${sourceRangeName}".`);
    }

    // --- Initialize result variables ---
    let rawValue = null;
    let displayValue = null; 
    let found = false;
    let sourceRowIndexInData = -1; 

    // --- Retrieve Value based on Case ---
    if (isSubjectCase) {
      // --- Subject Case ---
      let subjColIndex = targetColIndex; 

      if (targetHeaderRaw === "Address") {
        subjColIndex = headers.indexOf("AddressLabel");
        if (subjColIndex === -1) throw new Error(`Header "AddressLabel" not found in "${sourceRangeName}" for Subject Address.`);
      } else if (targetHeaderRaw === "Rentable SF") {
        subjColIndex = headers.indexOf("Building Size (SF)");
        if (subjColIndex === -1) throw new Error(`Header "Building Size (SF)" not found in "${sourceRangeName}" for Subject Rentable SF.`);
      }
      
      if (tableRawData.length > 0) {
          sourceRowIndexInData = 0; 
          rawValue = tableRawData[sourceRowIndexInData][subjColIndex];
          displayValue = tableDisplayData[sourceRowIndexInData][subjColIndex];
          found = true;
      }

    } else {
      // --- Non-Subject Case (Filter) ---
      const filterLookupValueNum = parseInt(row1Value, 10);
      if (isNaN(filterLookupValueNum) && typeof filterValueCell.getValue() === 'number') {
           throw new Error(`Filter value "${row1Value}" in ${filterValueRefA1} is not a valid integer number.`);
      } else if (isNaN(filterLookupValueNum) && typeof filterValueCell.getValue() !== 'number') {
           // Allow non-numeric if original wasn't a number (e.g. blank cell)
      }

      const filterColHeader = "#";
      const filterColIndex = headers.indexOf(filterColHeader);
      if (filterColIndex === -1) throw new Error(`Filter column "${filterColHeader}" not found in "${sourceRangeName}".`);

      for (let i = 0; i < tableRawData.length; i++) {
        const cellValue = tableRawData[i][filterColIndex]; 
        if (!isNaN(filterLookupValueNum) && cellValue == filterLookupValueNum) { 
          sourceRowIndexInData = i;
          rawValue = tableRawData[sourceRowIndexInData][targetColIndex]; 
          displayValue = tableDisplayData[sourceRowIndexInData][targetColIndex];
          found = true;
          break; 
        }
      }
    }

    // --- Handle Not Found ---
    if (!found) return ""; 

    // --- Apply Formatting (Prioritize Display Value) ---
    const spreadsheetTimeZone = ss.getSpreadsheetTimeZone();

    switch (targetHeaderRaw) {
      case "Address":
        // Still attempt cleanup, but fall back to displayValue
        try {
          let addressString = String(rawValue); // Use raw value for parsing attempt
          let firstComma = addressString.indexOf(',');
          if (firstComma !== -1) {
            let secondComma = addressString.indexOf(',', firstComma + 1);
            if (secondComma !== -1) {
              return addressString.slice(0, secondComma).replace(',', '');
            }
          }
          return displayValue; // Fallback if cleanup doesn't apply
        } catch (addrErr) {
          return displayValue; // Fallback on error
        }

      case "Date of Sale":
        // Apply specific format only if it's a real date object
        if (rawValue instanceof Date) {
          return Utilities.formatDate(rawValue, spreadsheetTimeZone, "MMM yyyy");
        }
        // Otherwise, return whatever is displayed in the source cell
        return displayValue; 

      default:
        // For ALL other headers, return the display value captured from the source cell
        return displayValue; // <<<<< Returns the formatted value from the source
    }

  } catch (e) {
    Logger.log(`Error in getSummaryDataHelper(${sourceRangeName}, ${filterValueRefA1}, ${targetHeaderRefA1}): ${e.stack || e}`);
    return `Error: ${e.message}`; 
  }
}
