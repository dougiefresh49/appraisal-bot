import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

export async function cleanHtmlFile(file: string): Promise<void> {
  try {
    // Read the file asynchronously
    const data = await fs.readFile(file, 'utf-8');

    // Parse the HTML content with JSDOM
    const dom = new JSDOM(data);
    const document = dom.window.document;

    // Remove the meta title tag
    const metaTitle = document.querySelector('meta[charset=UTF-8]');
    if (metaTitle) {
      metaTitle.remove();
    }

    // Remove the <h1> element with specific attributes
    const h1Element = document.querySelector('h1[type="title"].main-title');
    if (h1Element) {
      h1Element.remove();
    }

    // Modify the #preview CSS class
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach((styleElement) => {
      let cssText = styleElement.textContent;
      if (cssText) {
        cssText = cssText.replace(
          /#preview\s*{([^}]*?)max-width:\s*800px;([^}]*?)}/g,
          '#preview {$1max-width: 920px;$2}'
        );
        styleElement.textContent = cssText;
      }
    });

    // Serialize the modified DOM and write back to the file
    await fs.writeFile(file, dom.serialize());
    console.log(`[INFO] ✅ HTML File modified successfully: ${file}`);
  } catch (err) {
    console.error(`Error processing file: ${file}`, err);
  }
}
