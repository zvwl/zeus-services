import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AdminColumn {
  /** Column heading. Empty string = unlabeled actions column. */
  header: string;
  align?: "left" | "right";
}

export interface AdminRow {
  key: string;
  /** One cell per column, in column order. */
  cells: ReactNode[];
}

/**
 * Admin list view: a classic table on md+ screens that collapses into stacked
 * glass cards on mobile (per DESIGN.md — never horizontal-scroll a wide table).
 * Server-component friendly: cells are plain ReactNodes.
 */
export function AdminTable({
  columns,
  rows,
  empty,
  minWidth = 640,
}: {
  columns: AdminColumn[];
  rows: AdminRow[];
  empty: ReactNode;
  /** Min table width in px before the desktop container scrolls. */
  minWidth?: number;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="glass hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn("px-4 py-3 font-medium", c.align === "right" && "text-right")}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((r) => (
              <tr key={r.key} className="transition hover:bg-raised/40">
                {r.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-4 py-3",
                      columns[i]?.align === "right" && "text-right"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <div key={r.key} className="glass space-y-2.5 p-4">
            {r.cells.map((cell, i) => {
              if (cell === null || cell === undefined || cell === "") return null;
              const header = columns[i]?.header;
              return header ? (
                <div key={i} className="flex items-start justify-between gap-4">
                  <span className="shrink-0 pt-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    {header}
                  </span>
                  <div className="min-w-0 text-right text-sm text-zinc-300">{cell}</div>
                </div>
              ) : (
                // Unlabeled actions column → footer row of the card.
                <div key={i} className="flex justify-end gap-1.5 border-t border-edge pt-2.5">
                  {cell}
                </div>
              );
            })}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="glass px-6 py-12 text-center text-sm text-zinc-500">{empty}</div>
        )}
      </div>
    </>
  );
}
