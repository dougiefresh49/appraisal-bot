/**
 * Shows the comp editor sidebar for editing land sale data
 */
function showCompEditorSidebar() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile(
    'comp-editor/comp-editor-sidebar'
  )
    .setTitle('Comp Editor')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Gets the current comp data for editing by parsing the formula
 */
function getCurrentCompData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const uiSheet = ss.getSheetByName('land-sales-ui');

    if (!uiSheet) {
      return { success: false, error: 'land-sales-ui sheet not found' };
    }

    // Get the active cell to determine which comp to edit
    const activeCell = uiSheet.getActiveCell();
    const activeRow = activeCell.getRow();
    const activeCol = activeCell.getColumn();

    // Get the formula from the active cell
    const cellFormula = activeCell.getFormula();

    // Parse the formula to extract the cell reference and get the sale number
    const saleNumber = parseSaleNumberFromFormula(cellFormula, uiSheet);

    if (!saleNumber) {
      return {
        success: false,
        error:
          'Please select a cell with a GET_DETAIL_DATA formula. The formula should look like: =GET_DETAIL_DATA(CompsLand[#HEADERS], CompsLand, L30)',
      };
    }

    // Get the land sales data
    const landSalesSheet = ss.getSheetByName('land comps');
    if (!landSalesSheet) {
      return { success: false, error: 'land comps sheet not found' };
    }

    // Find the row with this comp number
    const compData = findCompByNumber(landSalesSheet, saleNumber);
    if (!compData) {
      return {
        success: false,
        error: `Comp #${saleNumber} not found in land comps sheet`,
      };
    }

    // Get the parcel data for this comp
    const parcelData = getParcelDataForComp(ss, saleNumber);

    return {
      success: true,
      saleNumber: saleNumber,
      compData: compData,
      parcelData: parcelData,
      activeCell: {
        row: activeRow,
        col: activeCol,
        value: activeCell.getValue(),
        formula: cellFormula,
      },
    };
  } catch (error) {
    Logger.log('Error in getCurrentCompData: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Parses the sale number from a GET_DETAIL_DATA formula
 * Formula format: =GET_DETAIL_DATA(CompsLand[#HEADERS], CompsLand, L30)
 * Returns the actual value from the cell reference (e.g., gets value from cell L30)
 */
function parseSaleNumberFromFormula(formula, sheet) {
  try {
    // Check if it's a GET_DETAIL_DATA formula
    if (!formula.includes('GET_DETAIL_DATA')) {
      return null;
    }

    // Extract the last parameter (e.g., L30 from L30)
    const match = formula.match(
      /GET_DETAIL_DATA\([^,]+,\s*[^,]+,\s*([A-Z]+(\d+))\)/
    );

    if (match && match[1]) {
      const cellReference = match[1]; // e.g., "L30"

      try {
        // Get the actual value from the referenced cell
        const cellValue = sheet.getRange(cellReference).getValue();

        // Check if the cell value is a valid number
        if (cellValue && !isNaN(cellValue)) {
          const saleNumber = parseInt(cellValue);
          Logger.log(
            `Extracted sale number ${saleNumber} from cell ${cellReference} (value: ${cellValue})`
          );
          return saleNumber;
        } else {
          Logger.log(
            `Cell ${cellReference} contains non-numeric value: ${cellValue}`
          );
          return null;
        }
      } catch (cellError) {
        Logger.log(
          `Error getting value from cell ${cellReference}: ${cellError.toString()}`
        );
        return null;
      }
    }

    return null;
  } catch (error) {
    Logger.log('Error parsing formula: ' + error.toString());
    return null;
  }
}

/**
 * Finds comp data by comp number
 */
function findCompByNumber(sheet, compNumber) {
  try {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find the # column
    const numberColIndex = headers.findIndex((h) => h === '#');
    if (numberColIndex === -1) {
      return null;
    }

    // Find the row with this comp number
    for (let i = 1; i < data.length; i++) {
      if (data[i][numberColIndex] === compNumber) {
        const rowData = {};
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            rowData[header.trim()] = data[i][index];
          }
        });
        return rowData;
      }
    }

    return null;
  } catch (error) {
    Logger.log('Error in findCompByNumber: ' + error.toString());
    return null;
  }
}

/**
 * Gets parcel data for a specific comp
 */
function getParcelDataForComp(ss, compNumber) {
  try {
    const parcelSheet = ss.getSheetByName('comp-parcels');
    if (!parcelSheet) {
      return [];
    }

    const data = parcelSheet.getDataRange().getValues();
    const headers = data[0];

    // Find the instrumentNumber column
    const instrumentColIndex = headers.findIndex(
      (h) => h === 'instrumentNumber'
    );
    if (instrumentColIndex === -1) {
      return [];
    }

    // Get the instrument number from land comps
    const landCompsSheet = ss.getSheetByName('land comps');
    const landCompsData = landCompsSheet.getDataRange().getValues();
    const landCompsHeaders = landCompsData[0];
    const recordingColIndex = landCompsHeaders.findIndex(
      (h) => h === 'Recording'
    );

    let instrumentNumber = null;
    for (let i = 1; i < landCompsData.length; i++) {
      if (landCompsData[i][0] === compNumber) {
        // Assuming # is in column A
        instrumentNumber = landCompsData[i][recordingColIndex];
        break;
      }
    }

    if (!instrumentNumber) {
      return [];
    }

    // Find all parcels with this instrument number
    const parcels = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][instrumentColIndex] === instrumentNumber) {
        const parcelData = {};
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            parcelData[header.trim()] = data[i][index];
          }
        });
        parcels.push(parcelData);
      }
    }

    return parcels;
  } catch (error) {
    Logger.log('Error in getParcelDataForComp: ' + error.toString());
    return [];
  }
}

