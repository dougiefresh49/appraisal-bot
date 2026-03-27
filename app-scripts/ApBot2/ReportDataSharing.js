function saveData(jsonData) {
  try {
    PropertiesService.getScriptProperties().setProperty('reportData', jsonData);
    Logger.log(`Library: Saved data. Length: ${jsonData ? jsonData.length : 0}`);
    return true; // Indicate success
  } catch (e) {
    Logger.log(`Library Error saving data: ${e.message}`);
    return false; // Indicate failure
  }
}

function getData() {
  try {
    const data = PropertiesService.getScriptProperties().getProperty('reportData');
    Logger.log(`Library: Retrieved data. Length: ${data ? data.length : 0}`);
    return data;
  } catch (e) {
    Logger.log(`Library Error retrieving data: ${e.message}`);
    return null; // Or return an error indicator
  }
}