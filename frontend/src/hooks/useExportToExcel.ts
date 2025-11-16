import { useCallback } from 'react';
import * as XLSX from 'xlsx';

export function useExportToExcel() {
  const exportToExcel = useCallback((data: any[], filename: string, sheetName: string = 'Sheet1') => {
    // Crear un nuevo workbook
    const wb = XLSX.utils.book_new();
    
    // Convertir los datos a una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generar el archivo Excel
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, []);

  return { exportToExcel };
}
