/**
 * Comparable sales grid: loads apbotCompGridData + apbotSubjectData from
 * chrome.storage.local and renders the TOTAL-style table.
 */

function parseCSV(str) {
  const arr = [];
  let quote = false;
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    const cc = str[c];
    const nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }
    if (cc == '"') {
      quote = !quote;
      continue;
    }
    if (cc == ',' && !quote) {
      ++col;
      continue;
    }
    if (cc == '\n' && !quote) {
      ++row;
      col = 0;
      continue;
    }
    arr[row][col] += cc;
  }
  return arr.map((r) =>
    r.map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
}

function parseSheet(csvText) {
  const trimmed = (csvText || '').trim();
  if (!trimmed) return null;
  const parsed = parseCSV(trimmed);
  if (parsed.length < 2) return null;
  return {
    headers: parsed[0],
    data: parsed.slice(1),
  };
}

function buildHeaderMap(headers) {
  const m = new Map();
  headers.forEach((h, i) => {
    m.set(String(h).trim().toLowerCase(), i);
  });
  return m;
}

function pickMulti(map, row, names) {
  if (!row || !map) return '';
  for (const n of names) {
    const idx = map.get(n.trim().toLowerCase());
    if (idx !== undefined) return String(row[idx] ?? '').trim();
  }
  return '';
}

function formatThousands(n) {
  return n.toLocaleString('en-US');
}

function formatSalePrice(raw, salesOrFinancing) {
  const t = String(raw || '').trim();
  if (!t) return '';
  const numeric = t.replace(/[$,]/g, '');
  const num = Number.parseFloat(numeric);
  let out;
  if (!Number.isNaN(num) && numeric !== '') {
    out = `$${formatThousands(Math.round(num))}`;
  } else {
    out = t;
  }
  if (salesOrFinancing && /^listing$/i.test(String(salesOrFinancing).trim())) {
    out += ' (List)';
  }
  return out;
}

function formatPxGla(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  if (t.startsWith('$')) return t;
  const n = Number.parseFloat(t.replace(/[$,]/g, ''));
  if (!Number.isNaN(n)) return `$${t.includes('.') ? n.toFixed(2) : formatThousands(Math.round(n))}`;
  return t;
}

function formatRooms(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  const total = t.match(/total\s*(\d+)/i);
  const bdrm = t.match(/bdrms\s*(\d+)/i);
  const bath = t.match(/baths\s*([\d.]+)/i);
  if (total && bdrm && bath) {
    return `${total[1]}/${bdrm[1]}/${bath[1]}`;
  }
  return t;
}

function formatGla(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  const digits = t.replace(/[^\d]/g, '');
  const n = Number.parseInt(digits, 10);
  if (!Number.isNaN(n) && n > 0) return `${formatThousands(n)} sf`;
  return t;
}

