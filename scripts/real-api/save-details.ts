import { promises as fs } from 'fs';
import * as path from 'path';
import { getProjectArgs } from '../utils/project-args';
import { PropertyIdentifier, RealApiResponse } from './types';
import { fetchPropertyDetails, searchProperty } from './utils';
import { findClosestMatch, parseRealApiResponse, sanitizeFileName } from './helpers';

/**
 * Processes a single property:
 * 1. Searches for matching properties via the APN.
 * 2. Finds the closest matching address.
 * 3. Retrieves the property details.
 * 4. Writes the details to a file.
 */
async function processProperty(
  property: PropertyIdentifier,
  outputPath: string
) {
  try {
    console.log(`Processing property with APN: ${property.apn}`);
    const searchString =
      !!property.apn && property.apn !== '_' ? property.apn : property.address;
    console.log(`Searching for: ${searchString}`);
    const searchResults = await searchProperty(searchString);

    if (!searchResults || searchResults.length === 0) {
      console.error(`No search results found for ${searchString}`);
      return;
    }

    const closestMatch = findClosestMatch(searchResults, property.address);
    const defaultMatch = searchResults[0];
    if (!closestMatch) {
      console.error(`No closest match found for address: ${property.address}`);
    }
    const match = closestMatch ?? defaultMatch;
    if (!match) {
      console.error(`No match found for address: ${property.address}`);
      return;
    }
    console.log(`Found match: ${match.address} (ID: ${match.id})`);

    const details = await fetchPropertyDetails(match.id);
    const fileName = `${sanitizeFileName(
      property.address
    )}-property-details.json`;

    await fs.writeFile(
      path.join(outputPath, fileName),
      JSON.stringify(details, null, 2)
    );
    console.log(`Saved property details to ${fileName}`);
    return details ;
  } catch (error) {
    console.error(`Error processing property ${property.address}:`, error);
  }
}

// async function getPropertyTaxInfo(property: PropertyIdentifier) {
//   try {
//     const details = await fetchPropertyDetails('_', property);
//     const taxInfo = details.taxInfo;
//     return taxInfo;
//   } catch (error) {
//     console.error(
//       `Error getting property tax info for ${property.address}:`,
//       error
//     );
//   }
// }

/**
 * Main function:
 * Reads an input JSON file containing an array of PropertyIdentifier objects,
 * then processes each property.
 */
async function main() {
  const { dataFilePath, outputPath } = getProjectArgs('real-api-downloads');
  // Expect the input file path as a command-line argument
  if (!dataFilePath) {
    console.error('Please provide a JSON file as input.');
    process.exit(1);
  }

  try {
    const inputData = await fs.readFile(dataFilePath, 'utf-8');
    const properties: PropertyIdentifier[] = JSON.parse(inputData);
    const outputData: any[] = [];
    for (const property of properties) {
      const details = await processProperty(property, outputPath);
      const gsheetData = await parseRealApiResponse(details, property.instrumentNumber);
      const fileName = `${sanitizeFileName(
        property.address
      )}-gsheet-data.json`;
  
      await fs.writeFile(
        path.join(outputPath, fileName),
        JSON.stringify(gsheetData, null, 2)
      );
      // const taxInfo = await getPropertyTaxInfo(property);
      // outputData.push(taxInfo);
      outputData.push(details);
    }
    await fs.writeFile(
      path.join(outputPath, 'property-details--all.json'),
      JSON.stringify(outputData, null, 2)
    );
    console.log(`Saved property details to property-details.json`);
  } catch (error) {
    console.error('Error reading or processing the input file:', error);
  }
}

main();
