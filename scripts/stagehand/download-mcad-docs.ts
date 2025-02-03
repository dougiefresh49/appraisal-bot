import { Stagehand } from '@browserbasehq/stagehand';
import fs from 'fs';
import path from 'path';

const baseUrl =
  'https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=';

const propertyIds: string[] = ['R000057177'];

async function downloadPropertyDocs() {
  const stagehand = new Stagehand({
    env: 'LOCAL', // Or 'BROWSERBASE' if using API keys
    headless: true, // Run in headless mode to bypass the print preview UI
  });

  await stagehand.init();
  const page = stagehand.page;

  // Define the download folder
  const downloadPath = path.resolve(__dirname, 'downloads');

  // Ensure the download directory exists
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  for (const id of propertyIds) {
    const url = `${baseUrl}${id}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Directly save the page as a PDF (bypasses print preview)
    const pdfPath = path.join(downloadPath, `Property_Information_${id}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`✅ PDF saved: ${pdfPath}`);
  }

  await stagehand.close();
}

downloadPropertyDocs().catch(console.error);
