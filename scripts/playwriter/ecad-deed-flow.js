/**
 * Ector CAD → deed PDF helpers for the Playwriter JS sandbox.
 *
 * Usage (from repo root, with Playwriter session):
 *   const flow = require('./scripts/playwriter/ecad-deed-flow.js');
 *   await flow.gotoCadParcel(state.page, { taxId: '10930.00140.00000' });
 *   await flow.saveCadPdf(state.page, { outputPath, addressSlug, lot });
 *   const instrument = await flow.extractLastSaleInstrument(state.page);
 *   await flow.downloadDeedPdf(state.page, { instrumentNumber: instrument, outputPath, addressSlug });
 *
 * Paths in outputPath should be absolute for predictable save locations.
 */
'use strict';

const path = require('node:path');
const fs = require('node:fs');

const ECAD_PARCEL_BASE = 'https://search.ectorcad.org/parcel/';
const TYLER_DEED_SEARCH_URL =
  'https://ectorcountytx-web.tylerhost.net/web/search/DOCSEARCH144S1';

/** @param {string} address */
function sanitizeAddressSlug(address) {
  return String(address).replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Filename-safe fragment (no spaces) for PDF basenames — avoids saveAs issues on some setups */
function safePdfBasenamePart(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+/g, '')
    .replace(/-+/g, '-')
    .replace(/-+$/g, '');
}

/** @param {string} taxId */
function cadParcelUrl(taxId) {
  const id = String(taxId).trim();
  return `${ECAD_PARCEL_BASE}${encodeURIComponent(id)}`;
}

/**
 * @param {import('playwright').Page} page
 * @param {{ taxId: string }} opts
 */
async function gotoCadParcel(page, { taxId }) {
  const url = cadParcelUrl(taxId);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log('CAD URL:', page.url());
}

/**
 * @param {import('playwright').Page} page
 * @param {{ outputPath: string, addressSlug: string, lot?: string }} opts
 * @returns {Promise<string>} absolute path written
 */
async function saveCadPdf(page, { outputPath, addressSlug, lot }) {
  const dir = path.resolve(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  const lotPart = lot ? `-lot-${safePdfBasenamePart(lot)}` : '';
  const base = `${safePdfBasenamePart(sanitizeAddressSlug(addressSlug))}${lotPart}-cad.pdf`;
  const pdfPath = path.join(dir, base);

  /** Wait for Appraisal Bot extension to finish injecting deed info before printing */
  try {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.AppraisalBot-deed-info');
        if (!el) return true;
        return !(el.textContent || '').includes('Loading');
      },
      { timeout: 15000 },
    );
    console.log('Deed info ready.');
  } catch {
    console.warn('AppraisalBot-deed-info did not finish loading within 15s — printing anyway.');
  }

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
  });
  console.log('CAD PDF saved:', pdfPath);
  return pdfPath;
}

/**
 * Read "Last Sale Instrument" from ECAD parcel summary table.
 *
 * Selectors (Feb 2026 Tyler/ECAD):
 * - Primary: table row containing label "Last Sale Instrument", then first anchor in row (instrument ID).
 * - Fallback: same row, strip label cell text from full row text.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<string|null>}
 */
async function extractLastSaleInstrument(page) {
  const row = page.locator('tr').filter({ hasText: /Last\s+Sale\s+Instrument/i }).first();
  const rowCount = await row.count();
  if (rowCount === 0) {
    console.warn('No table row matched "Last Sale Instrument".');
    return null;
  }

  const link = row.locator('a').first();
  if ((await link.count()) > 0) {
    const href = await link.getAttribute('href');
    const text = (await link.innerText()).trim();
    if (text && /[\d-]+/.test(text)) {
      console.log('Last Sale Instrument (link):', text, href ? `(href present)` : '');
      return text;
    }
  }

  const cells = row.locator('td, th');
  const n = await cells.count();
  for (let i = 0; i < n; i++) {
    const t = ((await cells.nth(i).innerText()) || '').trim();
    if (t && !/last\s+sale\s+instrument/i.test(t) && /[\d-]{4,}/.test(t)) {
      console.log('Last Sale Instrument (cell):', t);
      return t.split(/\s+/)[0];
    }
  }

  const raw = ((await row.innerText()) || '').replace(/Last\s+Sale\s+Instrument/gi, '').trim();
  const m = raw.match(/(\d{4}-\d{8,}|[\d.-]+)/);
  if (m) {
    console.log('Last Sale Instrument (regex):', m[1]);
    return m[1];
  }

  console.warn('Could not parse Last Sale Instrument from row.');
  return null;
}

