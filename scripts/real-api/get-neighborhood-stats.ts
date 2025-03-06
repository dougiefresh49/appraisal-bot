import { MlsAreaName, PropertyIdentifier } from './types';
import { getProjectArgs } from '../utils/project-args';
import fs from 'fs/promises';
import { fetchNeighborStatByMlsArea } from './utils';

async function main() {
  const args = process.argv.slice(2);
  const mlsArea = args
    .find((arg) => arg.startsWith('--mls-area='))
    ?.split('=')[1];

  // Expect the input file path as a command-line argument
  if (!mlsArea) {
    console.error('Please provide a mls area as a command-line argument.');
    process.exit(1);
  }

  try {
    const total = await fetchNeighborStatByMlsArea(mlsArea as MlsAreaName);
    const sfrCount = await fetchNeighborStatByMlsArea(mlsArea as MlsAreaName, {
      property_type: 'SFR',
    });
    const condoCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        property_type: 'CONDO',
      }
    );
    const landCount = await fetchNeighborStatByMlsArea(mlsArea as MlsAreaName, {
      property_type: 'LAND',
    });
    const mfrCount = await fetchNeighborStatByMlsArea(mlsArea as MlsAreaName, {
      property_type: 'MFR',
    });
    const mfr2To4Count = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        mfh_2to4: true,
      }
    );
    const mobileCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        property_type: 'MOBILE',
      }
    );
    const otherCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        property_type: 'OTHER',
        corporate_owned: false,
      }
    );
    const commercialCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        corporate_owned: true,
      }
    );

    console.log(total);
    console.log(sfrCount);
    console.log(condoCount);
    console.log(landCount);
    console.log(mfrCount);
    console.log(mfr2To4Count);
    console.log(mobileCount);
    console.log(otherCount);
    console.log(commercialCount);

    const percentages = {
      sfr: getPercentage(total, sfrCount),
      condo: getPercentage(total, condoCount),
      land: getPercentage(total, landCount),
      mfr: getPercentage(total, mfrCount),
      mfr2to4: getPercentage(total, mfr2To4Count),
      mobile: getPercentage(total, mobileCount),
      other: getPercentage(total, otherCount),
      commercial: getPercentage(total, commercialCount),
    };

    console.log(percentages);
  } catch (error) {
    console.error('Error reading or processing the input file:', error);
  }
}

async function getYearBuiltStats(mlsArea: MlsAreaName) {
  const yearBuiltMin = 1963;
  const yearBuiltMax = 2022;
  const yearBuiltCount = await fetchNeighborStatByMlsArea(
    mlsArea as MlsAreaName,
    {
      property_type: 'SFR',
      year_built_min: yearBuiltMin,
      year_built_max: yearBuiltMax,
    }
  );
  console.log(yearBuiltCount);
}

async function getYearBuiltStatsPerYear(
  mlsArea: MlsAreaName,
  minYear: number,
  maxYear: number
) {
  let outputText = `
  ## By Year
  `;
  const yearBuiltCountMap: Record<number, number> = {};
  for (let i = minYear; i <= maxYear; i++) {
    const yearBuiltCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        property_type: 'SFR',
        year_built_min: i,
        year_built_max: i,
      }
    );
    yearBuiltCountMap[i] = yearBuiltCount;
    outputText += `
    ${i}: ${yearBuiltCount}
    `;
  }
  const total = Object.values(yearBuiltCountMap).reduce(
    (acc, curr) => acc + curr,
    0
  );

  const highestYearBuiltCount = Math.max(...Object.values(yearBuiltCountMap));
  const highestYearBuilt = Object.keys(yearBuiltCountMap).find(
    (key) => yearBuiltCountMap[key] === highestYearBuiltCount
  );

  outputText += `
  ### Summary
  - Total: ${total}
  - Highest Year Built: ${highestYearBuilt} (${highestYearBuiltCount})
  `;

  console.log(yearBuiltCountMap);
  console.log(`total: ${total}`);
  console.log(`highest year built count: ${highestYearBuiltCount}`);
  console.log(`highest year built: ${highestYearBuilt}`);
  return {
    total,
    highestYearBuiltCount,
    highestYearBuilt,
    outputText,
  };
}

async function getYearBuiltStatsByDecade(mlsArea: MlsAreaName) {
  const yearBuiltMin = 1963;
  const yearBuiltMax = 2022;
  let outputText = `
  # Predominant Year Built Calculation

  ## Data
  - MLS Area: ${mlsArea}
  - Year Built Min: ${yearBuiltMin}
  - Year Built Max: ${yearBuiltMax}
  `;
  const decadeStart = Math.floor(yearBuiltMin / 10) * 10;
  const decadesMap: Record<number, number> = {};

  outputText += `
  ## Decades
  `;
  // loop through and get totals for each decade
  for (let i = decadeStart; i <= yearBuiltMax; i += 10) {
    const decadeEnd = Math.min(i + 9, yearBuiltMax);
    console.log(`${i} - ${decadeEnd}`);
    const yearBuiltCount = await fetchNeighborStatByMlsArea(
      mlsArea as MlsAreaName,
      {
        property_type: 'SFR',
        year_built_min: i,
        year_built_max: decadeEnd,
      }
    );
    decadesMap[i] = yearBuiltCount;
    console.log(yearBuiltCount);
    outputText += `
    ${i} - ${decadeEnd}: ${yearBuiltCount}
    `;
  }
  const total = Object.values(decadesMap).reduce((acc, curr) => acc + curr, 0);
  const highestDecadeCount = Math.max(...Object.values(decadesMap));
  const highestDecade = Object.keys(decadesMap).find(
    (key) => decadesMap[key] === highestDecadeCount
  );

  console.log(decadesMap);
  console.log(`total: ${total}`);
  console.log(`highest decade: ${highestDecade}`);
  console.log(`highest decade count: ${highestDecadeCount}`);

  outputText += `
  ### Summary
  - Total: ${total}
  - Highest Decade: ${highestDecade} (${highestDecadeCount})
  `;

  const highestYearBuiltCount = await getYearBuiltStatsPerYear(
    mlsArea,
    Number(highestDecade),
    Number(highestDecade) + 9
  );
  const predominantYearBuilt = highestYearBuiltCount.highestYearBuilt;
  const yearsSince = new Date().getFullYear() - Number(predominantYearBuilt);

  console.log(`Predominant Year:`);
  console.log(`${predominantYearBuilt} (${yearsSince} years ago)`);

  outputText += `
  ${highestYearBuiltCount.outputText}
  
  ## Predominant Year Built
  ${predominantYearBuilt} (${yearsSince} years ago)
  `;

  console.log(outputText);
}

// main();
getYearBuiltStatsByDecade('MA7');
// Helper Functions

function getPercentage(total: number, count: number) {
  return count === -1 ? 0 : (count / total) * 100;
}
