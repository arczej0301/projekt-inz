// src/utils/excelExport.js
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToExcel = (data, fileName = 'raport_gospodarstwa') => {
  // data to obiekt w stylu: { Finanse: [...], Magazyn: [...], Pola: [...] }
  
  const wb = XLSX.utils.book_new();

  // Iterujemy przez klucze (kategorie) i tworzymy dla nich arkusze
  Object.keys(data).forEach((category) => {
    const sheetData = data[category];
    
    if (sheetData && sheetData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, category);
    }
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
};