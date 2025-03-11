import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import path from 'path';

export async function cleanHtmlFile(
  file: string,
  reportName?: string
): Promise<void> {
  try {
    // example title: sale-analysis-results--v2.mmd
    const fileName = file.split('/').pop()?.split('.').shift();
    const fileVersion = fileName?.split('--').pop();
    const cleanedTitle = fileName
      ?.split('--')
      .shift()
      ?.replace(/-/g, ' ')
      .replace('results', '')
      .trim();
    const title = `${cleanedTitle} ${fileVersion}`;
    // Read the file asynchronously
    const data = await fs.readFile(file, 'utf-8');

    // Parse the HTML content with JSDOM
    const dom = new JSDOM(data);
    const document = dom.window.document;

    // Load the icon as a Base64 string
    const iconPath =
      '/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/tools/appraisal-bot/logos/logo48.png';
    const iconData = await fs.readFile(iconPath);
    const base64Icon = `data:image/png;base64,${iconData.toString('base64')}`;

    // Replace or add the favicon link
    let headIcon = document.querySelector('link[rel="icon"]');
    if (!!headIcon) {
      // @ts-ignore
      headIcon.href = base64Icon;
    } else {
      headIcon = document.createElement('link');
      // @ts-ignore
      headIcon.rel = 'icon';
      // @ts-ignore
      headIcon.href = base64Icon;
      document.head.appendChild(headIcon);
    }

    // Remove the meta title tag
    const metaTitle = document.querySelector('meta[charset=UTF-8]');
    if (metaTitle) {
      metaTitle.remove();
    }

    const headTitle = document.querySelector('title');
    if (headTitle) {
      headTitle.textContent = title;
    }

    const h1Element = document.querySelector('h1[type="title"].main-title');
    if (h1Element) {
      // change the title to the new title
      h1Element.textContent = `${title} ${reportName}`;
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
