'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiDownload, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import * as XLSX from 'xlsx';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  searchPlaceholder?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  customActions,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  searchPlaceholder = 'Buscar...',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.key];
        if (value === null || value === undefined) return false;

        // Convertir a string y buscar
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Manejar valores nulos
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Comparar
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Función para manejar el ordenamiento
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Función para exportar a Excel XLSX
  const handleExport = () => {
    if (sortedData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel
    const dataToExport = sortedData.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        let value = item[col.key];

        // Manejar valores especiales
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'boolean') {
          value = value ? 'Sí' : 'No';
        } else if (typeof value === 'object') {
          // Si es fecha, formatear
          if (value instanceof Date) {
            value = value.toLocaleDateString('es-CO');
          } else {
            value = JSON.stringify(value);
          }
        } else if (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value))) {
          // Si parece una fecha ISO, formatearla
          value = new Date(value).toLocaleDateString('es-CO');
        } else {
          value = String(value);
        }

        row[col.label] = value;
      });
      return row;
    });

    // Crear workbook y worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Ajustar ancho de columnas
    const columnWidths = columns.map((col) => ({
      wch: Math.max(col.label.length + 2, 15),
    }));
    worksheet['!cols'] = columnWidths;

    // Generar archivo XLSX
    const timestamp = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const filename = `exportacion_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon && <div className="mx-auto h-12 w-12 text-gray-400">{emptyIcon}</div>}
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y exportar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 border text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
        >
          <FiDownload className="mr-2 h-4 w-4" />
          Exportar a Excel
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-50 select-none' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable !== false && (
                      <span className="inline-flex flex-col">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <FiChevronUp className="h-4 w-4" />
                          ) : (
                            <FiChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <span className="text-gray-300">
                            <FiChevronUp className="h-3 w-3 -mb-1" />
                            <FiChevronDown className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || customActions) && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete || customActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No se encontraron resultados para &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || customActions) && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium space-x-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                      {customActions && customActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Información de resultados */}
      <div className="text-sm text-gray-500">
        Mostrando {sortedData.length} de {data.length} registros
        {searchTerm && ` (filtrado por "${searchTerm}")`}
      </div>
    </div>
  );
}
