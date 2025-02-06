import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import path from 'path';

const baseUrl =
  'https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=';

// Path to JSON file containing property data
const dataPathRoot =
  '/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/2025/residential/in-progress/3101 Storey -- AN 2-6-25/comps';
const dataFilePath = path.resolve(dataPathRoot, 'data/mls-temp-data.json');

// Load property data from JSON file
const properties: { address: string; mls: string; cad: string | null }[] =
  JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

async function downloadPropertyDocs() {
  const stagehand = new Stagehand({
    env: 'LOCAL', // Or 'BROWSERBASE' if using API keys
    headless: true, // Run in headless mode to bypass print preview UI
  });

  await stagehand.init();
  const page = stagehand.page;

  // Define the download folder
  const downloadPath = path.resolve(dataPathRoot, 'CAD-downloads');

  // Ensure the download directory exists
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  for (const { address, cad } of properties) {
    if (!cad) {
      console.warn(`⚠️ Skipping property ${address} - No CAD ID`);
      continue;
    }

    const url = `${baseUrl}${cad}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Format address for filename (replace spaces & special characters)
    const sanitizedAddress = address.replace(/[^a-zA-Z0-9]/g, '_');

    // Define PDF file path
    const pdfPath = path.join(downloadPath, `${sanitizedAddress}-cad.pdf`);

    // Directly save the page as a PDF (bypasses print preview)
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`✅ PDF saved: ${pdfPath}`);
  }

  await stagehand.close();
}

downloadPropertyDocs().catch(console.error);
