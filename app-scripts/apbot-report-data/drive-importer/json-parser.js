/**
 * Processes the JSON data submitted from the sidebar.
 * Parses the JSON, filters out ignored fields, appends data to corresponding sheets,
 * handles specific type conversions, and copies down formulas from the row above
 * the newly added data using a robust autoFill method column by column.
 *
 * @param {string} jsonDataString The JSON data as a string from the sidebar.
 * @return {string} A status message indicating success or failure.
 */
function processJsonData(jsonDataString) {
  Logger.log(
    'Received JSON string. Length: ' +
      (jsonDataString ? jsonDataString.length : 0)
  );
  if (!jsonDataString) {
    Logger.log('Error: No JSON data received.');
    return 'Error: No JSON data received.';
  }

  try {
    const inputData = JSON.parse(jsonDataString);
    Logger.log('Successfully parsed JSON.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- Configuration (Ensure this matches your setup) ---
    const sheetMappings = {
      saleData: 'sale comps',
      parcelData: 'comp-parcels',
      parcelImprovements: 'comp-parcel-improvements',
      landSaleData: 'land comps',
      subject: 'subject',
      subjectTaxes: 'subject-taxes',
      taxEntities: 'report-inputs', // Sheet where TaxEntitiesRange is located
      rentalData: 'rental comps',
    };

    const ignoreLists = {
      saleData: [
        'Market Conditions',
        'Sale Price / SF',
        'Improvements / SF',
        'Land Size (SF)',
        'APN',
        'Legal',
        'Building Size (SF)',
        'Occupancy %',
        'Land / Bld Ratio',
        'Construction',
        'Parking (SF)',
        'Buildings',
        'Year Built',
        'Effective Age',
        'Zoning',
        'Rent / SF',
        'Potential Gross Income',
        'Vacancy',
        'Effective Gross Income',
        'Net Operating Income',
        'Overall Cap Rate',
        'GPI',
        'Verification Type',
        'Verified By',
        'Verification',
      ],
      landSaleData: [
        'Market Conditions',
        'Sale Price / AC',
        'Sale Price / SF',
        'Land Size (AC)',
        'Land Size (SF)',
        'APN',
        'Legal',
        'Zoning',
        'Verification Type',
        'Verified By',
        'Verification',
      ],
      parcelData: [
        'Size (SF)',
        'Building Size (SF)',
        'Parking (SF)',
        'Storage Area (SF)',
        'Buildings',
      ],
      parcelImprovements: [
        /* Add any fields to ignore for parcelImprovements */
      ],
      subject: [
        'APN',
        'Legal',
        'Market Conditions',
        'Land Size (AC)',
        'Land Size (SF)',
        'Parking (SF)',
        'Building Size (SF)',
        'Office Area (SF)',
        'Warehouse Area (SF)',
        'Office %',
        'Land / Bld Ratio',
        'Total Taxes',
        'AddressLabel',
        'AddressLocal',
        'Zoning',
        'Year Built',
        'Age',
        'Effective Age',
      ],
      subjectTaxes: [
        /* No explicit generated fields listed in type */
      ],
      taxEntities: [
        /* Not applicable as it's a direct range population */
      ],
      rentalData: [
        // Ignore list for RentalData based on 'Generated' fields
        'APN',
        'Legal',
        'Zoning',
        'Land Size (AC)',
        'Land Size (SF)',
        'Rentable SF',
        'Office %',
        'Land / Bld Ratio',
        'Rent / Month',
        'Rent / SF / Year',
        'Year Built',
        'Age',
        'Effective Age',
        'Construction',
        'Verification',
      ],
    };
    const landSaleYesNoFields = [
      'Corner',
      'Highway Frontage',
      'Utils - Electricity',
    ];
    const subjectSpecificConversionFields = [
      'Hoisting',
      'Wash Bay',
      'Corner',
      'Highway Frontage',
      'Utils - Electricity',
    ];
    // --- End Configuration ---

    let sheetsProcessedCount = 0;
    let namedRangesProcessedCount = 0;

    for (const dataType in sheetMappings) {
      if (
        inputData.hasOwnProperty(dataType) &&
        Array.isArray(inputData[dataType])
      ) {
        const sheetName = sheetMappings[dataType];
        const ignoreList = ignoreLists[dataType] || [];
        const dataArray = inputData[dataType];

        Logger.log(
          `Processing ${dataArray.length} records for ${dataType}. Target sheet: "${sheetName}"`
        );

        // If dataArray is empty, move onto next
        if (dataArray.length === 0) {
          Logger.log(`No data provided for ${dataType}.`);
          continue;
        }

        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          Logger.log(
            `Warning: Sheet "${sheetName}" not found. Skipping ${dataType}.`
          );
          continue;
        }

        // --- Special handling for taxEntities to populate a named range ---
        if (dataType === 'taxEntities') {
          const namedRangeName = 'TaxEntitiesRange';
          const taxEntitiesRange = ss.getRangeByName(namedRangeName);
          if (!taxEntitiesRange) {
            Logger.log(
              `Warning: Named range "${namedRangeName}" not found in sheet "${sheetName}". Skipping ${dataType}.`
            );
            continue;
          }

          const rangeHeaders = taxEntitiesRange
            .offset(0, 0, 1, taxEntitiesRange.getNumColumns())
            .getValues()[0];
          const rangeHeaderMap = rangeHeaders.reduce((map, header, index) => {
            if (header && typeof header === 'string' && header.trim()) {
              map[header.trim()] = index; // 0-based index for direct array mapping
            }
            return map;
          }, {});

          // Prepare data for the named range
          const rangeDataToSet = dataArray.map((record) => {
            const newRangeRow = new Array(rangeHeaders.length).fill('');
            for (const field in record) {
              if (
                record.hasOwnProperty(field) &&
                rangeHeaderMap.hasOwnProperty(field.trim())
              ) {
                const colIndex = rangeHeaderMap[field.trim()];
                newRangeRow[colIndex] = record[field];
              }
            }
            return newRangeRow;
          });

          // Clear content below headers before writing new data
          if (taxEntitiesRange.getNumRows() > 1) {
            taxEntitiesRange
              .offset(
                1,
                0,
                taxEntitiesRange.getNumRows() - 1,
                taxEntitiesRange.getNumColumns()
              )
              .clearContent();
          }

          // Ensure the named range is large enough for the new data (if it's dynamic)
          // For now, assuming the named range is predefined to be large enough or will be manually adjusted.
          // If dataArray is longer than available rows in named range (excluding header), log a warning.
          const dataRowsInNamedRange = taxEntitiesRange.getNumRows() - 1;
          if (
            rangeDataToSet.length > dataRowsInNamedRange &&
            dataRowsInNamedRange > 0
          ) {
            Logger.log(
              `Warning: Data for ${namedRangeName} (${rangeDataToSet.length} rows) exceeds available space in named range (${dataRowsInNamedRange} data rows). Data might be truncated.`
            );
            // Optionally, resize the named range here if business logic allows, or throw error.
            // For simplicity, we'll write what fits.
          }

          if (rangeDataToSet.length > 0) {
            // Write data starting from the second row of the named range
            const targetWriteRange = taxEntitiesRange.offset(
              1,
              0,
              Math.min(
                rangeDataToSet.length,
                dataRowsInNamedRange > 0
                  ? dataRowsInNamedRange
                  : rangeDataToSet.length
              ),
              rangeHeaders.length
            );
            targetWriteRange.setValues(
              rangeDataToSet.slice(0, targetWriteRange.getNumRows())
            );
            Logger.log(
              `Successfully populated named range "${namedRangeName}" with ${targetWriteRange.getNumRows()} rows of data.`
            );
          }
          namedRangesProcessedCount++;
          continue; // Skip the standard append logic for this dataType
        }
        // --- End special handling for taxEntities ---

        const lastCol = sheet.getLastColumn();
        if (
          lastCol === 0 &&
          sheet.getLastRow() === 0 &&
          dataType !== 'taxEntities'
        ) {
          // Check if sheet is truly empty
          Logger.log(
            `Warning: Sheet "${sheetName}" appears to be completely empty. Skipping ${dataType}.`
          );
          continue;
        }
        const headerRange = sheet.getRange(1, 1, 1, Math.max(1, lastCol));
        const headers = headerRange.getValues()[0];
        const numColumns = headers.length;

        const headerMap = headers.reduce((map, header, index) => {
          if (header && typeof header === 'string' && header.trim()) {
            map[header.trim()] = index + 1; // 1-based column index for standard append
          }
          return map;
        }, {});

        const rowsToAppend = [];
        // Note: subjectTaxes has other things in it that stay and the table is in the first few columns
        const lastPopulatedRow =
          dataType === 'subjectTaxes' ? 1 : sheet.getLastRow();

        dataArray.forEach((record, recordIdx) => {
          const newRow = new Array(numColumns).fill('');
          let addedDataToThisRow = false;
          for (const field in record) {
            if (record.hasOwnProperty(field)) {
              let value = record[field];
              const trimmedField =
                typeof field === 'string' ? field.trim() : field;

              if (
                dataType === 'landSaleData' &&
                landSaleYesNoFields.includes(trimmedField)
              ) {
                if (value === true) value = 'Yes';
                else if (value === false) value = 'No';
                else value = 'Unk';
              } else if (
                dataType === 'subject' &&
                subjectSpecificConversionFields.includes(trimmedField)
              ) {
                if (value === true) value = 'Yes';
                else if (value === false) value = 'No';
                else value = 'Unk';
              }

              if (ignoreList.includes(trimmedField)) {
                continue;
              }

              if (headerMap.hasOwnProperty(trimmedField)) {
                const columnIndex = headerMap[trimmedField];
                newRow[columnIndex - 1] =
                  value === null || value === undefined ? '' : value;
                addedDataToThisRow = true;
              } else {
                if (!ignoreList.includes(trimmedField)) {
                  Logger.log(
                    `Warning: Field "${trimmedField}" from JSON (${dataType}) not found in sheet "${sheetName}" headers or ignore list. Skipping field.`
                  );
                }
              }
            }
          }
          if (addedDataToThisRow) {
            rowsToAppend.push(newRow);
          } else {
            Logger.log(
              `Skipping empty data row derived from record index ${recordIdx} for ${dataType}.`
            );
          }
        });

        if (rowsToAppend.length > 0) {
          const startAppendRow = lastPopulatedRow + 1;
          const numAppendedRows = rowsToAppend.length;

          const lastNewRowNeeded = startAppendRow + numAppendedRows - 1;
          if (lastNewRowNeeded > sheet.getMaxRows()) {
            sheet.insertRowsAfter(
              sheet.getMaxRows(),
              lastNewRowNeeded - sheet.getMaxRows()
            );
            Logger.log(
              `Inserted ${
                lastNewRowNeeded - sheet.getMaxRows()
              } rows to sheet "${sheetName}".`
            );
          }
          if (numColumns > sheet.getMaxColumns() && numColumns > 0) {
            sheet.insertColumnsAfter(
              Math.max(1, sheet.getMaxColumns()),
              numColumns - Math.max(1, sheet.getMaxColumns())
            );
            Logger.log(
              `Inserted ${
                numColumns - Math.max(1, sheet.getMaxColumns())
              } columns to sheet "${sheetName}".`
            );
          }

          if (numColumns > 0) {
            sheet
              .getRange(startAppendRow, 1, numAppendedRows, numColumns)
              .setValues(rowsToAppend);
            Logger.log(
              `Successfully appended ${numAppendedRows} rows of raw data to sheet "${sheetName}" from R${startAppendRow}.`
            );

            if (lastPopulatedRow >= 2 && numColumns > 0) {
              Logger.log(
                `Attempting to apply formulas from row ${lastPopulatedRow} down ${numAppendedRows} rows in sheet "${sheetName}" (Corrected AutoFill Method).`
              );
              try {
                for (let col = 1; col <= numColumns; col++) {
                  const sourceCell = sheet.getRange(lastPopulatedRow, col);
                  const sourceFormulaA1 = sourceCell.getFormula();
                  if (sourceFormulaA1 && sourceFormulaA1.startsWith('=')) {
                    Logger.log(
                      `Source cell R${lastPopulatedRow}C${col} has formula: ${sourceFormulaA1}`
                    );
                    const autoFillDestinationRange = sheet.getRange(
                      lastPopulatedRow,
                      col,
                      numAppendedRows + 1,
                      1
                    );
                    sourceCell.autoFill(
                      autoFillDestinationRange,
                      SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES
                    );
                    Logger.log(
                      `Auto-filled formulas in C${col} from R${lastPopulatedRow} down to R${
                        lastPopulatedRow + numAppendedRows
                      }.`
                    );
                  }
                }
                Logger.log(
                  `Finished applying formulas column by column for sheet "${sheetName}".`
                );
              } catch (formulaError) {
                Logger.log(
                  `Error applying formulas for sheet "${sheetName}" (Corrected AutoFill Method): ${
                    formulaError.message
                  }${
                    formulaError.stack ? '\nStack: ' + formulaError.stack : ''
                  }. Source Row: ${lastPopulatedRow}`
                );
              }
            } else {
              Logger.log(
                `Skipping formula copy for "${sheetName}" because source row (${lastPopulatedRow}) is less than 2 or numColumns (${numColumns}) is 0.`
              );
            }
          } else {
            Logger.log(
              `Skipping append for sheet "${sheetName}" as numColumns is 0.`
            );
          }
          sheetsProcessedCount++;
        } else {
          Logger.log(`No valid rows to append for sheet "${sheetName}".`);
        }
      } else {
        if (sheetMappings.hasOwnProperty(dataType)) {
          Logger.log(
            `Data type "${dataType}" not found as an array in the input JSON or is not an array. Skipping.`
          );
        }
      }
    }

    let finalMessage = '';
    if (sheetsProcessedCount > 0 && namedRangesProcessedCount > 0) {
      finalMessage = `Successfully processed data for ${sheetsProcessedCount} sheet(s) and ${namedRangesProcessedCount} named range(s)!`;
    } else if (sheetsProcessedCount > 0) {
      finalMessage = `Successfully processed data for ${sheetsProcessedCount} sheet(s)!`;
    } else if (namedRangesProcessedCount > 0) {
      finalMessage = `Successfully processed data for ${namedRangesProcessedCount} named range(s)!`;
    } else {
      finalMessage =
        'Import finished. No data was added to any sheets or named ranges.';
    }
    Logger.log(finalMessage);
    return finalMessage;
  } catch (e) {
    Logger.log(
      `Error processing JSON: ${e.toString()}${
        e.stack ? '\nStack: ' + e.stack : ''
      }`
    );
    if (e instanceof SyntaxError) {
      return (
        'Error: Invalid JSON format. Please check the pasted data. Details: ' +
        e.message
      );
    }
    return 'Error processing data: ' + e.message;
  }
}
