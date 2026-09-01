// Tabular counterpart to LevelHistoryChart's line graph — same telemetry
// history series, read as a scrollable log instead of a curve. `bare:
// true` in registry.js because it draws its own card (see
// OperationsSummaryWidget for the same pattern) so the table can flush
// its header/rows edge-to-edge instead of sitting inside WidgetShell's
// padded, centered content box.
function statusFor(level, thresholds) {
  if (level <= thresholds.start) return { label: 'Bajo', tone: 'warning' }
  if (level >= thresholds.stop) return { label: 'Alto', tone: 'critical' }
  return { label: 'Normal', tone: 'good' }
}

const TONES = {
  good: 'bg-status-goodBg text-status-good',
  warning: 'bg-status-warningBg text-status-warning',
  critical: 'bg-status-criticalBg text-status-critical',
}

export default function HistoryTableWidget({ telemetry, config, editMode, onConfigChange }) {
  const eyebrow = config?.eyebrow ?? 'Tanque principal'
  const title = config?.title ?? 'Tabla de históricos'
  // most recent reading first — the operator scanning this table cares
  // about "what just happened", not the oldest sample still in the window
  const rows = [...telemetry.history].slice(-60).reverse()

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div className="min-w-0" onMouseDown={editMode ? (e) => e.stopPropagation() : undefined}>
          {editMode ? (
            <div className="grid gap-1">
              <input
                value={eyebrow}
                onChange={(e) => onConfigChange({ eyebrow: e.target.value })}
                className="w-40 border-0 bg-transparent p-0 text-[9px] font-bold uppercase tracking-[0.18em] text-live-600 outline-none"
                aria-label="Etiqueta"
              />
              <input
                value={title}
                onChange={(e) => onConfigChange({ title: e.target.value })}
                className="w-full border-0 bg-transparent p-0 text-sm font-bold text-navy-900 outline-none"
                aria-label="Título"
              />
            </div>
          ) : (
            <>
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-live-600">{eyebrow}</p>
              <h3 className="truncate text-sm font-bold text-navy-900">{title}</h3>
            </>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-ink-400">{rows.length} lecturas</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="text-[9px] font-bold uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">Nivel</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const status = statusFor(r.level, telemetry.thresholds)
              return (
                <tr key={r.t ?? i} className="border-t border-ink-50">
                  <td className="whitespace-nowrap px-4 py-1.5 font-mono text-ink-500">
                    {new Date(r.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-1.5 font-mono font-bold text-navy-900">
                    {r.level.toFixed(1)}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${TONES[status.tone]}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
