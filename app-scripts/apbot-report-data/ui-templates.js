const SALES_UI_SHEET_NAME = 'sales-ui';
const LAND_UI_SHEET_NAME = 'land-sales-ui';
const TEMPLATE_SHEET_NAME = 'ui-templates';
const RANGE_NAME_PREFIX = '';

const TEMPLATE_CONFIG = {
  UiTemplateSalesIncome: {
    rowOffset: 28,
    colOffset: 11,
    sourceRangeName: 'UiTemplateSalesIncomeRange',
  },
  UiTemplateSalesDefault: {
    rowOffset: 21,
    colOffset: 11,
    sourceRangeName: 'UiTemplateSalesDefaultRange',
  },
  UiTemplateLandDefault: {
    rowOffset: 29,
    colOffset: 11,
    sourceRangeName: 'UiTemplateLandDefaultRange',
  },
};

/**
 * 2. WRAPPER FUNCTIONS
 * These calculate the "N" (Number of Comps) and pick the Template.
 */

function generateStandardLandUI() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Generate Standard Land UI',
    'How many land comps do you want to generate?',
    ui.ButtonSet.OK_CANCEL
  );

  // Process the user's response.
  if (result.getSelectedButton() == ui.Button.OK) {
    const text = result.getResponseText();
    const count = parseInt(text, 10);

    if (isNaN(count) || count <= 0) {
      ui.alert('Please enter a valid number greater than 0.');
      return;
    }

    // EXECUTE: Use Default Template
    renderUI('UiTemplateLandDefault', LAND_UI_SHEET_NAME, 'Land', count);
  }
}

function generateStandardSalesUI() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Generate Standard Sales UI',
    'How many sales comps do you want to generate?',
    ui.ButtonSet.OK_CANCEL
  );

  // Process the user's response.
  if (result.getSelectedButton() == ui.Button.OK) {
    const text = result.getResponseText();
    const count = parseInt(text, 10);

    if (isNaN(count) || count <= 0) {
      ui.alert('Please enter a valid number greater than 0.');
      return;
    }

    // EXECUTE: Use Default Template
    renderUI('UiTemplateSalesDefault', SALES_UI_SHEET_NAME, 'Sales', count);
  }
}

function generateIncomeSalesUI() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Generate Income Sales UI',
    'How many income sales comps do you want to generate?',
    ui.ButtonSet.OK_CANCEL
  );

  // Process the user's response.
  if (result.getSelectedButton() == ui.Button.OK) {
    const text = result.getResponseText();
    const count = parseInt(text, 10);

    if (isNaN(count) || count <= 0) {
      ui.alert('Please enter a valid number greater than 0.');
      return;
    }

    // EXECUTE: Use Income Template
    renderUI('UiTemplateSalesIncome', SALES_UI_SHEET_NAME, 'Sales', count);
  }
}

/**
 * 3. THE CORE RENDER FUNCTION v2
 * Pure execution. No data checking. No auto-detection.
 * Just copies the requested template 'numberOfComps' times.
 */
function renderUI(templateName, sheetName, compType, numberOfComps) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const uiSheet = ss.getSheetByName(sheetName);

  const config = TEMPLATE_CONFIG[templateName];
  if (!config) {
    throw new Error(`Configuration not found for template: ${templateName}`);
  }

  // Get the Source Template
  const sourceRange = ss.getRangeByName(config.sourceRangeName);
  if (!sourceRange) {
    throw new Error(`Named Range not found: ${config.sourceRangeName}`);
  }

  // CLEAR & PREPARE
  uiSheet.clear();
  let currentCursorRow = 1;

  // LOOP
  for (let i = 0; i < numberOfComps; i++) {
    const compId = i + 1;

    // A. Copy Template
    sourceRange.copyTo(uiSheet.getRange(currentCursorRow, 1));

    // B. Set Comp ID (The "Driver")
    uiSheet
      .getRange(currentCursorRow + config.rowOffset, 1 + config.colOffset)
      .setValue(compId);

    // D. Create/Update Named Ranges (for Google Docs linking)
    const newRangeName = `${RANGE_NAME_PREFIX}Ui${compType}Comp${compId}`;
    const newDisplayRangeName = `${RANGE_NAME_PREFIX}Ui${compType}Comp${compId}DisplayRange`;
    const pastedHeight = sourceRange.getNumRows();

    // Calculate the new ranges
    const newFullRange = uiSheet.getRange(
      currentCursorRow,
      1,
      pastedHeight,
      12
    );
    const displayRangeHeight = pastedHeight - 1;
    const newDisplayRange = uiSheet.getRange(
      currentCursorRow,
      2,
      displayRangeHeight,
      6
    ); // Column B=2, G=7, so 6 columns (B through G)

    // Helper function to update a named range if it exists and needs updating
    function updateNamedRangeIfNeeded(rangeName, newRange) {
      const existingNamedRanges = ss.getNamedRanges();
      let needsUpdate = true;

      // Check if named range already exists and points to the same range
      for (let i = 0; i < existingNamedRanges.length; i++) {
        const nr = existingNamedRanges[i];
        if (nr.getName() === rangeName) {
          const existingRange = nr.getRange();
          // Compare ranges - if they're the same, we don't need to update
          if (
            existingRange.getSheet().getName() ===
              newRange.getSheet().getName() &&
            existingRange.getRow() === newRange.getRow() &&
            existingRange.getLastRow() === newRange.getLastRow() &&
            existingRange.getColumn() === newRange.getColumn() &&
            existingRange.getLastColumn() === newRange.getLastColumn()
          ) {
            needsUpdate = false;
            break;
          }
          // Range is different, remove the old one
          nr.remove();
          break;
        }
      }

      // Only create if it doesn't exist or needs updating
      if (needsUpdate) {
        ss.setNamedRange(rangeName, newRange);
      }
    }

    // Update both named ranges
    updateNamedRangeIfNeeded(newRangeName, newFullRange);
    updateNamedRangeIfNeeded(newDisplayRangeName, newDisplayRange);

    // E. Advance Cursor (Height + 2 rows padding)
    currentCursorRow += pastedHeight + 2;
  }

  SpreadsheetApp.flush();
  console.log(
    `Rendered ${numberOfComps} ${compType} comps using ${templateName}`
  );
}
