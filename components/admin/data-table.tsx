import Link from "next/link";

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

/** Minimal, reusable admin list table — used identically across brands/categories/services/showcase. */
export function DataTable<T extends { id: string }>({
  rows, columns, editHref,
}: { rows: T[]; columns: Column<T>[]; editHref: (row: T) => string }) {
  if (!rows.length) {
    return <p className="font-body text-[13.5px] text-wc-textMute mt-6">Nothing here yet.</p>;
  }
  return (
    <table className="w-full mt-6 border-collapse">
      <thead>
        <tr className="border-b border-wc-line">
          {columns.map((c) => (
            <th key={c.header} className="text-left font-mono text-[11px] text-wc-textMute font-normal py-2 pr-4">{c.header}</th>
          ))}
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-wc-line/60 hover:bg-wc-panelAlt">
            {columns.map((c) => (
              <td key={c.header} className="py-3 pr-4 font-body text-[13.5px] text-wc-text">{c.render(row)}</td>
            ))}
            <td className="py-3">
              <Link href={editHref(row)} className="font-body text-[13px] text-wc-cyan no-underline">Edit</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
