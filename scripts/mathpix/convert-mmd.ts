import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { cleanHtmlFile } from './helpers';

// TODO:
// - [ ] add args to specify project folder
// - [ ] add args to specify gpt model name
// - [ ] add logic to determine the name of the input files (default look for all .mmd files in the folder the `${projectFolder}/reports/${modelName}/`)
// - [ ] add logic to create the name of the output file
// - [ ] add logic to version the output file (default is `v1`, if the file already exists, increment the version number)

const execAsync = util.promisify(exec);

// Command-line arguments
const args = process.argv.slice(2);
const extension =
  args.find((arg) => arg.startsWith('--ext='))?.split('=')[1] ?? 'docx';
console.log(`[INFO] Using file extension: .${extension}`);

// List of .mmd files to be modified
const files = [
  // 'paired-analysis-o1-v1.mmd',
  'paired-analysis-o1pro-v3.mmd',
  // Add more files as needed
];

// Folder to search for files
const folderName =
  '/Users/dougiefresh/Dropbox/Appraisals/basin-appraisals-llc/2025/residential/in-progress/10568 W Rolling Hills Rd/reports/analysis/results/';

async function findFilePaths(
  folder: string,
  filenames: string[]
): Promise<string[]> {
  const filePaths: string[] = [];
  const traverseFolder = async (dir: string) => {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await traverseFolder(fullPath);
      } else if (filenames.includes(item)) {
        filePaths.push(fullPath);
      }
    }
  };
  await traverseFolder(folder);
  return filePaths;
}

(async () => {
  try {
    const filePaths = await findFilePaths(folderName, files);

    // Loop through each file and modify it
    for (const filePath of filePaths) {
      try {
        const data = await fs.readFile(filePath, 'utf-8');

        const modifiedData = data
          // Remove all instances of dividing lines \n---\n
          .replace(/\n---\n/g, '\n')
          // Remove the h2 titled 'Recommendations' and all content below it until the next h2
          .replace(/## \d+\. Recommendations[\s\S]*?(?=\n## |$)/g, '');

        await fs.writeFile(filePath, modifiedData);
        console.log(`[INFO] ✅ File modified successfully: ${filePath}`);

        const outputFilePath = filePath.replace(/\.mmd$/, `.${extension}`);
        const command = `mpx convert "${filePath}" "${outputFilePath}"`;

        console.log(`[INFO] ℹ️ Running command: ${command}`);
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          console.error(`[ERROR] ❌ Command stderr: ${stderr}`);
        }
        console.log(`[INFO] ✅ Command stdout: ${stdout}`);
        if (extension === 'html') {
          console.log(`[INFO] ℹ️ cleaning output html file: ${command}`);
          await cleanHtmlFile(outputFilePath);
        }
      } catch (err) {
        console.error(`[ERROR] ❌ processing file: ${filePath}`, err);
      }
    }
  } catch (err) {
    console.error('[ERROR] ❌ finding file paths', err);
  }
})();
