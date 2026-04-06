# Raycast

This folder contains scripts for Appraisl Bot to use with Raycast.

## Installation

1. Install [Raycast](https://www.raycast.com/)
2. Open Raycast and go to `Extensions` > `Scripts`
3. Click `Script Commands` and then `Add Directory`
4. Add your script aliases in the Raycast ui

Note: You may need to run `chmod +x *.sh` to make the scripts executable.

- **download-cad-deed-playwriter.sh** — Scans comp subfolders (land/sales/rentals) for folders with only an MLS PDF; extracts the Tax ID, opens the PDF in Chrome for reference, then uses Playwriter to automate CAD page capture and deed PDF download. Results are copied back into each comp folder.
