import { CONTROL_ROWS } from '@/lib/content/glowbound';

/** Compact in-arena hint so mobile players discover drag controls immediately. */
export function GameControls() {
  return (
    <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-[0.68rem] font-medium uppercase tracking-[0.18em] text-slate-400/90">
      <span className="rounded-full bg-void-950/50 px-3 py-1 backdrop-blur">Drag or use arrow keys</span>
    </p>
  );
}

/** Full control legend used on informational pages. */
export function ControlLegend() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">GlowBound controls and keyboard shortcuts</caption>
        <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Input</th>
            <th scope="col" className="px-4 py-3 font-semibold">Action</th>
            <th scope="col" className="px-4 py-3 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {CONTROL_ROWS.map((row) => (
            <tr key={row.input} className="align-top">
              <th scope="row" className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-electric-300">
                {row.input}
              </th>
              <td className="px-4 py-3 text-white">{row.action}</td>
              <td className="px-4 py-3 text-slate-400">{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
