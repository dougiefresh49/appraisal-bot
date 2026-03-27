/**
 * Adds a custom menu to the spreadsheet UI.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('AppraisalBot Tools');

  // --- Import Data ---
  menu.addItem('Import JSON Data', 'showImportSidebar');
  menu.addItem('Import Data from Drive Files', 'showFilePickerSidebar');
  menu.addSeparator();

  // --- Export Data ---
  menu.addItem('Export Report Data', 'exportReportData');
  menu.addSeparator();

  menu.addItem('Range Selector', 'showRangeSelectorSidebar');
  menu.addSeparator();

  // --- UI Templates ---
  menu.addItem('Generate UI', 'doNothing');
  menu.addItem('Land - Default', 'generateStandardLandUI');
  const salesMenu = ui.createMenu('Sales');
  salesMenu.addItem('Default', 'generateStandardSalesUI');
  salesMenu.addItem('Income', 'generateIncomeSalesUI');
  menu.addSubMenu(salesMenu);
  menu.addSeparator();

  // --- Edit Data ---
  menu.addItem('Edit Comp Data', 'showCompEditorSidebar');
  menu.addSeparator();

  // --- Adjustments Submenu ---
  const adjMenu = ui.createMenu('Adjustments');
  const adjRowsMenu = ui.createMenu('Rows');
  adjRowsMenu.addItem('Add Adjustment', 'addAdjustmentRow');
  adjRowsMenu.addItem(
    'Remove Selected Adjustment',
    'removeSelectedAdjustmentRow'
  );
  adjMenu.addSubMenu(adjRowsMenu);

  const adjCompMenu = ui.createMenu('Comp');
  adjCompMenu.addItem('Add Comp Column', 'addCompColumn');
  adjCompMenu.addItem('Remove Comp Column', 'removeCompColumn');
  adjMenu.addSubMenu(adjCompMenu);

  menu.addSubMenu(adjMenu);

  menu.addToUi();
}

function doNothing() {
  Logger.log('doNothing called');
}

/**
 * Displays an HTML sidebar for importing JSON data.
 */
function showImportSidebar() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('ui/import-sidebar')
    .setTitle('Import JSON Data')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Shows the sidebar with the drive file picker button
 */
function showFilePickerSidebar() {
  Logger.log('showPickerModal called');
  const html = HtmlService.createHtmlOutputFromFile(
    'drive-importer/drive-file-picker'
  )
    .setWidth(800)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Appraisal File Browser');
  Logger.log('Modal should now be visible');
}

/**
 * Shows the comp editor sidebar
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
 * Shows the range selector sidebar for quick access to named ranges
 */
function showRangeSelectorSidebar() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile(
    'ui/range-selector-sidebar'
  )
    .setTitle('Range Selector')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}
