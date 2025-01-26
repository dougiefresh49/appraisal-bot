import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import { DOMParser } from 'xmldom';

function extractTagsFromTemplate(templatePath: string): string[] {
  const templateContent = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(templateContent);

  // Access document XML
  const docFile = zip.files['word/document.xml'];
  if (!docFile) {
    throw new Error('Cannot find the document XML in the Word template.');
  }

  const documentXml = docFile.asText();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, 'text/xml');

  // Word placeholders are split into multiple XML tags; combine them
  const texts = Array.from(xmlDoc.getElementsByTagName('w:t'));
  const placeholders: string[] = [];
  let currentPlaceholder = '';

  texts.forEach((text) => {
    // @ts-ignore
    const content = text?.textContent || '';
    if (content.startsWith('{{') && !content.endsWith('}}')) {
      // Start of a placeholder
      currentPlaceholder = content;
    } else if (!content.startsWith('{{') && content.endsWith('}}')) {
      // End of a placeholder
      currentPlaceholder += content;
      placeholders.push(currentPlaceholder);
      currentPlaceholder = '';
    } else if (currentPlaceholder) {
      // Middle of a placeholder
      currentPlaceholder += content;
    }
  });

  // Deduplicate placeholders
  // return Array.from(new Set(placeholders));
  return placeholders;
}

// Example Usage
const templatePath = path.resolve(__dirname, 'land-report-template2.docx');
try {
  const tags = extractTagsFromTemplate(templatePath);
  console.log('Tags found in the template:', tags);
} catch (error) {
  console.error('Error extracting tags:', error.message);
}
