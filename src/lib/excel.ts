import * as XLSX from 'xlsx';
import type { RawRow } from '@/lib/gst/normalize';

export const ACCEPTED_UPLOAD_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const ACCEPTED_UPLOAD_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Parse an uploaded spreadsheet buffer into an array of row objects keyed by
 * their header names. Uses the first worksheet. Throws a friendly error on
 * unreadable files.
 */
export function parseWorkbookBuffer(buffer: ArrayBuffer | Buffer): RawRow[] {
  let workbook: XLSX.WorkBook;
  try {
    const data = buffer instanceof Buffer ? buffer : new Uint8Array(buffer);
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    throw new Error('Could not read the file. Please upload a valid CSV or Excel file.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The file has no worksheets.');
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: true,
  });
  return rows;
}

/** Build an .xlsx workbook (as a Buffer) from array-of-objects data. */
export function buildXlsx(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
): Buffer {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return out as Buffer;
}

/** Build a CSV string from array-of-objects data. */
export function buildCsv(rows: Record<string, unknown>[]): string {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  return XLSX.utils.sheet_to_csv(ws);
}
