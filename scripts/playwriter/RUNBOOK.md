# Playwriter: ECAD CAD + Ector deed downloads

Automates **Ector CAD** parcel capture and **Ector County Tyler** deed PDF download using [Playwriter](https://github.com/remorses/playwriter) against your existing Chrome (MLS login, Appraisal Bot link injection, cookies).

## Prerequisites

1. Google Chrome with the **Playwriter** extension installed and toggled on for the tab you automate (see Playwriter docs if you see “extension is not connected”).
2. Optional: **Appraisal Bot** extension for MLS → Tax ID links; you can also skip MLS entirely by passing `taxId` (Option B in the plan).
3. CLI: `playwriter` on PATH, or the batch script will use `npx playwriter@latest`.
4. **Execution timeout**: deed + CAD exceeds Playwriter’s default **10s** eval limit. Pass `--timeout 180000` (or more) to `playwriter -e`, or use `run-batch.mjs` (defaults to 180s).
5. **Sandbox paths**: Playwriter’s VM only allows writes under the session working directory (usually repo root when you `cd appraisal-bot`), **`/tmp`**, and `os.tmpdir()`. Use an `outputPath` under those trees.

## Files

| File | Purpose |
|------|---------|
| [ecad-deed-flow.js](./ecad-deed-flow.js) | Reusable functions: `gotoCadParcel`, `saveCadPdf`, `extractLastSaleInstrument`, `downloadDeedPdf`, `downloadCadAndDeed` |
| [listings.example.json](./listings.example.json) | Example batch input |
| [run-batch.mjs](./run-batch.mjs) | Node driver: prepends library source (Playwriter forbids `require()` of local files) and runs one `-e` block |
| [listings.json](./listings.json) | Gitignored local batch file (optional); copy from example |

## Playwriter: no local `require()`

The Playwriter sandbox raises `ModuleNotAllowedError` for `require('./ecad-deed-flow.js')`. **Inline the file** before your steps:

```bash
CODE="$(cat scripts/playwriter/ecad-deed-flow.js)
# …your code using downloadCadAndDeed, etc."
playwriter -s 1 --timeout 180000 -e "$CODE"
```

`run-batch.mjs` does this automatically.

## DOM selectors and fallbacks

### ECAD parcel (`search.ectorcad.org`)

| Step | Primary selector | Fallback |
|------|------------------|----------|
| **Last Sale Instrument** | `tr` filtered by `hasText: /Last Sale Instrument/i`, then first `a` in row | Same row: first `td`/`th` whose text matches `/[\d-]{4,}/` and is not the label |
| **Instrument text** | Link `innerText` (e.g. `2022-00020060`) | Whole-row text with regex `(\d{4}-\d{8,}\|[\d.-]+)` |

If ECAD changes layout (e.g. no `<table>`), capture `snapshot({ page })` after load and adjust `extractLastSaleInstrument` in `ecad-deed-flow.js`.

### Tyler deed search (`ectorcountytx-web.tylerhost.net`)

| Step | Selector | Notes |
|------|----------|--------|
| Disclaimer | `document.cookie = 'disclaimerAccepted=true; path=/web'` after first navigation | Playwriter extension mode: `context.addCookies()` often fails; `document.cookie` matches Stagehand intent |
| Document number field | `#field_DocumentNumberID` | |
| Search | `#searchButton` | |
| Results header | `.selfServiceSearchResultHeaderLeft` | Wait up to 15s |
| Result row | `.selfServiceSearchResultList li` with `hasText` instrument | |
| Open record | Click first matching `li` | |
| Navigation / View | `.selfServiceSearchFullResult.selfServiceSearchResultNavigation` | |
| **PDF bytes (primary)** | `PDFViewerApplication.pdfDocument.getData()` inside the viewer frame | Avoids unreliable download artifacts / missing `application/pdf` on the main frame |
| **Fallback** | `#download` in PDF.js frame + `waitForEvent('download')` + stream / disk poll | |

Optional: set `PLAYWRITER_ECDAD_USE_CDP_DOWNLOAD=1` **when running under normal Node** (not Playwriter `-e`) to experiment with `Browser.setDownloadBehavior`; it is off by default because it can suppress Playwright’s download event.

If Tyler changes CSS classes, use Playwriter `snapshot()` on the search and result pages and update selectors here and in `ecad-deed-flow.js`.

### New tab behavior

If the CAD site opens the deed portal in a **new tab**, reuse `context.pages()` and assign `state.page` to the page whose URL contains `tylerhost` before calling `downloadDeedPdf`. The current module assumes **same-tab** navigation from CAD to Tyler via `page.goto` in `downloadDeedPdf`.

## One-property dry run (CLI)

From **repository root** (`appraisal-bot`):

```bash
playwriter session new
# assume session id is 1
```

Single listing (replace `taxId`, path, and address). **Inline** the library — do not `require()` it:

```bash
CODE="$(cat scripts/playwriter/ecad-deed-flow.js)

state.page = context.pages().find((p) => p.url() === 'about:blank') ?? (await context.newPage());
await downloadCadAndDeed(state.page, {
  taxId: '10930.00140.00000',
  addressSlug: '15031 S Windmill Ave Odessa',
  outputPath: '/tmp/my-job-output',
});
console.log('done');
"
playwriter -s 1 --timeout 180000 -e "$CODE"
```

Functions are registered on `globalThis` by `ecad-deed-flow.js` so you can call `downloadCadAndDeed` directly.

Use an `outputPath` under repo root or `/tmp` (sandbox). Filenames use safe ASCII (no spaces):

- `{address-slug}-cad.pdf`
- `{address-slug}-deed--{instrument}.pdf`

## Batch

1. Copy `listings.example.json` → `listings.json` and set real `taxId`, `address`, `outputPath` per row.
2. `playwriter session new` (or reuse session).
3. From repo root:

```bash
node scripts/playwriter/run-batch.mjs ./scripts/playwriter/listings.json 1
```

Optional fourth argument: eval timeout ms (default `180000`):

```bash
node scripts/playwriter/run-batch.mjs ./scripts/playwriter/listings.json 1 300000
```

## npm script

```bash
npm run playwriter:ecad-batch -- ./scripts/playwriter/listings.json 1
```

## Midland (MCAD) / other counties

This runbook is **Ector-only**. For Midland CAD, use a different parcel URL pattern and a different deed portal when you extend `ecad-deed-flow.js` or add `mcad-deed-flow.js`.
