/**
 * Converts a 2D array (representing a Google Sheet range) into a CSV formatted string.
 * Handles commas and double quotes within cell values according to CSV standards.
 *
 * @param {Array<Array<any>>} data The 2D array of data from a sheet range.
 * @return {string} The data formatted as a CSV string.
 * @customfunction
 */
function rangeToCsvString(data) {
  if (!data || data.length === 0) {
    return ""; // Return empty string if input is empty or invalid
  }

  // Filter out rows where all cells are effectively empty
  const nonEmptyRows = data.filter(row =>
    // Check if at least one cell in the row has a value
    row.some(cell => cell !== null && cell !== undefined && cell !== "")
  );

  if (nonEmptyRows.length === 0) {
      return ""; // Return empty string if all rows were blank
  }

  // Use map to process each non-empty row
  const csvRows = nonEmptyRows.map(row => {
    // Process each cell within the row
    return row.map(cell => {
      let cellValue = cell === null || cell === undefined ? "" : String(cell); // Convert cell to string, handle null/undefined

      // Check if the cell value contains characters that require quoting in CSV
      // (comma, double quote, or newline)
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        // Escape existing double quotes by doubling them
        cellValue = cellValue.replace(/"/g, '""');
        // Enclose the entire cell value in double quotes
        return `"${cellValue}"`;
      }
      // If no special characters, return the value as is
      return cellValue;
    }).join(','); // Join cells in the row with a comma
  });

  // Join all processed rows with a newline character
  return csvRows.join('\n');
}
// --- Example Usage with askGemini ---
/**
 * Example function showing how to get a range, convert it to CSV,
 * and send it to the askGemini function.
 */
function analyzeRangeWithGemini(rangeString) {
  // Get the active sheet and the desired range (e.g., A1:B8 from your screenshot)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Adjust the range "A1:B9" to match the data you want to analyze
  const range = sheet.getRange("A1:B9");
  const data = range.getValues(); // Get the data as a 2D array

  // Convert the data to a CSV string
  const csvData = rangeToCsvString(data);
  Logger.log("CSV Data:\n" + csvData);

  // Define the prompt for Gemini
  const prompt = "Analyze the following sales data and provide a brief summary of the indicated market values. Identify any potential outliers.";

  // Call askGemini with the prompt and the CSV data as input
  // Ensure your askGemini function is defined in the same project
  const analysis = askGemini(prompt, csvData);

  // Log the result from Gemini
  Logger.log("\nGemini Analysis:\n" + analysis);

  // Optional: Write the analysis to another cell
  // sheet.getRange("D1").setValue(analysis);
}
