/**
 * Calculates the weighted effective age of a property based on multiple building components.
 * Handles single building inputs (single cell references) as well.
 *
 * @param {number|Array<Array<number>>} buildingSizes A single cell OR a vertical/horizontal range of building sizes (e.g., square footage).
 * @param {number|Array<Array<number>>} yearsBuilt A single cell OR a vertical/horizontal range of corresponding building construction years. Must match the size and shape of buildingSizes if ranges.
 * @param {number} [referenceYear] Optional. The year to calculate age relative to. Defaults to the current year if omitted or invalid.
 * @return {number|string} The calculated effective age rounded to one decimal place, or an error message string if inputs are invalid.
 * @customfunction
 */
function getEffectiveAge(buildingSizes, yearsBuilt, referenceYear) {
  // --- Input Validation ---
  const refYear = isValidYear(referenceYear) ? referenceYear : new Date().getFullYear();
  Logger.log(`Using reference year: ${refYear}`);
  
  Logger.log(`buildingSizes is array? ${!Array.isArray(buildingSizes)}: ${buildingSizes}`)
  Logger.log(`yearsBuilt is array? ${!Array.isArray(yearsBuilt)}: ${yearsBuilt}`)

  const areInputsArrays = Array.isArray(buildingSizes) && Array.isArray(yearsBuilt);
  const areInputsNums = !areInputsArrays ? (isNumValid(buildingSizes) && isNumValid(yearsBuilt)) : false;

  if (areInputsNums) {
    return refYear - yearsBuilt;
  }

  // Check if inputs are arrays (ranges from sheets are 2D arrays)
  if (!areInputsArrays) {
    return "#VALUE! Invalid input: buildingSizes and yearsBuilt must be ranges.";
  }

  // Flatten the 2D arrays from Sheets ranges and filter for valid numbers
  const flatSizes = buildingSizes.flat().filter(n => typeof n === 'number' && isFinite(n));
  const flatYears = yearsBuilt.flat().filter(n => typeof n === 'number' && isFinite(n) && n > 1000); // Basic check for plausible years

  // Check if we have any data after cleaning
  if (flatSizes.length === 0 || flatYears.length === 0) {
    return "#N/A: No valid numeric size or year data found in ranges.";
  }

  // Check if the number of valid sizes matches the number of valid years
  if (flatSizes.length !== flatYears.length) {
    return "#N/A: The number of valid building sizes must match the number of valid years built.";
  }
  

  // --- Calculations ---

  // 1. Calculate Total Size
  const totalSize = flatSizes.reduce((sum, size) => sum + size, 0);
  Logger.log(`Total Size: ${totalSize}`);

  if (totalSize <= 0) {
    return "#DIV/0! Total building size must be greater than zero.";
  }

  // 2. Calculate Weighted Age Sum (Steps 2, 3, 4 combined)
  let weightedAgeSum = 0;
  for (let i = 0; i < flatSizes.length; i++) {
    const size = flatSizes[i];
    const year = flatYears[i];

    const percentage = size / totalSize; // Step 2: Size Percentage
    const age = refYear - year;         // Step 3: Building Age

    // Handle cases where building year might be >= reference year
    const ageContribution = age >= 0 ? age : 0; // Treat future/same year builds as 0 age for effective age calc? Or allow negative? Let's assume 0 minimum age.

    weightedAgeSum += ageContribution * percentage; // Step 4: Multiply age by percentage and add to sum
    Logger.log(`Building ${i + 1}: Size=${size}, Year=${year}, Pct=${percentage.toFixed(4)}, Age=${age}, WeightedAgePart=${(ageContribution * percentage).toFixed(4)}`);
  }
  Logger.log(`Total Weighted Age Sum (before rounding): ${weightedAgeSum}`);


  // 5. Round final result to one decimal place (Step 6)
  const effectiveAge = Math.round(weightedAgeSum * 10) / 10;

  return effectiveAge;
}

// Helper Functions
function isValidYear(yr) {
  return typeof yr === 'number' && isFinite(yr) && yr > 1800 && yr < 3000
}

function isNumValid(n) {
  return typeof n === 'number' && isFinite(n) && n > 0
}