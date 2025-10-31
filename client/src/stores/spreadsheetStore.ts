import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '@/stores/authStore';
import {
  ensureSpreadsheet as fsEnsureSpreadsheet,
  createTable as fsCreateTable,
  renameTable as fsRenameTable,
  updateTableColumns as fsUpdateTableColumns,
  ensureMonth as fsEnsureMonth,
  addRow as fsAddRow,
  setRows as fsSetRows,
  updateCell as fsUpdateCell,
  subscribeRows as fsSubscribeRows,
  deleteRow as fsDeleteRow,
  deleteTableDeep as fsDeleteTableDeep,
  incrementNumericTotal as fsIncrementNumericTotal,
  subscribeMonthMeta as fsSubscribeMonthMeta,
  setMonthTotals as fsSetMonthTotals,
} from '@/services/spreadsheetService';

type ColumnType = 'text' | 'number' | 'date' | 'select';

export interface SpreadsheetColumn {
  id: string;
  title: string;
  type: ColumnType;
  options?: string[]; // for select type
  width?: number;
  format?: string; // optional display format, e.g., number: currency|decimal|percent, date: yyyy-MM-dd|dd/MM/yyyy
}

export interface SpreadsheetTableSchema {
  id: string;
  title: string;
  columns: SpreadsheetColumn[];
  createdAt: string; // ISO string for persistence simplicity
  updatedAt: string;
}

export type CellValue = string | number | string; // date stored as ISO string

export interface SpreadsheetRow {
  id: string;
  // Stable ordering index within a month. Optional for backward compatibility.
  orderIndex?: number;
  cells: Record<string, CellValue>; // key: columnId
}

export interface SpreadsheetState {
  tables: SpreadsheetTableSchema[];
  // dataByMonth[tableId][YYYY-MM] => rows
  dataByMonth: Record<string, Record<string, SpreadsheetRow[]>>;
  activeMonthByTable: Record<string, string>; // per table selected month
  editModeByTable: Record<string, boolean>; // per table edit/view mode
  isLoading: boolean;
  error: string | null;
  rowListeners?: Record<string, () => void>; // non-persisted: key = `${tableId}__${monthKey}`
  monthMetaByTable?: Record<string, Record<string, { rowCount: number; numericTotals?: Record<string, number> }>>; // tableId -> monthKey -> meta
}

export interface SpreadsheetActions {
  createTable: (args: { title: string; columns: Omit<SpreadsheetColumn, 'id'>[]; initialRows?: number; month?: string }) => string;
  renameTable: (tableId: string, title: string) => void;
  deleteTable: (tableId: string) => void;
  deleteTableDeep: (tableId: string, onProgress?: (summary: { rowsDeleted: number; monthsDeleted: number; }) => void) => Promise<void>;
  addColumn: (tableId: string, column: Omit<SpreadsheetColumn, 'id'>) => string;
  addColumnAt: (tableId: string, column: Omit<SpreadsheetColumn, 'id'>, index: number) => string;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Omit<SpreadsheetColumn, 'id'>>) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  addRow: (tableId: string, monthKey?: string) => string;
  addRowAt: (tableId: string, index: number, monthKey?: string) => string;
  deleteRow: (tableId: string, rowId: string, monthKey?: string) => void;
  updateCell: (tableId: string, rowId: string, columnId: string, value: CellValue, monthKey?: string) => void;
  setActiveMonth: (tableId: string, monthKey: string) => void;
  getRows: (tableId: string, monthKey?: string) => SpreadsheetRow[];
  getTotals: (tableId: string, monthKey?: string) => Record<string, number>; // columnId => sum
  setRows: (tableId: string, monthKey: string, rows: SpreadsheetRow[]) => void;
  setColumns: (tableId: string, columns: SpreadsheetColumn[]) => void;
  setEditMode: (tableId: string, isEdit: boolean) => void;
  getEditMode: (tableId: string) => boolean;
  subscribeRowsRealtime: (tableId: string, monthKey: string, pageSize?: number) => void;
  unsubscribeRowsRealtime: (tableId: string, monthKey: string) => void;
  startMigration: () => Promise<{ tables: number; months: number; rows: number }>;
}

