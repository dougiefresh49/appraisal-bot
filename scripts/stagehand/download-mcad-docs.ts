import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import path from 'path';
import { getProjectArgs } from '../utils/project-args';

const { cadType, dataFilePath, outputPath } = getProjectArgs();

const cadUrls = {
  mcad: 'https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=',
  ecad: 'https://search.ectorcad.org/parcel/',
};

const baseUrl = cadUrls[cadType as keyof typeof cadUrls];

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
    const pdfPath = path.join(outputPath, `${sanitizedAddress}-cad.pdf`);

    // Directly save the page as a PDF (bypasses print preview)
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`✅ PDF saved: ${pdfPath}`);
  }

  await stagehand.close();
}

downloadPropertyDocs().catch(console.error);
