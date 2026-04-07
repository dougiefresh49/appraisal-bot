# appraisal-bot

Appraisal workflow automation toolkit for West Texas residential appraisers. Includes a Chrome extension (AppraisalBot Linker) for real-time browser enhancements, plus Node.js/TypeScript scripts for data processing and Google Apps Script integrations.

---

## Chrome Extension — AppraisalBot Linker

Located in `chrome-extension/appraisal-bot/`. Built for Manifest V3.

### Features

**Side Panel**

- Subject Data section with a Form/CSV toggle for entering subject property details (address, county, CAD number, effective date, year built, GLA). Data is persisted in `chrome.storage.local` and shared with all content scripts.
- Comp Grid Data section for loading, navigating, and displaying comp CSV exports.
- Quick Links section with one-click links to CAD, Deeds, and GIS for each supported county.
- Navica Tools section with buttons to auto-fill MLS search criteria, highlight comp listings, export CSV data, and save market stats — all driven by the loaded subject data.

**Content Scripts (by site)**

| Site                                                             | Script(s)                                                                   | What it does                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Ector CAD (`search.ectorcad.org/parcel/*`)                       | `ecad-injector.js`                                                          | Adds Google Maps pin, GIS link, and clickable deed links on parcel pages                                                     |
| Ector CAD advanced search (`search.ectorcad.org/search/adv*`)    | `ecad-sale-injector.js`                                                     | Enhances sale search results                                                                                                 |
| Ector County Deeds (`ectorcountytx-web.tylerhost.net/web/*`)     | `ecad-deed-injector.js`                                                     | Auto-fills and submits deed document searches; extracts deed data across page navigations using `chrome.storage.local` state |
| Andrews CAD (`esearch.andrewscad.org/Property/View/*`)           | `andrews-cad-injector.js`                                                   | Adds Google Maps pin, GIS link, and deed record links on property detail pages                                               |
| Andrews County Deeds (`andrewscountytx-web.tylerhost.net/web/*`) | `andrews-deed-injector.js`, `andrews-deed-search-injector.js`               | Same Tylerhost deed search automation as Ector, scoped to Andrews County                                                     |
| Andrews GIS (`gis.bisclient.com/andrewscad/*`)                   | `andrews-gis-injector.js`                                                   | Auto-dismisses the "I Agree" splash popup on load                                                                            |
| Midland CAD (`southwestdatasolution.com/webProperty.aspx*`)      | `mcad-injector.js`                                                          | Enhances Midland CAD property pages                                                                                          |
| Midland County Deeds (`midland.tx.publicsearch.us/results*`)     | `mcad-deed-injector.js`                                                     | Enhances Midland deed search results                                                                                         |
| Midland GIS (`maps.midlandtexas.gov/*`)                          | `gis-injector-midland--search.js`, `gis-injector-midland--popup.js`         | Search and popup enhancements on the Midland GIS viewer                                                                      |
| Ector Zoning (ArcGIS Experience)                                 | —                                                                           | `zoning-injector-ector.js` is **not** registered in the manifest (automation paused). Ector CAD injects a direct map link only. |
| Upton County Deeds (`i2j.uslandrecords.com/TX/Upton/*`)          | `upton-deed-injector.js`                                                    | Deed search automation for Upton County                                                                                      |
| Ward CAD GIS (`maps.pandai.com/WardCAD/*`)                       | `gis-injector-ward--search.js`                                              | Search enhancements on the Ward CAD GIS viewer                                                                               |
| Navica MLS — OBR (`next.navicamls.net/377/*`)                    | `navica-tools.js`, `mls-injector-obr.js`                                    | Adds CAD/GIS links to Tax ID fields; drives all Navica Tools side panel actions                                              |
| Navica MLS — PBBR (`next.navicamls.net/381/*`)                   | `navica-tools.js`, `mls-injector-pbbr.js`                                   | Same as OBR for PBBR board listings                                                                                          |
| Navica MLS map search                                            | `navica-map-tools.js`, `mls-map-search-obr.js`, `mls-map-dialog-overlay.js` | Map search and dialog overlay enhancements                                                                                   |
| PBBR CRS Data (`pbbr.crsdata.com/mls/property/*`)                | `mls-tax-suite-injector.js`                                                 | Tax ID linking on CRS Data listing pages                                                                                     |

**Context Menu (`context-menu.js`)**

Right-clicking selected text (a CAD number or address) in Chrome shows an "AppraisalBot" submenu with county-specific shortcuts to CAD, Deeds, and GIS for Andrews, Ector, Midland, Upton, and Ward counties.

**Supported Counties**

| County  | CAD                              | Deeds                             | GIS                          |
| ------- | -------------------------------- | --------------------------------- | ---------------------------- |
| Andrews | esearch.andrewscad.org           | andrewscountytx-web.tylerhost.net | gis.bisclient.com/andrewscad |
| Ector   | search.ectorcad.org              | ectorcountytx-web.tylerhost.net   | search.ectorcad.org/map      |
| Midland | southwestdatasolution.com (SWDS) | midland.tx.publicsearch.us        | maps.midlandtexas.gov        |
| Upton   | uptoncad.org                     | i2j.uslandrecords.com/TX/Upton    | maps.pandai.com/UptonCAD     |
| Ward    | wardcad.org                      | —                                 | maps.pandai.com/WardCAD      |

