import fs from 'fs';
import path from 'path';
import { cleanHtmlFile } from './helpers';

// Root folder where the search should begin
const rootFolder = path.resolve(
  '/Users/dougiefresh/Dropbox/Appraisals/jami-langford/2024/commercial/I-20-land--midland/reports'
);

// List of HTML files to be modified
const fileNames = [
  'paired-analysis-o1pro-v2.html',
  // Add more files as needed
];

// Function to recursively search for files in a directory
function findFiles(dir, targetFiles, foundFiles = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, targetFiles, foundFiles);
    } else if (targetFiles.includes(entry.name)) {
      foundFiles.push(fullPath as never);
    }
  });

  return foundFiles;
}

// Find all the target files in the root folder
const files = findFiles(rootFolder, fileNames);

// Iterate over each found file and make the necessary modifications
for (const file of files) {
  try {
    await cleanHtmlFile(file);
  } catch (err) {
    console.error(`Error processing file: ${file}`, err);
  }
}
