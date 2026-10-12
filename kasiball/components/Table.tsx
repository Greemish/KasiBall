"use client";

import { ReactNode } from "react";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
};

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage,
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) return <LoadingState />;
  if (!data.length) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}