### TODO (Chrome extension)

- **Ector automated zoning:** The county map now uses ArcGIS Experience Builder. Restore end-to-end behavior by (1) adding a `content_scripts` entry in `manifest.json` that matches the new app URL, (2) porting or rewriting `zoning-injector-ector.js` to read zoning from that UI, (3) updating `background.js` `getZoning` if the hidden-tab flow or URL shape changes, and (4) re-calling `requestAndInsertZoning` from `ecad-injector.js` on the Location row when automation works again.

### Installing the Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select `chrome-extension/appraisal-bot/`
5. The extension icon will appear in the toolbar

To open the side panel, click the extension icon or use the right-click context menu.

### Building a Distribution Bundle

The `ext:bundle` script packages the extension and Windows helper scripts into `dist/AppraisalBot/` for sharing with coworkers (e.g. via Google Drive).

```bash
npm run ext:bundle
```

This runs `scripts/bundle-extension.js`, which:

- Copies `chrome-extension/appraisal-bot/` → `dist/AppraisalBot/appraisal-bot/` (excluding `examples/`, `dom-samples/`, and `readme.md`)
- Copies `scripts/windows/` → `dist/AppraisalBot/scripts/` (Windows helper `.bat` / `.reg` files, if present)
- Writes a `README.txt` with end-user setup instructions

Copy the contents of `dist/AppraisalBot/` to your shared Google Drive folder. Coworkers install by loading the `appraisal-bot` subfolder as an unpacked extension and refreshing it whenever a new version is dropped.

**Updating the version:** Bump `"version"` in `chrome-extension/appraisal-bot/manifest.json` before bundling. After coworkers receive the new files they just hit the refresh icon (⟳) on `chrome://extensions/`.

---

## Node.js / TypeScript Scripts

Located in `scripts/`. Run with `tsx` via `npm run <script>`.

| Script                                            | Command                   | Description                                              |
| ------------------------------------------------- | ------------------------- | -------------------------------------------------------- |
| `scripts/real-api/save-details.ts`                | `npm run realapi:details` | Fetches and saves property detail data from the Real API |
| `scripts/real-api/get-neighborhood-stats.ts`      | `npm run realapi:stats`   | Pulls neighborhood statistics from the Real API          |
| `scripts/stagehand/download-cad-docs.ts`          | `npm run cad:download`    | Downloads CAD documents via Stagehand browser automation |
| `scripts/stagehand/get-mcad-links.ts`             | `npm run mcad:links`      | Scrapes MCAD property links via Stagehand                |
| `scripts/land-report/populate-report-template.ts` | `npm run report:populate` | Populates a .docx report template with property data     |
| `scripts/land-report/extract-tags.ts`             | `npm run report:get-tags` | Extracts template tags from a .docx file                 |
| `scripts/mathpix/adjust-html.ts`                  | `npm run html:clean`      | Cleans up HTML output from Mathpix                       |
| `scripts/mathpix/convert-mmd.ts`                  | `npm run convert:mmd`     | Converts Mathpix MMD format files                        |
| `scripts/total/create-quicklist.ts`               | `npm run total:ql:create` | Creates a Total quicklist from comp data                 |

All scripts load environment variables from a `.env` file in the project root.

---

## Google Apps Scripts

Located in `app-scripts/`. Deployed and synced via [clasp](https://github.com/google/clasp).

| Project             | Push                             | Pull                             | Description                                          |
| ------------------- | -------------------------------- | -------------------------------- | ---------------------------------------------------- |
| `apbot-report-data` | `npm run push:apbot-report-data` | `npm run pull:apbot-report-data` | Apps Script attached to the report data Google Sheet |
| `apbot-report-doc`  | `npm run push:apbot-report-doc`  | `npm run pull:apbot-report-doc`  | Apps Script attached to the report Google Doc        |
| `ApBot2`            | `npm run push:apbot2`            | `npm run pull:apbot2`            | Secondary ApBot Apps Script project                  |

---

## Project Structure

```
appraisal-bot/
├── chrome-extension/
│   └── appraisal-bot/          # Extension source (load this folder in Chrome)
│       ├── manifest.json
│       ├── background.js
│       ├── context-menu.js
│       ├── navica-tools.js     # Navica MLS automation logic (shared class)
│       ├── *-injector.js       # Content scripts per site/county
│       ├── sidepanel/          # Side panel UI (HTML, CSS, JS)
│       ├── popup/              # Extension popup
│       ├── utils/
│       └── logos/
├── scripts/                    # Node.js/TypeScript utility scripts
│   ├── bundle-extension.js     # Distribution bundler (npm run ext:bundle)
│   ├── windows/                # Windows helper scripts (.bat, .reg)
│   └── ...
├── app-scripts/                # Google Apps Script projects (clasp)
├── prompts/                # AI prompt templates for appraisal workflows
├── dist/                       # Built output from ext:bundle (git-ignored)
└── package.json
```
