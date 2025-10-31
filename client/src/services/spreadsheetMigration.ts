import { useAuthStore } from '@/stores/authStore';
import type { SpreadsheetTableSchema, SpreadsheetRow } from '@/stores/spreadsheetStore';
import { ensureSpreadsheet, createTable, ensureMonth, setRows } from '@/services/spreadsheetService';

/**
 * One-time migration from LocalStorage (zustand persist) to Firestore
 * Returns summary of migrated items
 */
export async function migrateLocalToFirestore(): Promise<{ tables: number; months: number; rows: number }> {
  if (typeof window === 'undefined') return { tables: 0, months: 0, rows: 0 };
  const ownerId = useAuthStore.getState().user?.uid;
  if (!ownerId) throw new Error('Must be logged in to migrate');

  const raw = window.localStorage.getItem('spreadsheets-storage');
  if (!raw) return { tables: 0, months: 0, rows: 0 };

  const parsed = JSON.parse(raw);
  const tables: SpreadsheetTableSchema[] = parsed.state?.tables || [];
  const dataByMonth: Record<string, Record<string, SpreadsheetRow[]>> = parsed.state?.dataByMonth || {};

  await ensureSpreadsheet(ownerId);

  let tablesCount = 0;
  let monthsCount = 0;
  let rowsCount = 0;

  for (const table of tables) {
    await createTable(ownerId, table);
    tablesCount++;
    const months = dataByMonth[table.id] || {};
    for (const monthKey of Object.keys(months)) {
      await ensureMonth(ownerId, table.id, monthKey);
      monthsCount++;
      const rows = months[monthKey] || [];
      if (rows.length) {
        await setRows(ownerId, table.id, monthKey, rows);
        rowsCount += rows.length;
      }
    }
  }

  // Clear legacy local storage after successful migration
  try {
    window.localStorage.removeItem('spreadsheets-storage');
  } catch {}

  return { tables: tablesCount, months: monthsCount, rows: rowsCount };
}


