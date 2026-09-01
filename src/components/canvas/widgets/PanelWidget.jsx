// Blank panel — WidgetShell already draws the white rounded card (its own
// header/resize chrome now lives entirely in WidgetShell's exported
// WidgetReachHandle, an always-on-top overlay used for every widget, not
// just this one — see that file's comment), so it exists purely as free
// space the operator can group other widgets on top of, e.g. as a backdrop
// strip down one side of the dashboard.
//
// Two small extras on top of that blank canvas: an optional title (typed
// inline, same pattern as SectionHeaderWidget's inputs), and, until the
// panel has been used at least once, a one-click "fill this panel"
// shortcut — `onQuickFill` (wired up in DashboardCanvas) drops a ready-made
// Bomba 1 / Bomba 2 auto-manual pair, nivel-alto/nivel-bajo setpoints, and
// a historical-readings table, all sized and positioned to fit inside
// THIS panel's own bounds, so building that particular grouping doesn't
// mean dragging five separate pieces from the palette by hand.
export default function PanelWidget({ config, editMode, onConfigChange, onQuickFill }) {
  const title = config?.title ?? ''
  const filled = config?.filled ?? false

  if (!editMode && !title) return null

  return (
    <div className="absolute inset-3 flex flex-col items-start gap-2">
      {editMode ? (
        <input
          value={title}
          onChange={(e) => onConfigChange({ title: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Título del panel (opcional)"
          className="w-full max-w-[85%] border-0 bg-transparent p-0 text-xs font-bold uppercase tracking-[0.14em] text-navy-400 outline-none placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-navy-300"
        />
      ) : (
        title && <p className="w-full max-w-[85%] truncate text-xs font-bold uppercase tracking-[0.14em] text-navy-400">{title}</p>
      )}

      {editMode && !filled && onQuickFill && (
        <button
          onClick={onQuickFill}
          onMouseDown={(e) => e.stopPropagation()}
          title="Agrega automáticamente Auto/Manual de Bomba 1 y 2, setpoints de nivel alto/bajo y una tabla de históricos, acomodados dentro de este panel"
          className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-navy-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-navy-500 hover:border-navy-400 hover:bg-navy-50 hover:text-navy-600"
        >
          + Plantilla de control (bombas, setpoints, histórico)
        </button>
      )}
    </div>
  )
}
