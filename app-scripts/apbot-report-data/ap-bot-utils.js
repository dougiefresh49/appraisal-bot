function getCadLink(address, apns) {
  return ApBot2.getCadLink(address, apns);
}

function getEffectiveAge(buildingSizes, yearsBuilt, refYear, manualOverride) {
  if (manualOverride) {
    return manualOverride;
  }
  return ApBot2.getEffectiveAge(buildingSizes, yearsBuilt, refYear);
}

function getSummaryDataHelper(
  sourceRangeName,
  filterValueRef,
  targetHeaderRef
) {
  return ApBot2.getSummaryData(
    sourceRangeName,
    filterValueRef,
    targetHeaderRef
  );
}

function askGemini(prompt, input) {
  return ApBot2.askGemini(prompt, input);
}

function rangeToCsvString(data) {
  return ApBot2.rangeToCsvString(data);
}
