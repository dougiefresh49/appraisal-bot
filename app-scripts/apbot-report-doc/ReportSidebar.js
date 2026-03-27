// --- Sidebar Width Preference Constants ---
const SIDEBAR_WIDTH_NARROW = 350;
const SIDEBAR_WIDTH_WIDE = 580;
const SIDEBAR_WIDTH_PROPERTY_KEY = 'reportSidebarWidth';

/**
 * Shows the Report Data sidebar with the last saved or default width.
 */
function showReportSidebar() {
  // const userProperties = PropertiesService.getUserProperties(); // User-specific width
  // let currentWidth = parseInt(userProperties.getProperty(SIDEBAR_WIDTH_PROPERTY_KEY));
  // if (isNaN(currentWidth) || (currentWidth !== SIDEBAR_WIDTH_NARROW && currentWidth !== SIDEBAR_WIDTH_WIDE)) {
  //   currentWidth = SIDEBAR_WIDTH_WIDE; // Default to narrow if no valid preference
  // }

  // **IMPORTANT**: Ensure 'ReportDataSidebar.html' is the correct name of your HTML file.
  const htmlOutput = HtmlService.createHtmlOutputFromFile('ReportDataSidebar')
      .setTitle('Report Data')
      .setWidth(580);
  DocumentApp.getUi().showSidebar(htmlOutput);
}

/**
 * Gets the saved sidebar width preference.
 * @return {string | null} The saved width or null.
 */
function getSidebarWidthPreference() {
  try {
    return PropertiesService.getUserProperties().getProperty(SIDEBAR_WIDTH_PROPERTY_KEY);
  } catch (e) {
    Logger.log("Error getting sidebar width preference: " + e.message);
    return null;
  }
}

/**
 * Toggles the saved sidebar width preference between narrow and wide,
 * then re-opens the sidebar to apply the new width.
 */
function toggleReportSidebarWidth() {
  const userProperties = PropertiesService.getUserProperties();
  let currentWidth = parseInt(userProperties.getProperty(SIDEBAR_WIDTH_PROPERTY_KEY));
  let newWidth;

  if (currentWidth === SIDEBAR_WIDTH_WIDE) {
    newWidth = SIDEBAR_WIDTH_NARROW;
  } else {
    newWidth = SIDEBAR_WIDTH_WIDE; // Defaults to wide if current is narrow or not set
  }

  userProperties.setProperty(SIDEBAR_WIDTH_PROPERTY_KEY, newWidth.toString());
  Logger.log(`Sidebar width toggled to: ${newWidth}px`);

  // Re-show the sidebar to apply the new width.
  // showReportSidebar();
}


/**
 * Retrieves the report data stored in Script Properties by the Sheets script.
 *
 * @return {string} The JSON string containing the report data, or null if not found.
 */
// Inside getReportData in Docs script:
function getReportData() {
  try {
    const data = ApBot2.getData(); // Use library identifier
    if (data) {
      Logger.log(`Retrieved report data from Library. Length: ${data.length}`);
      return data;
    } else {
      Logger.log('No report data found via Library.');
      return null;
    }
  } catch (e) {
    Logger.log(`Error retrieving data via Library: ${e.message}`);
    return JSON.stringify({ error: `Error retrieving data via Library: ${e.message}` });
  }
}