function uid(prefix: string = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function currentMonthKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

export const useSpreadsheetStore = create<SpreadsheetState & SpreadsheetActions>()(
  persist(
    (set, get) => ({
      tables: [],
      dataByMonth: {},
      activeMonthByTable: {},
      editModeByTable: {},
      isLoading: false,
      error: null,
      rowListeners: {},
      monthMetaByTable: {},

      createTable: ({ title, columns, initialRows = 0, month }) => {
        const id = uid('tbl');
        const nowIso = new Date().toISOString();
        const schemaCols: SpreadsheetColumn[] = columns.map(c => ({ ...c, id: uid('col') }));
        const table: SpreadsheetTableSchema = {
          id,
          title,
          columns: schemaCols,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const monthKey = month || currentMonthKey();
        const rows: SpreadsheetRow[] = Array.from({ length: initialRows }, (_, i) => ({ id: uid('row'), orderIndex: i, cells: {} }));
        set(state => ({
          tables: [table, ...state.tables],
          dataByMonth: { ...state.dataByMonth, [id]: { ...(state.dataByMonth[id] || {}), [monthKey]: rows } },
          activeMonthByTable: { ...state.activeMonthByTable, [id]: monthKey },
          editModeByTable: { ...state.editModeByTable, [id]: false },
        }));
        // Firestore side-effect (fire-and-forget)
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsEnsureSpreadsheet(ownerId).then(() => fsCreateTable(ownerId, table)).catch(console.warn);
          fsEnsureMonth(ownerId, id, monthKey).catch(console.warn);
          if (rows.length > 0) {
            fsSetRows(ownerId, id, monthKey, rows).catch(console.warn);
          }
        }
        return id;
      },

      renameTable: (tableId, title) => {
        set(state => ({
          tables: state.tables.map(t => t.id === tableId ? { ...t, title, updatedAt: new Date().toISOString() } : t),
        }));
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) fsRenameTable(ownerId, tableId, title).catch(console.warn);
      },

      deleteTable: (tableId) => {
        set(state => {
          const { [tableId]: _, ...rest } = state.dataByMonth;
          const { [tableId]: __, ...restMonth } = state.activeMonthByTable;
          return {
            tables: state.tables.filter(t => t.id !== tableId),
            dataByMonth: rest,
            activeMonthByTable: restMonth,
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) fsDeleteTableDeep(ownerId, tableId).catch(console.warn);
      },

      deleteTableDeep: async (tableId, onProgress) => {
        // Optimistic remove from local state first
        set(state => {
          const { [tableId]: _, ...rest } = state.dataByMonth;
          const { [tableId]: __, ...restMonth } = state.activeMonthByTable;
          return {
            tables: state.tables.filter(t => t.id !== tableId),
            dataByMonth: rest,
            activeMonthByTable: restMonth,
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (!ownerId) return;
        await fsDeleteTableDeep(ownerId, tableId, onProgress);
      },

      addColumn: (tableId, column) => {
        const newCol: SpreadsheetColumn = { ...column, id: uid('col') };
        set(state => ({
          tables: state.tables.map(t => t.id === tableId ? { ...t, columns: [...t.columns, newCol], updatedAt: new Date().toISOString() } : t),
        }));
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          const table = get().tables.find(t => t.id === tableId);
          if (table) fsUpdateTableColumns(ownerId, tableId, [...table.columns, newCol]).catch(console.warn);
        }
        return newCol.id;
      },

      addColumnAt: (tableId, column, index) => {
        const newCol: SpreadsheetColumn = { ...column, id: uid('col') };
        set(state => ({
          tables: state.tables.map(t => {
            if (t.id !== tableId) return t;
            const cols = [...t.columns];
            const insertAt = Math.max(0, Math.min(index, cols.length));
            cols.splice(insertAt, 0, newCol);
            return { ...t, columns: cols, updatedAt: new Date().toISOString() };
          }),
        }));
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          const table = get().tables.find(t => t.id === tableId);
          if (table) {
            const cols = [...table.columns];
            const insertAt = Math.max(0, Math.min(index, cols.length));
            cols.splice(insertAt, 0, newCol);
            fsUpdateTableColumns(ownerId, tableId, cols).catch(console.warn);
          }
        }
        return newCol.id;
      },

      updateColumn: (tableId, columnId, updates) => {
        const state = get();
        const table = state.tables.find(t => t.id === tableId);
        const prevCol = table?.columns.find(c => c.id === columnId);
        const nextType = updates.type ?? prevCol?.type;

        // Update schema first
        set(curr => ({
          tables: curr.tables.map(t => t.id === tableId ? {
            ...t,
            columns: t.columns.map(c => c.id === columnId ? { ...c, ...updates, type: nextType as any } : c),
            updatedAt: new Date().toISOString(),
          } : t),
        }));

        // If type changes, coerce existing cell values across all months
        if (prevCol && updates.type && updates.type !== prevCol.type) {
          const coerce = (val: CellValue): CellValue => {
            if (val === '' || val === undefined || val === null) return '' as any;
            switch (updates.type) {
              case 'text': {
                return String(val);
              }
              case 'number': {
                const n = typeof val === 'number' ? val : Number(String(val).replace(/\s/g, ''));
                return Number.isFinite(n) ? n : ('' as any);
              }
              case 'date': {
                // Accept YYYY-MM-DD, locale strings, timestamps
                if (typeof val === 'number') {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                  }
                  return '' as any;
                }
                const s = String(val).trim();
                // If already yyyy-mm-dd keep
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s as any;
                const d = new Date(s);
                if (!isNaN(d.getTime())) {
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return `${yyyy}-${mm}-${dd}`;
                }
                return '' as any;
              }
              case 'select': {
                // Keep as string; non-string coerce to string
                const s = String(val);
                return s as any;
              }
              default:
                return val;
            }
          };

          set(curr => {
            const tableMonths = curr.dataByMonth[tableId] || {};
            const updatedMonths: Record<string, SpreadsheetRow[]> = {};
            Object.entries(tableMonths).forEach(([mk, rows]) => {
              updatedMonths[mk] = rows.map(r => {
                if (!(columnId in r.cells)) return r;
                return { ...r, cells: { ...r.cells, [columnId]: coerce(r.cells[columnId]) } };
              });
            });
            return { dataByMonth: { ...curr.dataByMonth, [tableId]: updatedMonths } };
          });
        }
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          const updatedTable = get().tables.find(t => t.id === tableId);
          if (updatedTable) fsUpdateTableColumns(ownerId, tableId, updatedTable.columns).catch(console.warn);
          const mk = get().activeMonthByTable[tableId] || currentMonthKey();
          const rows = get().getRows(tableId, mk);
          if (rows.length) {
            const totals: Record<string, number> = {};
            updatedTable?.columns.forEach(col => {
              if (col.type !== 'number') return;
              totals[col.id] = rows.reduce((sum, r) => {
                const v = r.cells[col.id];
                const n = typeof v === 'number' ? v : Number(v);
                return sum + (Number.isFinite(n) ? n : 0);
              }, 0);
            });
            fsSetMonthTotals(ownerId, tableId, mk, totals).catch(console.warn);
          }
        }
      },

      deleteColumn: (tableId, columnId) => {
        set(state => {
          const updatedTables = state.tables.map(t => t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== columnId), updatedAt: new Date().toISOString() } : t);
          const tableMonths = state.dataByMonth[tableId] || {};
          const updatedMonths: Record<string, SpreadsheetRow[]> = {};
          Object.entries(tableMonths).forEach(([mk, rows]) => {
            updatedMonths[mk] = rows.map(r => {
              const { [columnId]: _, ...restCells } = r.cells;
              return { ...r, cells: restCells };
            });
          });
          return {
            tables: updatedTables,
            dataByMonth: { ...state.dataByMonth, [tableId]: updatedMonths },
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          const table = get().tables.find(t => t.id === tableId);
          if (table) fsUpdateTableColumns(ownerId, tableId, table.columns.filter(c => c.id !== columnId)).catch(console.warn);
        }
      },

      addRow: (tableId, monthKey) => {
        const mk = monthKey || get().activeMonthByTable[tableId] || currentMonthKey();
        const id = uid('row');
        set(state => {
          const tableData = state.dataByMonth[tableId] || {};
          const rows = tableData[mk] || [];
          return {
            dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [mk]: [...rows, { id, orderIndex: rows.length, cells: {} }] } },
            activeMonthByTable: { ...state.activeMonthByTable, [tableId]: mk },
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsEnsureMonth(ownerId, tableId, mk).catch(console.warn);
          fsAddRow(ownerId, tableId, mk, { id, orderIndex: (get().dataByMonth[tableId]?.[mk]?.length ?? 1) - 1, cells: {} } as any).catch(console.warn);
        }
        return id;
      },

      addRowAt: (tableId, index, monthKey) => {
        const mk = monthKey || get().activeMonthByTable[tableId] || currentMonthKey();
        const id = uid('row');
        set(state => {
          const tableData = state.dataByMonth[tableId] || {};
          const rows = tableData[mk] || [];
          const insertAt = Math.max(0, Math.min(index, rows.length));
          const newRows = [...rows];
          // Insert with orderIndex and shift following indices
          newRows.splice(insertAt, 0, { id, orderIndex: insertAt, cells: {} });
          for (let i = insertAt + 1; i < newRows.length; i++) {
            newRows[i] = { ...newRows[i], orderIndex: i };
          }
          return {
            dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [mk]: newRows } },
            activeMonthByTable: { ...state.activeMonthByTable, [tableId]: mk },
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsEnsureMonth(ownerId, tableId, mk).catch(console.warn);
          fsAddRow(ownerId, tableId, mk, { id, orderIndex: Math.max(0, Math.min(index, (get().dataByMonth[tableId]?.[mk]?.length ?? 1) - 1)), cells: {} } as any).catch(console.warn);
        }
        return id;
      },

      deleteRow: (tableId, rowId, monthKey) => {
        const mk = monthKey || get().activeMonthByTable[tableId] || currentMonthKey();
        let rowToDelete: SpreadsheetRow | undefined;
        let tableSnapshot: SpreadsheetTableSchema | undefined;
        set(state => {
          const tableData = state.dataByMonth[tableId] || {};
          const rows = tableData[mk] || [];
          rowToDelete = rows.find(r => r.id === rowId);
          const next = rows.filter(r => r.id !== rowId);
          tableSnapshot = state.tables.find(t => t.id === tableId);
          return {
            dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [mk]: next } },
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsDeleteRow(ownerId, tableId, mk, rowId).catch(console.warn);
          if (rowToDelete && tableSnapshot) {
            tableSnapshot.columns.forEach(col => {
              if (col.type !== 'number') return;
              const v = rowToDelete?.cells[col.id];
              const n = typeof v === 'number' ? v : Number(v);
              if (Number.isFinite(n) && n !== 0) {
                fsIncrementNumericTotal(ownerId, tableId, mk, col.id, -n).catch(console.warn);
              }
            });
          }
        }
      },

      updateCell: (tableId, rowId, columnId, value, monthKey) => {
        const mk = monthKey || get().activeMonthByTable[tableId] || currentMonthKey();
        let prevValue: CellValue | undefined;
        let isNumberCol = false;
        set(state => {
          const tableData = state.dataByMonth[tableId] || {};
          const rows = tableData[mk] || [];
          const table = state.tables.find(t => t.id === tableId);
          const col = table?.columns.find(c => c.id === columnId);
          isNumberCol = col?.type === 'number';
          const updated = rows.map(r => {
            if (r.id !== rowId) return r;
            prevValue = r.cells[columnId];
            return { ...r, cells: { ...r.cells, [columnId]: value } };
          });
          return {
            dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [mk]: updated } },
          };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsUpdateCell(ownerId, tableId, mk, rowId, columnId, value as any).catch(console.warn);
          if (isNumberCol) {
            const toNum = (v: any) => (typeof v === 'number' ? v : Number(v));
            const prevNum = Number.isFinite(toNum(prevValue)) ? toNum(prevValue) : 0;
            const nextNum = Number.isFinite(toNum(value)) ? toNum(value) : 0;
            const delta = nextNum - prevNum;
            if (delta !== 0) fsIncrementNumericTotal(ownerId, tableId, mk, columnId, delta).catch(console.warn);
          }
        }
      },

      setActiveMonth: (tableId, monthKey) => {
        set(state => ({ activeMonthByTable: { ...state.activeMonthByTable, [tableId]: monthKey } }));
        // ensure partition exists
        const tableMonths = get().dataByMonth[tableId] || {};
        if (!tableMonths[monthKey]) {
          set(state => ({ dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableMonths, [monthKey]: [] } } }));
        }
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) fsEnsureMonth(ownerId, tableId, monthKey).catch(console.warn);
        // switch realtime listener to the new month
        get().unsubscribeRowsRealtime(tableId, monthKey);
        get().subscribeRowsRealtime(tableId, monthKey, 200);
        // subscribe to month meta (rowCount, numericTotals)
        if (ownerId) {
          // subscribe new meta listener
          const key = `${tableId}__meta__${monthKey}`;
          const existing = get().rowListeners?.[key];
          if (existing) existing();
          const unsub = fsSubscribeMonthMeta(ownerId, tableId, monthKey, (meta) => {
            set(state => ({
              monthMetaByTable: {
                ...(state.monthMetaByTable || {}),
                [tableId]: {
                  ...(state.monthMetaByTable?.[tableId] || {}),
                  [monthKey]: meta,
                },
              },
            }));
          });
          set(state => ({ rowListeners: { ...(state.rowListeners || {}), [key]: unsub } }));
        }
      },

      getRows: (tableId, monthKey) => {
        const mk = monthKey || get().activeMonthByTable[tableId] || currentMonthKey();
        const tableMonths = get().dataByMonth[tableId] || {};
        return tableMonths[mk] || [];
      },

      getTotals: (tableId, monthKey) => {
        const table = get().tables.find(t => t.id === tableId);
        if (!table) return {};
        const meta = get().monthMetaByTable?.[tableId]?.[monthKey || get().activeMonthByTable[tableId] || currentMonthKey()];
        if (meta && meta.numericTotals) {
          return meta.numericTotals;
        }
        const rows = get().getRows(tableId, monthKey);
        const totals: Record<string, number> = {};
        table.columns.forEach(col => {
          if (col.type === 'number') {
            totals[col.id] = rows.reduce((sum, r) => {
              const v = r.cells[col.id];
              const n = typeof v === 'number' ? v : Number(v);
              return sum + (Number.isFinite(n) ? n : 0);
            }, 0);
          }
        });
        return totals;
      },

      setRows: (tableId, monthKey, rows) => {
        set(state => {
          const tableData = state.dataByMonth[tableId] || {};
          return { dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [monthKey]: rows } } };
        });
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) {
          fsSetRows(ownerId, tableId, monthKey, rows).catch(console.warn);
          // recompute totals and persist to month meta
          const table = get().tables.find(t => t.id === tableId);
          if (table) {
            const totals: Record<string, number> = {};
            table.columns.forEach(col => {
              if (col.type !== 'number') return;
              totals[col.id] = rows.reduce((sum, r) => {
                const v = r.cells[col.id];
                const n = typeof v === 'number' ? v : Number(v);
                return sum + (Number.isFinite(n) ? n : 0);
              }, 0);
            });
            fsSetMonthTotals(ownerId, tableId, monthKey, totals).catch(console.warn);
          }
        }
      },

      setColumns: (tableId, columns) => {
        set(state => ({
          tables: state.tables.map(t => t.id === tableId ? { ...t, columns, updatedAt: new Date().toISOString() } : t),
        }));
        const ownerId = useAuthStore.getState().user?.uid;
        if (ownerId) fsUpdateTableColumns(ownerId, tableId, columns).catch(console.warn);
      },

      setEditMode: (tableId, isEdit) => {
        set(state => ({ editModeByTable: { ...state.editModeByTable, [tableId]: isEdit } }));
      },

      getEditMode: (tableId) => {
        return get().editModeByTable[tableId] ?? false;
      },

      subscribeRowsRealtime: (tableId, monthKey, pageSize = 200) => {
        const ownerId = useAuthStore.getState().user?.uid;
        if (!ownerId) return;
        const key = `${tableId}__${monthKey}`;
        // clean existing
        const existing = get().rowListeners?.[key];
        if (existing) existing();
        const unsub = fsSubscribeRows(ownerId, tableId, monthKey, pageSize, (rows: SpreadsheetRow[]) => {
          set(state => {
            const tableData = state.dataByMonth[tableId] || {};
            return { dataByMonth: { ...state.dataByMonth, [tableId]: { ...tableData, [monthKey]: rows } } };
          });
        });
        set(state => ({ rowListeners: { ...(state.rowListeners || {}), [key]: unsub } }));
      },

      unsubscribeRowsRealtime: (tableId, monthKey) => {
        const key = `${tableId}__${monthKey}`;
        const unsub = get().rowListeners?.[key];
        if (unsub) {
          unsub();
          const next = { ...(get().rowListeners || {}) };
          delete next[key];
          set({ rowListeners: next });
        }
      },

      startMigration: async () => {
        try {
          set({ isLoading: true, error: null });
          const { migrateLocalToFirestore } = await import('@/services/spreadsheetMigration');
          const res = await migrateLocalToFirestore();
          set({ isLoading: false });
          return res;
        } catch (e: any) {
          set({ isLoading: false, error: e?.message || 'Migration failed' });
          throw e;
        }
      },
    }),
    {
      name: 'spreadsheets-storage',
      partialize: (state) => ({ tables: state.tables, dataByMonth: state.dataByMonth, activeMonthByTable: state.activeMonthByTable, editModeByTable: state.editModeByTable }),
    }
  )
);