function formatSite(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  const m = t.match(/([\d,]+)\s*sf/i);
  if (m) {
    const n = Number.parseInt(m[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(n)) return `${formatThousands(n)} sf`;
  }
  const plain = t.match(/^(\d{3,})$/);
  if (plain) {
    const n = Number.parseInt(plain[1], 10);
    return `${formatThousands(n)} sf`;
  }
  return t;
}

function formatBasementPart(v) {
  const t = String(v ?? '').trim();
  if (!t || t === '0') return '0sf';
  const low = t.toLowerCase();
  if (low.includes('sqft')) return t.replace(/\s*sqft/gi, 'sf').replace(/\s+/g, '');
  if (/^\d+$/.test(t)) return `${t}sf`;
  return t;
}

function formatBasementRow(basement, belowGrade) {
  return `${formatBasementPart(basement)} / ${formatBasementPart(belowGrade)}`;
}

/** @type {{ id: string, label: string, subject: Function, comp: Function }[]} */
const ROW_DEFINITIONS = [
  {
    id: 'addr',
    label: 'Address',
    subject: (row, map) => pickMulti(map, row, ['Property Address']),
    comp: (row, map) => pickMulti(map, row, ['Property Address']),
  },
  {
    id: 'sale_px',
    label: 'Sale Price',
    subject: (row, map) =>
      formatSalePrice(
        pickMulti(map, row, ['Sale Price']),
        pickMulti(map, row, ['Sales or Financing']),
      ),
    comp: (row, map) =>
      formatSalePrice(
        pickMulti(map, row, ['Sale Price']),
        pickMulti(map, row, ['Sales or Financing']),
      ),
  },
  {
    id: 'px_gla',
    label: 'Sale Price / GLA',
    subject: (row, map) =>
      formatPxGla(pickMulti(map, row, ['Sale Price/Gross Liv. Area'])),
    comp: (row, map) =>
      formatPxGla(pickMulti(map, row, ['Sale Price/Gross Liv. Area'])),
  },
  {
    id: 'data_src',
    label: 'Data Source(s)',
    subject: (row, map) =>
      pickMulti(map, row, ['Data Source', 'Data Source(s)']),
    comp: (row, map) =>
      pickMulti(map, row, ['Data Source', 'Data Source(s)']),
  },
  {
    id: 'ver_src',
    label: 'Verification Source',
    subject: (row, map) =>
      pickMulti(map, row, [
        'Verification Source(s)',
        'Verification Source',
      ]),
    comp: (row, map) =>
      pickMulti(map, row, [
        'Verification Source(s)',
        'Verification Source',
      ]),
  },
  {
    id: 'fin_type',
    label: 'Sales or Financing',
    subject: (row, map) =>
      pickMulti(map, row, ['Sales or Financing']),
    comp: (row, map) =>
      pickMulti(map, row, ['Sales or Financing']),
  },
  {
    id: 'concess',
    label: 'Concessions',
    subject: (row, map) => pickMulti(map, row, ['Concessions']),
    comp: (row, map) => pickMulti(map, row, ['Concessions']),
  },
  {
    id: 'sale_date',
    label: 'Date of Sale/Time',
    subject: (row, map) =>
      pickMulti(map, row, ['Date of Sale/Time']),
    comp: (row, map) =>
      pickMulti(map, row, ['Date of Sale/Time']),
  },
  {
    id: 'loc',
    label: 'Location',
    subject: (row, map) => pickMulti(map, row, ['Location']),
    comp: (row, map) => pickMulti(map, row, ['Location']),
  },
  {
    id: 'lease',
    label: 'Leasehold/Fee Simple',
    subject: (row, map) =>
      pickMulti(map, row, ['Leasehold/Fee Simple']),
    comp: (row, map) =>
      pickMulti(map, row, ['Leasehold/Fee Simple']),
  },
  {
    id: 'site',
    label: 'Site',
    subject: (row, map) =>
      formatSite(pickMulti(map, row, ['Site'])),
    comp: (row, map) =>
      formatSite(pickMulti(map, row, ['Site'])),
  },
  {
    id: 'view',
    label: 'View',
    subject: (row, map) => pickMulti(map, row, ['View']),
    comp: (row, map) => pickMulti(map, row, ['View']),
  },
  {
    id: 'design',
    label: 'Design (Style)',
    subject: (row, map) =>
      pickMulti(map, row, ['Design (Style)']),
    comp: (row, map) =>
      pickMulti(map, row, ['Design (Style)']),
  },
  {
    id: 'quality',
    label: 'Quality Construction',
    subject: (row, map) =>
      pickMulti(map, row, ['Quality of Construction']),
    comp: (row, map) =>
      pickMulti(map, row, ['Quality of Construction']),
  },
  {
    id: 'age',
    label: 'Actual Age',
    subject: (row, map) => pickMulti(map, row, ['Actual Age']),
    comp: (row, map) => pickMulti(map, row, ['Actual Age']),
  },
  {
    id: 'cond',
    label: 'Condition',
    subject: (row, map) => pickMulti(map, row, ['Condition']),
    comp: (row, map) => pickMulti(map, row, ['Condition']),
  },
  {
    id: 'rooms',
    label: 'Above Grade Room',
    subject: (row, map) =>
      formatRooms(
        pickMulti(map, row, ['Above Grade Room Count']),
      ),
    comp: (row, map) =>
      formatRooms(
        pickMulti(map, row, ['Above Grade Room Count']),
      ),
  },
  {
    id: 'gla',
    label: 'Gross Living Area',
    subject: (row, map) =>
      formatGla(pickMulti(map, row, ['Gross Living Area'])),
    comp: (row, map) =>
      formatGla(pickMulti(map, row, ['Gross Living Area'])),
  },
  {
    id: 'basement',
    label: 'Basement/Below Gr.',
    subject: (row, map) =>
      formatBasementRow(
        pickMulti(map, row, ['Basement']),
        pickMulti(map, row, ['Finished Rooms Below Grade']),
      ),
    comp: (row, map) =>
      formatBasementRow(
        pickMulti(map, row, ['Basement']),
        pickMulti(map, row, ['Finished Rooms Below Grade']),
      ),
  },
  {
    id: 'func',
    label: 'Functional Utility',
    subject: (row, map) =>
      pickMulti(map, row, ['Functional Utility']),
    comp: (row, map) =>
      pickMulti(map, row, ['Functional Utility']),
  },
  {
    id: 'hvac',
    label: 'Heating / Cooling',
    subject: (row, map) =>
      pickMulti(map, row, ['Heating/Cooling']),
    comp: (row, map) =>
      pickMulti(map, row, ['Heating/Cooling']),
  },
  {
    id: 'energy',
    label: 'Energy Eff. Items',
    subject: (row, map) =>
      pickMulti(map, row, ['Energy Efficient Items']),
    comp: (row, map) =>
      pickMulti(map, row, ['Energy Efficient Items']),
  },
  {
    id: 'parking',
    label: 'Garage / Carport',
    subject: (row, map) =>
      pickMulti(map, row, ['Garage/Carport']),
    comp: (row, map) =>
      pickMulti(map, row, ['Garage/Carport']),
  },
  {
    id: 'porch',
    label: 'Porch / Patio / Deck',
    subject: (row, map) =>
      pickMulti(map, row, ['Porch/Patio/Deck']),
    comp: (row, map) =>
      pickMulti(map, row, ['Porch/Patio/Deck']),
  },
  {
    id: 'fplace',
    label: 'Fireplace',
    subject: (row, map) => pickMulti(map, row, ['Fireplace']),
    comp: (row, map) => pickMulti(map, row, ['Fireplace']),
  },
  {
    id: 'fence',
    label: 'Fence / SprSystem',
    subject: (row, map) => pickMulti(map, row, ['Fence']),
    comp: (row, map) => pickMulti(map, row, ['Fence']),
  },
  {
    id: 'extra',
    label: 'Extra Amenities',
    subject: (row, map) =>
      pickMulti(map, row, ['Extra Amenities']),
    comp: (row, map) =>
      pickMulti(map, row, ['Extra Amenities']),
  },
];

function renderHeadRow(theadRow, numComps) {
  const ths = [
    '<th class="data-cell grid-header sticky-left field-label-col">FEATURE</th>',
    '<th class="data-cell grid-header subject-cell">SUBJECT</th>',
  ];
  for (let i = 0; i < numComps; i += 1) {
    ths.push(
      `<th class="data-cell grid-header">COMPARABLE SALE ${i + 1}</th>`,
    );
  }
  theadRow.innerHTML = ths.join('');
}

function renderBody(tbody, subjectRow, mapS, compRows, mapC) {
  tbody.replaceChildren();
  const subj = subjectRow || [];

  for (const def of ROW_DEFINITIONS) {
    const tr = document.createElement('tr');
    const labelTd = document.createElement('td');
    labelTd.className = 'data-cell sticky-left field-label-col';
    labelTd.textContent = def.label;

    const subjTd = document.createElement('td');
    subjTd.className = 'data-cell subject-cell text-center';
    subjTd.textContent = def.subject(subj, mapS);

    tr.appendChild(labelTd);
    tr.appendChild(subjTd);

    for (const compRow of compRows) {
      const td = document.createElement('td');
      td.className = 'data-cell text-center';
      td.textContent = def.comp(compRow, mapC);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}

function setHeaderCopy(address) {
  const line = document.getElementById('comp-grid-subject-line');
  const h1 = document.getElementById('comp-grid-page-title');
  const addr = (address || '').trim() || '—';
  if (line) line.textContent = `Subject Property: ${addr}`;
  if (h1) h1.textContent = 'Sales Comparison Analysis';
  document.title = `Sales Comparison — ${addr}`;
}

function showEmptyState(msg) {
  const empty = document.getElementById('grid-empty-state');
  const wrap = document.getElementById('grid-table-wrapper');
  if (empty) {
    empty.textContent = msg;
    empty.classList.remove('hidden');
  }
  if (wrap) wrap.classList.add('hidden');
}

function hideEmptyState() {
  const empty = document.getElementById('grid-empty-state');
  const wrap = document.getElementById('grid-table-wrapper');
  if (empty) {
    empty.classList.add('hidden');
    empty.textContent = '';
  }
  if (wrap) wrap.classList.remove('hidden');
}

function initGrid() {
  const theadRow = document.getElementById('grid-head-row');
  const tbody = document.getElementById('grid-content');

  if (!theadRow || !tbody) return;

  chrome.storage.local.get(
    ['apbotCompGridData', 'apbotSubjectData'],
    (result) => {
      const compsSheet = parseSheet(result.apbotCompGridData);
      const subjectSheet = parseSheet(result.apbotSubjectData);

      const addr =
        subjectSheet?.data?.[0] &&
        subjectSheet.headers
          ? pickMulti(
              buildHeaderMap(subjectSheet.headers),
              subjectSheet.data[0],
              ['Property Address'],
            )
          : '';

      setHeaderCopy(addr);

      if (!compsSheet || !compsSheet.data.length) {
        showEmptyState(
          'No comparable data in storage. Paste or load comps CSV in the side panel, then Save Data.',
        );
        theadRow.innerHTML = '';
        tbody.replaceChildren();
        return;
      }

      hideEmptyState();

      const mapC = buildHeaderMap(compsSheet.headers);
      const compRows = compsSheet.data;
      const mapS = subjectSheet
        ? buildHeaderMap(subjectSheet.headers)
        : new Map();
      const subjectRow = subjectSheet?.data?.[0] || [];

      renderHeadRow(theadRow, compRows.length);
      renderBody(tbody, subjectRow, mapS, compRows, mapC);
    },
  );
}

document.addEventListener('DOMContentLoaded', initGrid);
