#!/usr/bin/env node
/**
 * Batch ECAD CAD + deed downloads via Playwriter.
 *
 * Prereqs: Chrome running, Playwriter extension connected, `playwriter` CLI available.
 *
 * Usage (from repo root):
 *   playwriter session new   # note session id, e.g. 1
 *   node scripts/playwriter/run-batch.mjs scripts/playwriter/listings.json 1
 *   node scripts/playwriter/run-batch.mjs scripts/playwriter/listings.json 1 300000  # custom timeout ms
 *
 * Each listing entry:
 *   { "address": "...", "taxId": "...", "outputPath": "/abs/dir", "lot"?: "", "skip"?: false, "skipDeed"?: false }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');
const flowPath = path.join(__dirname, 'ecad-deed-flow.js');

/** Playwriter sandbox disallows require() of local files; prepend library source. */
function loadLibrarySource() {
  return fs.readFileSync(flowPath, 'utf8');
}

function resolvePlaywriter() {
  try {
    execFileSync('playwriter', ['--version'], { stdio: 'pipe' });
    return 'playwriter';
  } catch {
    return 'npx';
  }
}

const listingsPath = path.resolve(process.argv[2] || path.join(__dirname, 'listings.json'));
const sessionId = process.argv[3] || '1';
/** Deed PDF flow can exceed Playwriter default 10s eval limit */
const evalTimeoutMs = process.argv[4] || '180000';

if (!fs.existsSync(listingsPath)) {
  console.error('Listings file not found:', listingsPath);
  console.error('Usage: node scripts/playwriter/run-batch.mjs <listings.json> [sessionId]');
  process.exit(1);
}

const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));
if (!Array.isArray(listings)) {
  console.error('Listings JSON must be an array.');
  process.exit(1);
}

const listingsLiteral = JSON.stringify(listings);

const inner = `
const listings = ${listingsLiteral};
state.page = context.pages().find((p) => p.url() === 'about:blank') ?? (await context.newPage());
for (const row of listings) {
  if (row.skip) {
    console.log('skip:', row.address || row.taxId);
    continue;
  }
  if (!row.taxId || !row.outputPath) {
    console.warn('skip (missing taxId or outputPath):', row);
    continue;
  }
  const addressSlug = row.address || row.taxId;
  await downloadCadAndDeed(state.page, {
    taxId: row.taxId,
    addressSlug,
    outputPath: row.outputPath,
    lot: row.lot || undefined,
    skipDeed: row.skipDeed === true,
  });
}
console.log('batch done');
`.trim();

const code = `${loadLibrarySource()}\n${inner}`;

const tmp = path.join(__dirname, `_batch-temp-${Date.now()}.js`);
fs.writeFileSync(tmp, code, 'utf8');

const pw = resolvePlaywriter();
try {
  const payload = fs.readFileSync(tmp, 'utf8');
  if (pw === 'playwriter') {
    execFileSync(
      'playwriter',
      ['-s', sessionId, '--timeout', String(evalTimeoutMs), '-e', payload],
      { cwd: repoRoot, stdio: 'inherit' },
    );
  } else {
    execFileSync(
      'npx',
      [
        '--yes',
        'playwriter@latest',
        '-s',
        sessionId,
        '--timeout',
        String(evalTimeoutMs),
        '-e',
        payload,
      ],
      { cwd: repoRoot, stdio: 'inherit' },
    );
  }
} finally {
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}
