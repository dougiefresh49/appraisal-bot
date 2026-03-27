function RangeSidebar() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('E4').activate();
  spreadsheet.getActiveRangeList().setNumberFormat('0.00%');
};