/**
 * @OnlyCurrentDoc // Limits the script's access to only the current document.
 */

/**
 * Creates a custom menu in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  DocumentApp.getUi()
    .createMenu('AppraisalBot Tools')
    .addItem('Show Report Data', 'showReportSidebar')
    .addSeparator()
    .addItem('Insert Subject Images', 'promptForImageInputsFromFile')
    .addItem('Clear Subject Images', 'clearSubjectImageTables')
    .addToUi();
}
