import * as XLSX from 'xlsx';
import type { SpreadsheetTableSchema, SpreadsheetRow, SpreadsheetColumn, CellValue } from '@/stores/spreadsheetStore';

/**
 * Generate unique ID for imported rows/columns
 */
function uid(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format cell value based on column type for export
 */
function formatCellValue(value: CellValue, type: string): any {
  if (value === null || value === undefined || value === '') return '';
  
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'date':
      // Date values are stored as ISO strings
      if (typeof value === 'string' && value.includes('T')) {
        return value.split('T')[0];
      }
      return value;
    default:
      return String(value);
  }
}

/**
 * Auto-detect column type from data
 */
function detectColumnType(values: any[]): SpreadsheetColumn['type'] {
  // If all values are numbers
  const allNumbers = values.every(v => {
    if (v === null || v === undefined || v === '') return true;
    return !isNaN(Number(v));
  });
  if (allNumbers && values.some(v => v !== null && v !== undefined && v !== '')) {
    return 'number';
  }

  // If all values are dates
  const allDates = values.every(v => {
    if (v === null || v === undefined || v === '') return true;
    return !isNaN(Date.parse(v));
  });
  if (allDates && values.some(v => v !== null && v !== undefined && v !== '')) {
    return 'date';
  }

  return 'text';
}

/**
 * Export spreadsheet to Excel file
 */
export const exportToExcel = (
  table: SpreadsheetTableSchema,
  rows: SpreadsheetRow[],
  monthKey: string
): void => {
  try {
    // Prepare data for Excel
    const wsData = rows.map(row => {
      const obj: Record<string, any> = {};
      table.columns.forEach(col => {
        const value = row.cells[col.id];
        obj[col.title] = formatCellValue(value, col.type);
      });
      return obj;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Set column widths (min 12, max 50)
    const colWidths = table.columns.map(col => ({
      wch: Math.min(Math.max(String(col.title).length + 2, 12), 50)
    }));
    ws['!cols'] = colWidths;

    // Add bold header style (optional enhancement)
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      if (wsData.length > 0) {
        for (let col = 0; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E0E0E0' } }
          };
        }
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthKey);

    // Generate filename
    const safeTitle = table.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeTitle}_${monthKey}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

/**
 * Export to CSV
 */
export const exportToCSV = (
  table: SpreadsheetTableSchema,
  rows: SpreadsheetRow[],
  monthKey: string
): void => {
  try {
    // Prepare data
    const wsData = rows.map(row => {
      const obj: Record<string, any> = {};
      table.columns.forEach(col => {
        const value = row.cells[col.id];
        obj[col.title] = formatCellValue(value, col.type);
      });
      return obj;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthKey);

    // Generate CSV
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const safeTitle = table.title.replace(/[^a-zA-Z0-9]/g, '_');
    a.href = url;
    a.download = `${safeTitle}_${monthKey}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export to CSV');
  }
};

/**
 * Import from Excel file
 */
export const importFromExcel = async (
  file: File
): Promise<{ columns: SpreadsheetColumn[]; rows: SpreadsheetRow[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array (first element is array of arrays)
        // Use defval to preserve empty cells and raw to avoid implicit type coercion by xlsx
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
        
        if (jsonData.length === 0) {
          reject(new Error('File is empty'));
          return;
        }

        // First row = headers (preserve blanks)
        let headers = (jsonData[0] as any[]).map(h => (h === undefined || h === null ? '' : String(h)));
        if (!headers || headers.length === 0) {
          reject(new Error('No headers found in file'));
          return;
        }

        // Determine max columns across all rows to avoid truncation
        const dataRowsRaw = jsonData.slice(1) as any[][];
        const maxColumns = Math.max(headers.length, ...dataRowsRaw.map(r => r.length));

        // Normalize headers: fill empty names and pad to maxColumns
        headers = Array.from({ length: maxColumns }, (_, i) => {
          const name = headers[i] ?? '';
          return String(name).trim() || `Column ${i + 1}`;
        });

        // Extract and pad data rows to maxColumns
        const dataRows = dataRowsRaw.map(r => {
          const row = Array.from({ length: maxColumns }, (_, i) => (r[i] === undefined ? '' : r[i]));
          return row;
        });
        
        // Detect column types from data
        const columnTypes: SpreadsheetColumn['type'][] = headers.map((_, colIndex) => {
          const columnData = dataRows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
          return detectColumnType(columnData);
        });

        // Create columns
        const columns: SpreadsheetColumn[] = headers.map((title, idx) => ({
          id: uid('col'),
          title: String(title || `Column ${idx + 1}`).trim(),
          type: columnTypes[idx] || 'text',
        }));

        // Create rows
        const rows: SpreadsheetRow[] = dataRows.map((row: any[], rowIndex: number) => ({
          id: uid('row'),
          orderIndex: rowIndex,
          cells: headers.reduce((acc, _, idx) => {
            const rawVal = row[idx];
            const type = columns[idx].type;
            let value: CellValue = rawVal;
            if (type === 'number') {
              const n = Number(rawVal);
              value = Number.isFinite(n) ? n : '';
            } else if (type === 'date') {
              if (typeof rawVal === 'string') {
                // Normalize to YYYY-MM-DD when possible
                const d = new Date(rawVal);
                if (!isNaN(d.getTime())) {
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  value = `${yyyy}-${mm}-${dd}`;
                } else {
                  value = rawVal;
                }
              } else {
                value = rawVal ?? '';
              }
            } else {
              value = (rawVal === null || rawVal === undefined) ? '' : String(rawVal);
            }
            acc[columns[idx].id] = value;
            return acc;
          }, {} as Record<string, CellValue>),
        }));

        resolve({ columns, rows });
      } catch (error) {
        console.error('Error importing from Excel:', error);
        reject(new Error('Failed to import file. Please check the file format.'));
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Import from CSV file
 */
export const importFromCSV = async (
  file: File
): Promise<{ columns: SpreadsheetColumn[]; rows: SpreadsheetRow[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Read CSV
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('File is empty'));
          return;
        }

        // First row = headers
        const headers = jsonData[0] as string[];
        if (!headers || headers.length === 0) {
          reject(new Error('No headers found in CSV'));
          return;
        }

        // Extract data rows
        const dataRows = jsonData.slice(1) as any[][];
        
        // Detect column types
        const columnTypes: SpreadsheetColumn['type'][] = headers.map((_, colIndex) => {
          const columnData = dataRows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
          return detectColumnType(columnData);
        });

        // Create columns
        const columns: SpreadsheetColumn[] = headers.map((title, idx) => ({
          id: uid('col'),
          title: String(title || `Column ${idx + 1}`).trim(),
          type: columnTypes[idx] || 'text',
        }));

        // Create rows
        const rows: SpreadsheetRow[] = dataRows.map((row: any[], rowIndex: number) => ({
          id: uid('row'),
          orderIndex: rowIndex,
          cells: headers.reduce((acc, _, idx) => {
            acc[columns[idx].id] = row[idx] || '';
            return acc;
          }, {} as Record<string, CellValue>),
        }));

        resolve({ columns, rows });
      } catch (error) {
        console.error('Error importing from CSV:', error);
        reject(new Error('Failed to import CSV file. Please check the file format.'));
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