/**
 * Ector County Tyler iMap / land records deed PDF download.
 * Mirrors scripts/stagehand/download-cad-docs.ts flow.
 *
 * @param {import('playwright').Page} page
 * @param {{ instrumentNumber: string, outputPath: string, addressSlug: string }} opts
 */
/**
 * Route Chrome downloads into outputDir (Playwriter often cannot read Playwright's temp artifact path).
 * Only runs when Playwriter injects getCDPSession into the sandbox.
 */
async function allowDownloadsToDir(page, outputDir) {
  if (typeof getCDPSession !== 'function') {
    return;
  }
  try {
    const cdp = await getCDPSession({ page });
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: path.resolve(outputDir),
      eventsEnabled: true,
    });
    console.log('Browser downloads →', path.resolve(outputDir));
  } catch (e) {
    console.warn('Browser.setDownloadBehavior failed:', e.message || e);
  }
}

async function downloadDeedPdf(page, { instrumentNumber, outputPath, addressSlug }) {
  const inst = String(instrumentNumber).trim();
  if (!inst) {
    console.warn('Skipping deed: empty instrument number.');
    return null;
  }

  const outDir = path.resolve(outputPath);
  fs.mkdirSync(outDir, { recursive: true });
  /**
   * CDP direct-to-disk can suppress Playwright's download event in some setups.
   * From a normal Node script you could set process.env.PLAYWRITER_ECDAD_USE_CDP_DOWNLOAD=1 — not in Playwriter sandbox (no process).
   */
  const useCdpDownload =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.PLAYWRITER_ECDAD_USE_CDP_DOWNLOAD === '1';
  if (useCdpDownload) {
    await allowDownloadsToDir(page, outDir);
  }

  await page.goto(TYLER_DEED_SEARCH_URL, { waitUntil: 'domcontentloaded' });
  // Playwriter extension mode: context.addCookies() often fails (no CDP storage tab). Set from the page.
  await page.evaluate(() => {
    document.cookie = 'disclaimerAccepted=true; path=/web';
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.fill('#field_DocumentNumberID', inst);
  await page.click('#searchButton');

  await page.waitForSelector('.selfServiceSearchResultHeaderLeft', { timeout: 15000 });

  const listItem = page
    .locator('.selfServiceSearchResultList li', { hasText: inst })
    .first();
  if ((await listItem.count()) === 0) {
    console.error('No search result list item for instrument:', inst);
    return null;
  }

  await listItem.click();

  await page.waitForSelector(
    '.selfServiceSearchFullResult.selfServiceSearchResultNavigation',
    { timeout: 15000 },
  );

  const deedPath = path.join(
    outDir,
    `${safePdfBasenamePart(sanitizeAddressSlug(addressSlug))}-deed--${safePdfBasenamePart(inst)}.pdf`,
  );

  await page.click(
    '.selfServiceSearchFullResult.selfServiceSearchResultNavigation',
  );

  /**
   * Primary: Tyler uses PDF.js; read bytes via getData() (no top-level application/pdf response).
   */
  const pdfJsDeadline = Date.now() + 90000;
  let viewerFrame = null;
  while (Date.now() < pdfJsDeadline) {
    const frames = page.frames();
    for (const frame of frames) {
      try {
        const ready = await frame.evaluate(() => {
          const app = window.PDFViewerApplication;
          return !!(app && app.pdfDocument);
        });
        if (ready) {
          viewerFrame = frame;
          break;
        }
      } catch {
        /* cross-origin / not pdf.js */
      }
    }
    if (viewerFrame) break;
    await page.waitForTimeout(400);
  }

  if (viewerFrame) {
    try {
      const bytes = await viewerFrame.evaluate(async () => {
        const u8 = await window.PDFViewerApplication.pdfDocument.getData();
        return Array.from(u8);
      });
      if (bytes && bytes.length > 500) {
        fs.writeFileSync(deedPath, Buffer.from(bytes));
        console.log('Deed PDF saved (PDF.js getData):', deedPath, `(${bytes.length} bytes)`);
        return deedPath;
      }
    } catch (e) {
      console.warn('PDF.js getData failed:', e.message || e);
    }
  }

  /** Fallback: PDF.js toolbar #download + Playwright download APIs */
  const iframeDeadline = Date.now() + 60000;
  viewerFrame = null;
  while (Date.now() < iframeDeadline) {
    const frames = page.frames();
    for (const frame of frames) {
      try {
        const n = await frame.locator('#download').count();
        if (n > 0) {
          viewerFrame = frame;
          break;
        }
      } catch {
        /* cross-origin */
      }
    }
    if (viewerFrame) break;
    await page.waitForTimeout(400);
  }
  if (!viewerFrame) {
    console.error('PDF viewer: no frame with #download.');
    return null;
  }

  const beforeFiles = new Set(fs.readdirSync(outDir));
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await viewerFrame.locator('#download').first().click();
  let download = null;
  try {
    download = await downloadPromise;
  } catch (e) {
    console.warn('waitForEvent(download):', e.message || e);
  }

  const pollDeadline = Date.now() + 90000;
  let donePath = null;
  while (Date.now() < pollDeadline) {
    const names = fs
      .readdirSync(outDir)
      .filter((f) => f.endsWith('.pdf') && !beforeFiles.has(f));
    for (const name of names) {
      const full = path.join(outDir, name);
      try {
        if (fs.statSync(full).size > 500) {
          if (path.resolve(full) !== path.resolve(deedPath)) {
            fs.renameSync(full, deedPath);
          }
          donePath = deedPath;
          break;
        }
      } catch {
        /* partial write */
      }
    }
    if (donePath) break;
    await page.waitForTimeout(400);
  }

  if (!donePath && download && !(await download.failure())) {
    try {
      const stream = await download.createReadStream();
      const chunks = [];
      await new Promise((resolve, reject) => {
        stream.on('data', (c) => chunks.push(c));
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      const buf = Buffer.concat(chunks);
      if (buf.length > 500) {
        fs.writeFileSync(deedPath, buf);
        donePath = deedPath;
        console.log('Deed PDF saved (stream):', deedPath);
      }
    } catch (e) {
      console.warn('createReadStream:', e.message || e);
    }
  }

  if (!donePath) {
    console.error('Deed: could not capture PDF.');
    return null;
  }

  return deedPath;
}

/**
 * Full pipeline: CAD page → PDF, extract instrument, deed PDF.
 *
 * @param {import('playwright').Page} page
 * @param {{
 *   taxId: string,
 *   addressSlug: string,
 *   outputPath: string,
 *   lot?: string,
 *   skipDeed?: boolean,
 * }} opts
 */
async function downloadCadAndDeed(page, opts) {
  const { taxId, addressSlug, outputPath, lot, skipDeed } = opts;
  await gotoCadParcel(page, { taxId });
  await saveCadPdf(page, { outputPath, addressSlug, lot });

  if (skipDeed) {
    console.log('skipDeed: true — skipping deed download.');
    return { cadDone: true, instrument: null, deedPath: null };
  }

  const instrument = await extractLastSaleInstrument(page);
  if (!instrument) {
    return { cadDone: true, instrument: null, deedPath: null };
  }

  const deedPath = await downloadDeedPdf(page, {
    instrumentNumber: instrument,
    outputPath,
    addressSlug,
  });
  return { cadDone: true, instrument, deedPath };
}

const api = {
  ECAD_PARCEL_BASE,
  TYLER_DEED_SEARCH_URL,
  sanitizeAddressSlug,
  cadParcelUrl,
  gotoCadParcel,
  saveCadPdf,
  extractLastSaleInstrument,
  downloadDeedPdf,
  downloadCadAndDeed,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
Object.assign(globalThis, api);
