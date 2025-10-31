import { db } from '@/firebase/config';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  serverTimestamp,
  increment,
  writeBatch,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';

export type ColumnType = 'text' | 'number' | 'date' | 'select';

export interface SpreadsheetColumn {
  id: string;
  title: string;
  type: ColumnType;
  options?: string[];
  width?: number;
  format?: string;
}

export interface SpreadsheetTableSchema {
  id: string;
  title: string;
  columns: SpreadsheetColumn[];
  createdAt: string;
  updatedAt: string;
}

export type CellValue = string | number | string;

export interface SpreadsheetRow {
  id: string;
  orderIndex?: number;
  cells: Record<string, CellValue>;
}

// Path helpers
function spreadsheetDocIdForUser(ownerId: string) {
  // Use owner UID as spreadsheet id for a single-spreadsheet-per-user model
  return ownerId;
}

function spreadsheetDoc(ownerId: string) {
  return doc(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId));
}

function tableDoc(ownerId: string, tableId: string) {
  return doc(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId), 'tables', tableId);
}

// function tablesCol(ownerId: string) {
//   return collection(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId), 'tables');
// }

function monthDoc(ownerId: string, tableId: string, monthKey: string) {
  return doc(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId), 'tables', tableId, 'months', monthKey);
}

function rowsCol(ownerId: string, tableId: string, monthKey: string) {
  return collection(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId), 'tables', tableId, 'months', monthKey, 'rows');
}

