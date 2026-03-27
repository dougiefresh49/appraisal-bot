/**
 * Gets all named ranges matching the specified patterns and groups them.
 * @return {Object} Object with grouped ranges by category
 */
function getNamedRangesForSelector() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allNamedRanges = ss.getNamedRanges();

  // Patterns to match
  const patterns = [
    /^Ui.*Comp\d+DisplayRange$/, // Ui*Comp*DisplayRange (e.g., UiSalesComp1DisplayRange, UiLandComp1DisplayRange)
    /.*SummaryRange$/, // *SummaryRange
    /.*IndicatedValuesRange$/, // *IndicatedValuesRange
    /.*AdjustmentsRange$/, // *AdjustmentsRange
    /.*AdjSummaryRange$/, // *SalesAdjSummaryRange
  ];

  const matchedRanges = [];

  // Filter ranges by patterns
  allNamedRanges.forEach((namedRange) => {
    const name = namedRange.getName();
    const matchesPattern = patterns.some((pattern) => pattern.test(name));

    if (matchesPattern) {
      const range = namedRange.getRange();
      const sheet = range.getSheet();

      matchedRanges.push({
        name: name,
        sheetName: sheet.getName(),
        range: range.getA1Notation(),
      });
    }
  });

  // Group ranges by comp type first, then by pasting flow within each type
  // Comp types: Land, Sales, Rentals, Reconciliation
  // Pasting flow order: comps, SummaryRange, adjustments, indicated values
  const grouped = {};

  // Helper function to determine comp type from range name
  function getCompType(rangeName, sheetName) {
    const nameLower = rangeName.toLowerCase();
    const sheetLower = sheetName.toLowerCase();

    // Check for explicit comp type in name
    if (nameLower.includes('land') || sheetLower.includes('land')) {
      return 'Land';
    }
    if (nameLower.includes('sales') || sheetLower.includes('sales')) {
      return 'Sales';
    }
    if (nameLower.includes('rental') || sheetLower.includes('rental')) {
      return 'Rentals';
    }
    if (
      nameLower.includes('reconciliation') ||
      sheetLower.includes('reconciliation')
    ) {
      return 'Reconciliation';
    }

    // Default fallback
    return 'Other';
  }

  // Helper function to get sort order for pasting flow
  function getPastingFlowOrder(rangeName) {
    if (rangeName.match(/^Ui.*Comp\d+DisplayRange$/)) {
      return 1; // comps first
    }
    if (rangeName.includes('SummaryRange')) {
      return 2; // SummaryRange second
    }
    if (rangeName.includes('Adjustments')) {
      return 3; // adjustments third
    }
    if (rangeName.includes('IndicatedValues')) {
      return 4; // indicated values fourth
    }
    return 99; // unknown types go last
  }

  // Group by comp type
  matchedRanges.forEach((rangeInfo) => {
    const compType = getCompType(rangeInfo.name, rangeInfo.sheetName);

    if (!grouped[compType]) {
      grouped[compType] = [];
    }

    grouped[compType].push(rangeInfo);
  });

  // Sort within each comp type by pasting flow, then by comp number
  const compTypeOrder = ['Land', 'Sales', 'Rentals', 'Reconciliation', 'Other'];
  const orderedGrouped = {};

  compTypeOrder.forEach((compType) => {
    if (grouped[compType] && grouped[compType].length > 0) {
      grouped[compType].sort((a, b) => {
        // First sort by pasting flow order
        const orderA = getPastingFlowOrder(a.name);
        const orderB = getPastingFlowOrder(b.name);
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // If same pasting flow order, sort by comp number (for DisplayRange)
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        if (numA !== numB && numA > 0 && numB > 0) {
          return numA - numB;
        }

        // Finally, alphabetical
        return a.name.localeCompare(b.name);
      });

      orderedGrouped[compType] = grouped[compType];
    }
  });

  // Add any remaining comp types not in the standard order
  Object.keys(grouped).forEach((compType) => {
    if (!orderedGrouped[compType] && grouped[compType].length > 0) {
      orderedGrouped[compType] = grouped[compType];
    }
  });

  return orderedGrouped;
}

/**
 * Selects a named range in the spreadsheet.
 * @param {string} rangeName - The name of the range to select
 * @return {string} Success message
 */
function selectNamedRange(rangeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const namedRange = ss.getRangeByName(rangeName);

  if (!namedRange) {
    throw new Error(`Range "${rangeName}" not found.`);
  }

  const sheet = namedRange.getSheet();

  // Activate the sheet first
  ss.setActiveSheet(sheet);

  // Select the range
  ss.setActiveRange(namedRange);

  return `Range "${rangeName}" selected. Ready to copy!`;
}
