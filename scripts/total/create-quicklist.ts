import * as fs from 'fs';
import path from 'path';
import { parse } from 'fast-csv';
import { create } from 'xmlbuilder2';

// Define the path for input CSV and output XML
const csvFilePath = path.join(__dirname, 'quicklists.csv');
const xmlFilePath = path.join(__dirname, 'quicklists.xml');

// Read the CSV and parse it
const entries: { shortName: string; value: string }[] = [];

fs.createReadStream(csvFilePath)
  .pipe(parse({ headers: true, trim: true }))
  .on('data', (row) => {
    entries.push({
      shortName: row['shortname'],
      value: row['value'],
    });
  })
  .on('end', () => {
    console.log(`✅ Loaded ${entries.length} entries from CSV`);

    // Build the XML structure
    const xmlRoot = create({ version: '1.0' })
      .ele('QLForms', {
        QuickListType: 'AllForms',
        Mode: 'Normal',
        version: '2.0',
      })
      .ele('QLForm', { Name: 'AllForms' });

    entries.forEach((entry, index) => {
      xmlRoot
        .ele('Entry', {
          key: (index + 1).toString(),
          shortName: entry.shortName,
          value: entry.value,
          DateModified: new Date().toLocaleString(),
        })
        .up();
    });

    // Convert to XML string and save to file
    const xmlString = xmlRoot.end({ prettyPrint: true });
    fs.writeFileSync(xmlFilePath, xmlString, 'utf-8');

    console.log(`✅ XML file created: ${xmlFilePath}`);
  });
