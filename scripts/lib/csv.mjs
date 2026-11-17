/**
 * CSV (RFC 4180) as Excel and Search Console write it: UTF-8 with or without a BOM, comma or tab separated,
 * quoted cells with line breaks inside. Shared by scripts/migrate.mjs and scripts/monthly-report.mjs.
 */

/** Rows of cells; empty rows are dropped. */
export function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split('\n')[0];
  const sep = !first.includes(',') && first.includes('\t') ? '\t' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) row.push(cell), (cell = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** One cell for writing, quoted when it has to be. */
export const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** ۱۲۳ and ١٢٣ → 123 */
export const toLatinDigits = (s) =>
  String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
