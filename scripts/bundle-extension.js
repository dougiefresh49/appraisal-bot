const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'AppraisalBot-Shared');
const EXT_SRC = path.join(ROOT, 'chrome-extension', 'appraisal-bot');
const EXT_DEST = path.join(DIST, 'appraisal-bot');
const SCRIPTS_SRC = path.join(ROOT, 'scripts', 'windows');
const SCRIPTS_DEST = path.join(DIST, 'scripts');

const EXT_EXCLUDE = new Set(['examples', 'dom-samples', 'readme.md', '.ds_store', '.gitignore']);

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest, excludeSet) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const nameLower = entry.name.toLowerCase();
    if (excludeSet && excludeSet.has(nameLower)) continue;
    if (nameLower === '.ds_store') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const README_TEXT = `AppraisalBot - Setup Instructions
==================================

1. INSTALL GOOGLE DRIVE FOR DESKTOP
   Download from: https://www.google.com/drive/download/
   Sign in and let the folder sync.

2. LOAD THE EXTENSION IN CHROME
   a. Open Chrome and go to: chrome://extensions
   b. Enable "Developer mode" (toggle in top-right)
   c. Click "Load unpacked"
   d. Select the "appraisal-bot" folder inside this directory

3. SET UP UPDATE NOTIFICATIONS (optional)
   a. Open the "scripts" folder
   b. Double-click "install-watcher.bat" (one-time setup)
   c. You will get a notification when a new version is available
   d. To stop notifications, double-click "uninstall-watcher.bat"

4. INSTALL CONTEXT MENU TOOLS (optional)
   a. Double-click "install-context-menu.reg" in the scripts folder
   b. This adds a right-click option in Windows Explorer to scaffold
      appraisal workfile folders

5. UPDATING THE EXTENSION
   When you receive an update notification:
   a. Open Chrome and go to: chrome://extensions
   b. Find "AppraisalBot Linker" and click the refresh icon
   c. Done!

For questions, contact your AppraisalBot administrator.
`;

console.log('Bundling AppraisalBot for distribution...\n');

rimraf(DIST);

console.log('  Copying extension files...');
copyDir(EXT_SRC, EXT_DEST, EXT_EXCLUDE);

if (fs.existsSync(SCRIPTS_SRC)) {
  console.log('  Copying Windows scripts...');
  copyDir(SCRIPTS_SRC, SCRIPTS_DEST);
} else {
  console.log('  No scripts/windows/ directory found, skipping scripts.');
  fs.mkdirSync(SCRIPTS_DEST, { recursive: true });
}

console.log('  Writing README.txt...');
fs.writeFileSync(path.join(DIST, 'README.txt'), README_TEXT);

const manifest = JSON.parse(fs.readFileSync(path.join(EXT_DEST, 'manifest.json'), 'utf-8'));
console.log(`\nDone! Bundled v${manifest.version} to dist/AppraisalBot-Shared/`);
console.log('Copy the contents of that folder to your Google Drive shared folder.');
