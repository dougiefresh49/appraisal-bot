import { Stagehand } from '@browserbasehq/stagehand';

// 1. Property Address List:
const propertyAddresses: string[] = [
  '3324 Neely Ave Midland, TX 79707',
  '300 N Loraine St, Midland, TX 79701',
  '500 N Baird St, Midland, TX 79701',
  // Add more addresses here
];

console.log('gpt api key', process.env.OPENAI_API_KEY);

// 2. Main Function (async):
async function getPropertyCADLinks() {
  // 3. Create Stagehand Instance:
  const stage = new Stagehand({
    env: 'LOCAL', // Or 'BROWSERBASE' if you have API keys
  });
  await stage.init();
  const page = stage.page;

  // 4. Output Array:
  const cadLinks: string[] = [];

  // 5. Loop Through Addresses:
  for (const address of propertyAddresses) {
    try {
      // 6. Navigate and Search:
      await page.goto('http://www.midcad.org/');

      await page.act({
        action: 'Click on the Property Search menu item',
      });

      await page.act({
        action: 'Click on the Search Properties link',
      });

      await page.act({
        action: `Type ${address} into the Address field`,
      });

      await page.act({
        action: 'Click the Search button',
      });

      // 7. Wait for Results and Get URL:
      //    Stagehand might automatically wait for navigation after a click,
      //    but it doesn't hurt to be explicit
      await page.waitForNavigation();
      const url = page.url();

      // 8. Store Result:
      cadLinks.push(`${address}: ${url}`);
    } catch (error) {
      console.error(`Error processing ${address}:`, error);
      cadLinks.push(`${address}: Error - Could not find CAD record.`);
    }
  }

  // 9. Close Stage:
  await stage.close();

  // 10. Output Results:
  console.log('CAD Record Links:');
  cadLinks.forEach((link) => console.log(link));
}

// 11. Run the Script:
getPropertyCADLinks();
