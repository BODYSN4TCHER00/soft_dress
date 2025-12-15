import type { ReactNode } from 'react';
import '../../styles/DataTable.css';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  rowClassName?: (row: T) => string;
}

const DataTable = <T,>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  className = '',
  rowClassName
}: DataTableProps<T>) => {
  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  style={{ 
                    width: column.width,
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = keyExtractor(row);
                const customRowClass = rowClassName ? rowClassName(row) : '';
                const rowClass = `data-table-row ${customRowClass} ${onRowClick ? 'clickable' : ''}`.trim();

                return (
                  <tr
                    key={rowKey}
                    className={rowClass}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => {
                      const value = (row as any)[column.key];
                      return (
                        <td 
                          key={column.key}
                          style={{ textAlign: column.align || 'left' }}
                        >
                          {column.render 
                            ? column.render(value, row, index)
                            : value ?? 'N/A'
                          }
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

