import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import path from 'path';

// read cad type from command line args
const args = process.argv.slice(2);
const cadType =
  args.find((arg) => arg.startsWith('--cad='))?.split('=')[1] ?? 'mcad';
const projectFolder =
  args.find((arg) => arg.startsWith('--project='))?.split('=')[1] ??
  'no-project';
const projectType =
  args.find((arg) => arg.startsWith('--type='))?.split('=')[1] ?? 'residential';
const propType =
  args.find((arg) => arg.startsWith('--prop='))?.split('=')[1] ?? 'comps';

const cadUrls = {
  mcad: 'https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=',
  ecad: 'https://search.ectorcad.org/parcel/',
};

const baseUrl = cadUrls[cadType as keyof typeof cadUrls];

// Path to JSON file containing property data
const dataPathRoot = path.resolve(
  '/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc',
  '2025',
  projectType,
  'in-progress',
  projectFolder,
  propType
);
const dataFilePath = path.resolve(dataPathRoot, 'data/property-data.json');

// Load property data from JSON file
const properties: {
  address: string;
  mls: string;
  cad?: string;
  apn?: string;
}[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

async function downloadPropertyDocs() {
  const stagehand = new Stagehand({
    env: 'LOCAL', // Or 'BROWSERBASE' if using API keys
    headless: true, // Run in headless mode to bypass print preview UI
  });

  await stagehand.init();
  const page = stagehand.page;

  // Define the download folder
  const downloadFolder = propType === 'comps' ? 'cad-downloads' : '';
  const downloadPath = path.resolve(dataPathRoot, downloadFolder);

  // Ensure the download directory exists
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  for (const { address, cad, apn } of properties) {
    if (!cad && !apn) {
      console.warn(`⚠️ Skipping property ${address} - No CAD ID`);
      continue;
    }

    const url = `${baseUrl}${cad ?? apn}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Format address for filename (replace spaces & special characters)
    const sanitizedAddress = address.replace(/[^a-zA-Z0-9]/g, ' ');

    // Define PDF file path
    const pdfPath = path.join(downloadPath, `${sanitizedAddress}-cad.pdf`);

    // Directly save the page as a PDF (bypasses print preview)
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`✅ PDF saved: ${pdfPath}`);
  }

  await stagehand.close();
}

downloadPropertyDocs().catch(console.error);
