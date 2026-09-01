export default function DividerWidget({ config, editMode, onConfigChange }) {
  const label = config.label ?? 'SECCIÓN'
  return (
    <div className="flex h-full w-full items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-navy-200 to-navy-300" />
      {editMode ? (
        <input
          value={label}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onConfigChange({ label: e.target.value })}
          className="w-28 rounded-full border border-navy-100 bg-white px-3 py-1 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-navy-500 outline-none focus:border-live-400"
          aria-label="Etiqueta del divisor"
        />
      ) : (
        <span className="rounded-full border border-navy-100 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-navy-500 shadow-sm">
          {label}
        </span>
      )}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-navy-200 to-navy-300" />
    </div>
  )
}
