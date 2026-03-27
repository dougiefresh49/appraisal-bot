// --- Data Export Functionality ---

/**
 * Exports data from specified named ranges into a JSON object
 * stored in User Properties for access by other scripts (e.g., a Docs Add-on).
 */
function exportReportData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  // Corrected typo from 'TaxEntitesRage' to 'TaxEntitiesRange' - adjust if the name is different
  const namedRangesToExport = [
    'ClientDataRange',
    'CompsRentalsSummaryRange',
    'CompsSalesSummaryRange',
    'CompsLandSummaryRange',
    'FemaDataRange',
    'NeighborhoodBoundariesRange',
    'ReportInputsRange',
    'SubjectRange',
    'TaxEntitiesRange', // Assuming this is the correct name
  ];

  const allExportedData = {};
  let errors = [];

  Logger.log('Starting data export...');

  namedRangesToExport.forEach((rangeName) => {
    try {
      const range = ss.getRangeByName(rangeName);
      if (!range) {
        throw new Error(`Named range "${rangeName}" not found.`);
      }

      // Get display values (formatted values as strings)
      const displayValues = range.getDisplayValues();

      if (!displayValues || displayValues.length === 0) {
        Logger.log(`Named range "${rangeName}" is empty. Skipping.`);
        allExportedData[rangeName] = []; // Store as empty array
        return; // Skip to next range
      }

      // Handle special ranges that have a different structure
      let dataObjects;
      if (
        [
          'CompsRentalsSummaryRange',
          'CompsSalesSummaryRange',
          'CompsLandSummaryRange',
        ].includes(rangeName)
      ) {
        Logger.log(
          `Processing special range "${rangeName}" with comp summary structure...`
        );
        dataObjects = rangeToCompSummaryObjects_(displayValues);
        Logger.log(
          `Comp summary range "${rangeName}" processed: ${dataObjects.length} comps`
        );
      } else {
        // Convert the 2D array to an array of objects using the first row as headers
        dataObjects = rangeToArrayOfObjects_(displayValues);
      }
      allExportedData[rangeName] = dataObjects;
      Logger.log(
        `Successfully processed named range: "${rangeName}" (${dataObjects.length} record(s)).`
      );
    } catch (e) {
      Logger.log(`Error processing named range "${rangeName}": ${e.message}`);
      errors.push(`Error processing "${rangeName}": ${e.message}`);
    }
  });

  if (Object.keys(allExportedData).length > 0) {
    let jsonDataString = ''; // Define outside try block
    try {
      jsonDataString = JSON.stringify(allExportedData);
      const dataLength = jsonDataString.length;
      Logger.log(
        `Attempting to save data to User Properties. Key: 'reportData'. Length: ${dataLength} bytes.`
      ); // Log length before saving

      // Store the JSON string in User Properties
      // Inside exportReportData in Sheets script, after stringifying JSON:
      const success = ApBot2.saveData(jsonDataString); // Use library identifier
      if (success) {
        Logger.log(`Data successfully sent to library for saving.`);
        ui.alert(
          'Data Export Successful',
          `Report data (${jsonDataString.length} bytes) has been successfully exported.`,
          ui.ButtonSet.OK
        );
        // Remove the old verification logic here
      } else {
        Logger.log(`Failed to save data via library.`);
        errors.push('Critical: Failed to save data via library.');
        ui.alert(
          'Data Export Failed Critically',
          `Critical error saving data via library. Check library logs.`,
          ui.ButtonSet.OK
        );
      }
      // Adjust surrounding error handling as needed

      // *** ADDED LOGGING: Verify immediately after setting ***
      const checkData = ApBot2.getData();
      if (checkData && checkData.length === dataLength) {
        Logger.log(
          `VERIFICATION SUCCESS: Data saved to User Properties seems correct. Length: ${checkData.length}`
        );
      } else if (checkData) {
        Logger.log(
          `VERIFICATION WARNING: Data found in User Properties, but length differs! Saved: ${dataLength}, Found: ${checkData.length}. Data might be truncated.`
        );
      } else {
        Logger.log(
          `VERIFICATION FAILED: Failed to retrieve data immediately after setting it in User Properties.`
        );
        errors.push('Critical: Failed to verify data save in User Properties.'); // Add critical error
      }
      // *** END ADDED LOGGING ***

      if (errors.length > 0) {
        // If verification failed, ensure the alert reflects that critical issue
        const alertTitle = errors.some((e) => e.includes('Critical:'))
          ? 'Data Export Failed Critically'
          : 'Data Export Partially Successful';
        const alertMessage = errors.some((e) => e.includes('Critical:'))
          ? `Critical error saving data. Check logs. Other errors:\n- ${errors.join(
              '\n- '
            )}`
          : `Data exported, but with errors:\n- ${errors.join(
              '\n- '
            )}\n\nData may not be fully available in Docs.`;
        ui.alert(alertTitle, alertMessage, ui.ButtonSet.OK);
      } else {
        ui.alert(
          'Data Export Successful',
          `Report data (${dataLength} bytes) has been successfully processed and saved to User Properties.`,
          ui.ButtonSet.OK
        );
      }
    } catch (e) {
      Logger.log(
        `Error during JSON stringify or saving data to User Properties: ${e.message}`
      );
      ui.alert(
        'Export Error',
        `Failed to process or save data: ${e.message}`,
        ui.ButtonSet.OK
      );
    }
  } else {
    Logger.log('Export failed: No data was successfully processed.');
    ui.alert(
      'Export Failed',
      `No data could be processed. Errors:\n- ${errors.join('\n- ')}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Helper function to convert comp summary ranges (where each row is an attribute
 * and each column is a comp/sale/rental) into an array of comp objects.
 *
 * @param {Array<Array<String>>} data The 2D array of display values.
 * @return {Array<Object>} An array of objects where each object represents one comp.
 * @private
 */
function rangeToCompSummaryObjects_(data) {
  if (!data || data.length < 1) {
    return []; // Return empty if no data
  }

  const arrayOfObjects = [];

  // Get the attribute names from the first column
  const attributeNames = [];
  data.forEach((row) => {
    if (row.length > 0) {
      const attributeName = row[0]; // First column
      if (attributeName && attributeName.trim() !== '') {
        attributeNames.push(attributeName.trim());
      }
    }
  });

  // Process each comp column (starting from column 1, excluding the last column which is subject)
  const numCompColumns = data[0].length - 1; // Exclude the subject column

  for (let compIndex = 1; compIndex < numCompColumns; compIndex++) {
    const compObj = {};
    compObj['#'] = compIndex.toString(); // Add comp number

    let hasData = false;

    // Get data for this comp from each row
    data.forEach((row, rowIndex) => {
      const attributeName = attributeNames[rowIndex];
      const cellValue = row[compIndex];

      if (
        attributeName &&
        cellValue !== undefined &&
        cellValue !== null &&
        cellValue !== ''
      ) {
        compObj[attributeName] = cellValue;
        hasData = true;
      }
    });

    // Only add the comp object if it has data
    if (hasData && Object.keys(compObj).length > 1) {
      // More than just the # field
      arrayOfObjects.push(compObj);
    }
  }

  return arrayOfObjects;
}

/**
 * Helper function to convert a 2D array (where the first row is headers)
 * into an array of JavaScript objects.
 *
 * @param {Array<Array<String>>} data The 2D array of display values.
 * @return {Array<Object>} An array of objects.
 * @private
 */
function rangeToArrayOfObjects_(data) {
  if (!data || data.length < 1) {
    return []; // Return empty if no data or no headers
  }

  const headers = data[0].map((header) => (header ? header.trim() : '')); // Get headers from the first row and trim whitespace, handle null/empty headers
  const dataRows = data.slice(1); // Get all rows except the header row
  const arrayOfObjects = [];

  dataRows.forEach((row) => {
    const obj = {};
    let hasData = false; // Track if the row has any actual data
    headers.forEach((header, index) => {
      // Only add property if header is not empty
      if (header) {
        const value =
          row[index] === undefined || row[index] === null ? '' : row[index];
        obj[header] = value;
        if (value !== '') {
          hasData = true; // Mark if we found non-empty data
        }
      }
    });
    // Only add the object if it's not empty and had some data
    if (Object.keys(obj).length > 0 && hasData) {
      arrayOfObjects.push(obj);
    }
  });

  return arrayOfObjects;
}
