import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({ rows, columns }: { rows: T[]; columns: DataTableColumn<T>[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>{columns.map((column) => <th key={column.header} className="px-4 py-3 font-medium">{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              {columns.map((column) => <td key={column.header} className="px-4 py-3">{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