/**
 * Updates a field in the land comps sheet
 */
function updateCompField(compNumber, fieldName, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const landCompsSheet = ss.getSheetByName('land comps');

    if (!landCompsSheet) {
      return { success: false, error: 'land comps sheet not found' };
    }

    const data = landCompsSheet.getDataRange().getValues();
    const headers = data[0];

    // Find the # column and target field column
    const numberColIndex = headers.findIndex((h) => h === '#');
    const fieldColIndex = headers.findIndex((h) => h === fieldName);

    if (numberColIndex === -1) {
      return { success: false, error: 'Comp number column not found' };
    }

    if (fieldColIndex === -1) {
      return { success: false, error: `Field '${fieldName}' not found` };
    }

    // Find the row with this comp number
    for (let i = 1; i < data.length; i++) {
      if (data[i][numberColIndex] === compNumber) {
        // Update the field
        landCompsSheet.getRange(i + 1, fieldColIndex + 1).setValue(newValue);

        return {
          success: true,
          message: `Updated ${fieldName} to "${newValue}" for Comp #${compNumber}`,
          updatedValue: newValue,
        };
      }
    }

    return { success: false, error: `Comp #${compNumber} not found` };
  } catch (error) {
    Logger.log('Error in updateCompField: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Updates a field in the comp-parcels sheet
 */
function updateParcelField(apn, fieldName, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const parcelSheet = ss.getSheetByName('comp-parcels');

    if (!parcelSheet) {
      return { success: false, error: 'comp-parcels sheet not found' };
    }

    const data = parcelSheet.getDataRange().getValues();
    const headers = data[0];

    // Find the APN column and target field column
    const apnColIndex = headers.findIndex((h) => h === 'APN');
    const fieldColIndex = headers.findIndex((h) => h === fieldName);

    if (apnColIndex === -1) {
      return { success: false, error: 'APN column not found' };
    }

    if (fieldColIndex === -1) {
      return { success: false, error: `Field '${fieldName}' not found` };
    }

    // Find the row with this APN
    for (let i = 1; i < data.length; i++) {
      if (data[i][apnColIndex] === apn) {
        // Update the field
        parcelSheet.getRange(i + 1, fieldColIndex + 1).setValue(newValue);

        return {
          success: true,
          message: `Updated ${fieldName} to "${newValue}" for APN ${apn}`,
          updatedValue: newValue,
        };
      }
    }

    return { success: false, error: `APN ${apn} not found` };
  } catch (error) {
    Logger.log('Error in updateParcelField: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Gets the sheet and cell reference for a specific field
 */
function getFieldLocation(fieldName, compNumber) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check if it's a land comp field
    const landCompsSheet = ss.getSheetByName('land comps');
    if (landCompsSheet) {
      const data = landCompsSheet.getDataRange().getValues();
      const headers = data[0];
      const fieldColIndex = headers.findIndex((h) => h === fieldName);

      if (fieldColIndex !== -1) {
        // Find the row with this comp number
        const numberColIndex = headers.findIndex((h) => h === '#');
        for (let i = 1; i < data.length; i++) {
          if (data[i][numberColIndex] === compNumber) {
            const sheetName = 'land comps';
            const cellRef = `${sheetName}!${String.fromCharCode(
              65 + fieldColIndex
            )}${i + 1}`;
            return {
              success: true,
              sheetName: sheetName,
              cellRef: cellRef,
              row: i + 1,
              col: fieldColIndex + 1,
            };
          }
        }
      }
    }

    return {
      success: false,
      error: `Field '${fieldName}' not found or comp #${compNumber} not found`,
    };
  } catch (error) {
    Logger.log('Error in getFieldLocation: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}
