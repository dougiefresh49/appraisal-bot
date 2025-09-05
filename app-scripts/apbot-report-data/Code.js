function getOAuthToken() {
  Logger.log('getOAuthToken called from HTML');
  try {
    DriveApp.getRootFolder(); // Ensures Drive scope is authorized
    const token = ScriptApp.getOAuthToken();
    Logger.log('Token retrieved successfully');
    return token;
  } catch (error) {
    Logger.log('Error in getOAuthToken: ' + error.toString());
    throw error;
  }
}

function getDeDupedList(itemsStr) {
  const items = new Set(
    itemsStr
      .replace(/\//g, ',')
      .split(',')
      .map((i) => i?.trim())
      .filter((i) => !!i)
  );
  return Array.from(items).join(', ');
}

function getZoningForSigFacts(primarySite, excessLand) {
  const isPrimaryEmpty = !primarySite || primarySite === '#N/A';
  const isExcessEmpty = !excessLand || excessLand === '#N/A';
  if (isPrimaryEmpty && isExcessEmpty) return '';

  const areZonesSame = primarySite === excessLand;
  Logger.log('excessLand');
  Logger.log(excessLand);
  Logger.log(isExcessEmpty);

  if (!isPrimaryEmpty && isExcessEmpty) return primarySite;
  if (areZonesSame) return primarySite;
  return `${primarySite} (Primary Site)\n${excessLand} (Excess Land)`;
}

function getDownloadUrl(url) {
  // Check if the URL is in the format we want to convert
  const openIdMatch = url.match(
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
  );

  if (openIdMatch) {
    Logger.log('open id match, generating url');
    // Extract the file ID from the URL
    const fileId = openIdMatch[1];
    // Construct the new URL in the /uc format
    const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
    Logger.log(`returning drive url: ${downloadUrl}`);
    return downloadUrl;
  } else {
    // If the URL is not in the expected format, return it unchanged
    Logger.log('returning url unchanged');
    return url;
  }
}
