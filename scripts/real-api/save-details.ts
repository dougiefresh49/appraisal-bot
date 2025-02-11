import { promises as fs } from 'fs';
import * as path from 'path';
import { getProjectArgs } from '../utils/project-args';

// Define the interface for the input property
interface PropertyIdentifier {
  address: string;
  apn: string;
}

// Define an interface for the search result (based on the sample output)
interface SearchResult {
  zip: string;
  address: string;
  city: string;
  searchType: string;
  stateId: string;
  latitude: number;
  county: string;
  fips: string;
  title: string;
  house: string;
  countyId: string;
  street: string;
  location: string;
  id: string;
  state: string;
  apn: string;
  longitude: number;
}

/**
 * Computes the Levenshtein distance between two strings.
 * This is used to score how “close” a candidate address is to the input address.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Finds the search result whose address most closely matches the input address.
 */
function findClosestMatch(
  results: SearchResult[],
  targetAddress: string
): SearchResult | null {
  if (results.length === 0) return null;

  let closest = results[0];
  let minDistance = levenshtein(
    results[0].address.toLowerCase(),
    targetAddress.toLowerCase()
  );

  for (let i = 1; i < results.length; i++) {
    const distance = levenshtein(
      results[i].address.toLowerCase(),
      targetAddress.toLowerCase()
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = results[i];
    }
  }
  return closest;
}

/**
 * Calls the property search API endpoint using the APN.
 */
async function searchProperty(apn: string): Promise<SearchResult[]> {
  const options = {
    method: 'POST',
    headers: {
      'x-user-id': 'UniqueUserIdentifier',
      'content-type': 'application/json',
      'x-api-key': process.env.REAL_API_KEY as string,
    },
    body: JSON.stringify({ search: apn }),
  };

  const response = await fetch(
    'https://api.realestateapi.com/v2/AutoComplete',
    options
  );
  const data = await response.json();
  return data.data as SearchResult[];
}

/**
 * Calls the property details API endpoint using the property ID.
 * Here we assume that the API expects the property id in the request body.
 */
async function getPropertyDetails(propertyId: string): Promise<any> {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-user-id': 'UniqueUserIdentifier',
      'content-type': 'application/json',
      'x-api-key': process.env.REAL_API_KEY as string,
    },
    // Passing propertyId along with comps:false. Adjust according to the actual API.
    body: JSON.stringify({ id: propertyId, comps: false }),
  };

  const response = await fetch(
    'https://api.realestateapi.com/v2/PropertyDetail',
    options
  );
  return response.json();
}

/**
 * Sanitizes a string so it can be safely used as a filename.
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

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
): Promise<void> {
  try {
    console.log(`Processing property with APN: ${property.apn}`);
    const searchResults = await searchProperty(property.apn);

    if (!searchResults || searchResults.length === 0) {
      console.error(`No search results found for APN: ${property.apn}`);
      return;
    }

    const closestMatch = findClosestMatch(searchResults, property.address);
    if (!closestMatch) {
      console.error(`No closest match found for address: ${property.address}`);
      return;
    }

    console.log(
      `Found closest match: ${closestMatch.address} (ID: ${closestMatch.id})`
    );

    const details = await getPropertyDetails(closestMatch.id);
    // const fileName = `${sanitizeFileName(
    //   property.address
    // )}-property-details.json`;

    // await fs.writeFile(
    //   path.join(outputPath, fileName),
    //   JSON.stringify(details, null, 2)
    // );
    // console.log(`Saved property details to ${fileName}`);
    return details;
  } catch (error) {
    console.error(`Error processing property ${property.address}:`, error);
  }
}

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
      outputData.push(details);
    }
    await fs.writeFile(
      path.join(outputPath, 'property-details--all-min.json'),
      JSON.stringify(outputData)
    );
    console.log(`Saved property details to property-details.json`);
  } catch (error) {
    console.error('Error reading or processing the input file:', error);
  }
}

main();
