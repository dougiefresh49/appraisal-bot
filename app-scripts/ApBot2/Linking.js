/**
 * Gets the link for a property's CAD based on address and APN,
 * including logic for Dallas, Upton, Odessa, and Midland CADs.
 *
 * @param {string} address The property address string (e.g., "1409 Connell St, Midland, Midland County, TX 79701", "101 Main St, McCamey, TX 79752").
 * @param {string} apn An APN value (e.g., "R000024310" for Midland, "38-12861-000-001-0000" or "20-03660-00A-03A-0000" for Dallas, "8235" for Upton, "C215801" for Odessa).
 * @return {string} A single string containing a single URL for the cad, or an empty string if inputs are invalid or county is not recognized.
 * @customfunction
 */
function getCadLink(address, apn) {
  // Validate input
  if (!apn || typeof apn !== 'string' || apn.length === 0) {
    return '';
  }

  // Regex for Dallas CAD APN format, allowing digits and 'A' (case-insensitive)
  const dallasCadRegex = /^\d{2}-\d{5}-[0-9A]{3}-[0-9A]{3}-[0-9A]{4}$/i;

  // Check if it's a Dallas CAD APN
  if (dallasCadRegex.test(apn)) {
    // Format the APN by removing hyphens
    const formattedDallasApn = apn.replace(/-/g, '');
    return `https://www.dallascad.org/AcctDetailCom.aspx?ID=${formattedDallasApn}`;
  }

  // New logic for Upton County (McCamey)
  const isMcCamey =
    !!address &&
    typeof address === 'string' &&
    address.toLowerCase().includes('mccamey');
  const isUptonApn = /^\d{4}$/.test(apn); // Regex for exactly 4 digits

  if (isMcCamey && isUptonApn) {
    return `https://uptoncad.org/Home/Details?parcelId=${apn}`;
  }

  // Original logic for Odessa (Ector) and Midland, applied if not Dallas or Upton
  const isOdessa =
    !!address &&
    typeof address === 'string' &&
    address.toLowerCase().includes('odessa, tx');
  const isMidApn = apn.charAt(0) === 'R'; // Check for Midland APN format

  // If the address includes Odessa OR the APN is not the Midland format (and not Dallas/Upton), use Ector CAD
  // This matches the original function's logic where Ector is a fallback for non-Midland APNs,
  // overridden if the address is explicitly Odessa.
  if (isOdessa || !isMidApn) {
    return `https://search.ectorcad.org/parcel/${apn}`;
  } else {
    // If not Dallas, not Upton, not Odessa by address, and IS a Midland APN format
    // This is the condition for Midland
    return `https://www.southwestdatasolution.com/webProperty.aspx?dbkey=MIDLANDCAD&id=${apn}`;
  }

  // Although the logic above covers all cases if the inputs are valid,
  // keeping a final empty return is harmless.
  return '';
}
