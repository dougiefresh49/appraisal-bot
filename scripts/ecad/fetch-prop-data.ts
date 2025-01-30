import fs from 'fs';
import path from 'path';

// List of property IDs to fetch
type PropertyID = string;
const propertyIds: PropertyID[] = [
  '10750.00019.00000',
  '34774.00500.00000',
  '26195.00060.00000',
  '26195.00050.00000',
  '32150.00580.00000',
  '32150.00570.00000',
  '17505.00270.00000', // Add more IDs as needed
];

// Endpoint template
const endpointTemplate = (propertyId: PropertyID): string =>
  `https://search.ectorcad.org/export?format=csv&catalog=r&search_str=${propertyId}`;

// Function to fetch data for a single property ID
async function fetchPropertyData(propertyId: PropertyID): Promise<string> {
  try {
    const response = await fetch(endpointTemplate(propertyId));
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data for Property ID: ${propertyId}, Status: ${response.status}`
      );
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch data for Property ID: ${propertyId}`, error);
    return ''; // Return an empty string on failure
  }
}

// Main function to process all property IDs and save to a CSV file
async function fetchAndSaveToCSV(propertyIds: PropertyID[]): Promise<void> {
  const outputFilePath = path.join(__dirname, 'properties.csv');

  // Initialize the output file with the header row
  let isHeaderWritten = false;

  for (const propertyId of propertyIds) {
    console.log(`Fetching data for Property ID: ${propertyId}`);
    const csvData = await fetchPropertyData(propertyId);

    if (csvData) {
      const rows = csvData.split('\n');

      if (!isHeaderWritten) {
        // Write the header row (first row of the response)
        fs.appendFileSync(outputFilePath, rows[0] + '\n', 'utf8');
        isHeaderWritten = true;
      }

      // Write the data rows (excluding the header row)
      const dataRows = rows.slice(1).filter((row) => row.trim() !== '');
      if (dataRows.length > 0) {
        fs.appendFileSync(outputFilePath, dataRows.join('\n') + '\n', 'utf8');
      }
    }
  }

  console.log(`Data saved to ${outputFilePath}`);
}

// Run the script
fetchAndSaveToCSV(propertyIds)
  .then(() => console.log('All property data has been processed.'))
  .catch((err) => console.error('An error occurred:', err));