// Ensure spreadsheet root exists
export async function ensureSpreadsheet(ownerId: string): Promise<void> {
  const spRef = spreadsheetDoc(ownerId);
  const snap = await getDoc(spRef);
  if (!snap.exists()) {
    await setDoc(spRef, {
      ownerId,
      title: 'My Spreadsheet',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function createTable(ownerId: string, table: SpreadsheetTableSchema): Promise<void> {
  await ensureSpreadsheet(ownerId);
  await setDoc(tableDoc(ownerId, table.id), {
    id: table.id,
    title: table.title,
    columns: table.columns,
    rowCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ownerId,
  });
}

export async function renameTable(ownerId: string, tableId: string, title: string): Promise<void> {
  await updateDoc(tableDoc(ownerId, tableId), {
    title,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTableColumns(ownerId: string, tableId: string, columns: SpreadsheetColumn[]): Promise<void> {
  await updateDoc(tableDoc(ownerId, tableId), {
    columns,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTable(ownerId: string, tableId: string): Promise<void> {
  // Note: for simplicity we delete only the table doc; cascading delete of months/rows should be handled via backend or admin/tools.
  await updateDoc(tableDoc(ownerId, tableId), {
    // Soft-delete strategy could be used; here we rely on UI removing it and future cleanup
    deletedAt: serverTimestamp(),
  });
}

export async function ensureMonth(ownerId: string, tableId: string, monthKey: string): Promise<void> {
  const mRef = monthDoc(ownerId, tableId, monthKey);
  const snap = await getDoc(mRef);
  if (!snap.exists()) {
    await setDoc(mRef, {
      monthKey,
      rowCount: 0,
      numericTotals: {},
      updatedAt: serverTimestamp(),
    });
  }
}

export async function addRow(ownerId: string, tableId: string, monthKey: string, row: SpreadsheetRow): Promise<void> {
  await ensureMonth(ownerId, tableId, monthKey);
  const batch = writeBatch(db);
  const mRef = monthDoc(ownerId, tableId, monthKey);
  const rCol = rowsCol(ownerId, tableId, monthKey);
  const rRef = doc(rCol, row.id);
  batch.set(rRef, {
    id: row.id,
    orderIndex: typeof row.orderIndex === 'number' ? row.orderIndex : 0,
    cells: row.cells,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(mRef, { rowCount: increment(1), updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function setRows(ownerId: string, tableId: string, monthKey: string, rows: SpreadsheetRow[]): Promise<void> {
  await ensureMonth(ownerId, tableId, monthKey);
  const batch = writeBatch(db);
  const mRef = monthDoc(ownerId, tableId, monthKey);
  const rCol = rowsCol(ownerId, tableId, monthKey);
  rows.forEach((r, i) => {
    const rRef = doc(rCol, r.id);
    batch.set(rRef, {
      id: r.id,
      orderIndex: typeof r.orderIndex === 'number' ? r.orderIndex : i,
      cells: r.cells,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  batch.update(mRef, { rowCount: rows.length, updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function updateCell(ownerId: string, tableId: string, monthKey: string, rowId: string, columnId: string, value: CellValue): Promise<void> {
  const rRef = doc(rowsCol(ownerId, tableId, monthKey), rowId);
  await updateDoc(rRef, {
    [`cells.${columnId}`]: value,
    updatedAt: serverTimestamp(),
  } as any);
}

export async function deleteRow(ownerId: string, tableId: string, monthKey: string, rowId: string): Promise<void> {
  const batch = writeBatch(db);
  const mRef = monthDoc(ownerId, tableId, monthKey);
  const rRef = doc(rowsCol(ownerId, tableId, monthKey), rowId);
  batch.delete(rRef);
  batch.update(mRef, { rowCount: increment(-1), updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function incrementNumericTotal(ownerId: string, tableId: string, monthKey: string, columnId: string, delta: number): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) return;
  const mRef = monthDoc(ownerId, tableId, monthKey);
  await updateDoc(mRef, {
    [`numericTotals.${columnId}`]: increment(delta),
    updatedAt: serverTimestamp(),
  } as any);
}

// Reserved helper for future use when we need generic collection deletions
// async function deleteQueryBatch(q: Query, progress?: (n: number) => void) {
//   const snap = await getDocs(q);
//   if (snap.empty) return;
//   const batch = writeBatch(db);
//   snap.docs.forEach(d => batch.delete(d.ref));
//   await batch.commit();
//   if (progress) progress(snap.size);
// }

export async function deleteTableDeep(ownerId: string, tableId: string, onProgress?: (summary: { rowsDeleted: number; monthsDeleted: number; }) => void): Promise<void> {
  let rowsDeleted = 0;
  let monthsDeleted = 0;
  // Delete all rows in all months in batches
  const monthsRef = collection(db, 'spreadsheets', spreadsheetDocIdForUser(ownerId), 'tables', tableId, 'months');
  const monthsSnap = await getDocs(monthsRef);
  for (const m of monthsSnap.docs) {
    const monthKey = m.id;
    const rCol = rowsCol(ownerId, tableId, monthKey);
    // Batch delete rows until empty
    // Use loop with limit to avoid fetching too many
    // We order by updatedAt desc for index reuse
    while (true) {
      const q = query(rCol, orderBy('updatedAt', 'desc'), limit(500));
      const snap = await getDocs(q);
      if (snap.empty) break;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      rowsDeleted += snap.size;
      if (onProgress) onProgress({ rowsDeleted, monthsDeleted });
    }
    // Delete month doc itself
    const batch = writeBatch(db);
    batch.delete(m.ref);
    await batch.commit();
    monthsDeleted += 1;
    if (onProgress) onProgress({ rowsDeleted, monthsDeleted });
  }
  // Finally delete the table doc
  const tRef = tableDoc(ownerId, tableId);
  const batch = writeBatch(db);
  batch.delete(tRef);
  await batch.commit();
}

export function subscribeTable(ownerId: string, tableId: string, cb: (schema: any) => void) {
  const tRef = tableDoc(ownerId, tableId);
  return onSnapshot(tRef, (snap) => {
    if (snap.exists()) cb(snap.data());
  });
}

export function subscribeRows(ownerId: string, tableId: string, monthKey: string, pageSize: number, cb: (rows: SpreadsheetRow[], cursor?: DocumentSnapshot) => void) {
  const base = rowsCol(ownerId, tableId, monthKey);
  const q = query(base, orderBy('orderIndex', 'asc'), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const rows: SpreadsheetRow[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      rows.push({ id: d.id, orderIndex: data.orderIndex, cells: data.cells || {} });
    });
    const last = snap.docs[snap.docs.length - 1];
    cb(rows, last);
  });
}

export async function fetchRows(ownerId: string, tableId: string, monthKey: string, pageSize: number, after?: DocumentSnapshot): Promise<{ rows: SpreadsheetRow[]; cursor?: DocumentSnapshot }> {
  const base = rowsCol(ownerId, tableId, monthKey);
  let q = query(base, orderBy('orderIndex', 'asc'), limit(pageSize));
  if (after) q = query(base, orderBy('orderIndex', 'asc'), startAfter(after), limit(pageSize));
  const snap = await getDocs(q);
  const rows: SpreadsheetRow[] = [];
  snap.forEach(d => {
    const data = d.data() as any;
    rows.push({ id: d.id, orderIndex: data.orderIndex, cells: data.cells || {} });
  });
  const last = snap.docs[snap.docs.length - 1];
  return { rows, cursor: last };
}

export function subscribeMonthMeta(ownerId: string, tableId: string, monthKey: string, cb: (meta: { rowCount: number; numericTotals?: Record<string, number> }) => void) {
  const mRef = monthDoc(ownerId, tableId, monthKey);
  return onSnapshot(mRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as any;
    cb({ rowCount: data.rowCount || 0, numericTotals: data.numericTotals || {} });
  });
}

export async function setMonthTotals(ownerId: string, tableId: string, monthKey: string, totals: Record<string, number>): Promise<void> {
  const mRef = monthDoc(ownerId, tableId, monthKey);
  await updateDoc(mRef, {
    numericTotals: totals,
    updatedAt: serverTimestamp(),
  } as any);
}


