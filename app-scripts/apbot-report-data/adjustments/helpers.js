function isValidAdjSheet(sheetName) {
  const validNames = [
    'land-excess-adjustments',
    'land-improved-adjustments',
    'land-adjustments',
    'sales-adjustments',
    'rentals-adjustments',
  ]
  return validNames.some(validName => validName === sheetName.toLowerCase());
}
