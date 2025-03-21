import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getProjectArgs } from '../utils/project-args';

type StagehandPage = typeof Stagehand.prototype.page;

const { cadType, dataFilePath, outputPath } = getProjectArgs();

const cadUrls = {
  mcad: 'https://iswdataclient.azurewebsites.net/webProperty.aspx?dbkey=MIDLANDCAD&id=',
  ecad: 'https://search.ectorcad.org/parcel/',
};
const deedUrls = {
  mcad: '',
  ecad: 'https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1',
};

const baseUrl = cadUrls[cadType as keyof typeof cadUrls];
const deedBaseUrl = deedUrls[cadType as keyof typeof deedUrls];
// Load property data from JSON file
const properties: {
  address: string;
  mls: string;
  cad?: keyof typeof cadUrls;
  apn?: string;
  lot?: string;
  skip?: boolean;
}[] = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

async function downloadDeedDocs(
  page: StagehandPage,
  instrumentNumber: string,
  address: string
) {
  await page.context().addCookies([
    {
      name: 'disclaimerAccepted',
      value: 'true',
      domain: 'ectorcountytx-web.tylerhost.net',
      path: '/web',
    },
  ]);
  await page.goto(`${deedBaseUrl}`, { waitUntil: 'networkidle' });
  await page.fill('#field_DocumentNumberID', instrumentNumber);
  await page.click('#searchButton');
  await page.waitForSelector('.selfServiceSearchResultHeaderLeft', {
    timeout: 10000,
  });

  const listItem = await page
    .locator('.selfServiceSearchResultList li', { hasText: instrumentNumber })
    .first();

  if (!listItem) {
    console.error('❌ No matching instrument number found.');
    return;
  }

  await listItem.click();

  // Wait for the "View" button to be visible
  await page.waitForSelector(
    '.selfServiceSearchFullResult.selfServiceSearchResultNavigation'
  );

  // Click the "View" button
  await page.click(
    '.selfServiceSearchFullResult.selfServiceSearchResultNavigation'
  );

  // Wait for the iframe to load
  const iframe = await page.frameLocator('.ss-pdfjs-lviewer');

  // Wait for the "Download" button inside the iframe
  await iframe.locator('#download').waitFor({ timeout: 30000 });

  // Debugging: Take a screenshot of the iframe
  // await page.screenshot({ path: 'debug_iframe.png', fullPage: true });

  // Click the "Download" button inside the iframe
  const [download] = await Promise.all([
    page.waitForEvent('download'), // Wait for the file download event
    iframe.locator('#download').click(), // Click the download button inside iframe
  ]);

  // Save the downloaded deed record
  const pdfPath = path.join(
    outputPath,
    `${address}-deed--${instrumentNumber}.pdf`
  );
  await download.saveAs(pdfPath);

  console.log(`✅ Deed record downloaded: ${pdfPath}`);
}

async function downloadPropertyDocs() {
  const stagehand = new Stagehand({
    modelName: 'gpt-4o',
    env: 'LOCAL', // Or 'BROWSERBASE' if using API keys
    headless: true, // Run in headless mode to bypass print preview UI
  });

  await stagehand.init();
  const page = stagehand.page;
  const instrumentNumbers: Record<string, string> = {};

  const filteredProperties = properties.filter((p) => !p.skip);
  for (const { address, cad, apn, lot } of filteredProperties) {
    if (!cad && !apn) {
      console.warn(`⚠️ Skipping property ${address} - No CAD ID`);
      continue;
    }

    const url = !!cad ? `${cadUrls[cad]}${apn}` : `${baseUrl}${apn}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Format address for filename (replace spaces & special characters)
    const sanitizedAddress = address.replace(/[^a-zA-Z0-9]/g, ' ');

    // Define PDF file path
    const pdfPath = path.join(
      outputPath,
      `${sanitizedAddress}${lot ? `-lot-${lot}` : ''}-cad.pdf`
    );

    // Directly save the page as a PDF (bypasses print preview)
    await page.pdf({ path: pdfPath, format: 'A4' });

    console.log(`✅ PDF saved: ${pdfPath}`);

    // extract instrument number from ecad
    // if (cadType === 'ecad') {
    //   const extractedData = await page.extract({
    //     instruction:
    //       "Find the 'Last Sale Instrument' value from the property details page.",
    //     schema: z.object({
    //       instrumentNumber: z.string(),
    //     }),
    //   });
    //   const instrumentNumber = extractedData.instrumentNumber;
    //   if (instrumentNumber) {
    //     instrumentNumbers[apn!] = instrumentNumber;
    //     console.log(
    //       `✅ Instrument number found for apn ${apn!}: ${instrumentNumber}`
    //     );
    //     await downloadDeedDocs(page, instrumentNumber, sanitizedAddress);
    //   } else {
    //     console.warn(
    //       `⚠️ Skipping deed for property ${address} - No instrument number found`
    //     );
    //   }
    // }

    // const extractedNetAssessedValue = await page.extract({
    //   instruction:
    //     "find the 'Net Assessed Value' for 2024 in the value history table. It is the last row in the first column in the table. Return only the value, no other text.",
    //   schema: z.object({
    //     netAssessedValue: z.string(),
    //   }),
    // });
    // console.log(extractedNetAssessedValue);
  }

  await stagehand.close();
}

downloadPropertyDocs().catch(console.error);
