export default function SectionHeaderWidget({ config, editMode, onConfigChange }) {
  const eyebrow = config.eyebrow ?? 'OPERACIÓN'
  const title = config.title ?? 'Vista general del sistema'
  const subtitle = config.subtitle ?? 'Estado hidráulico y equipos en tiempo real'

  return (
    <div className="relative flex h-full w-full items-center overflow-hidden rounded-2xl border border-navy-100 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 px-5 shadow-card">
      <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full border border-white/10 bg-live-400/10" />
      <div className="absolute right-12 top-2 h-16 w-16 rounded-full border border-white/5" />
      <div className="relative min-w-0 border-l-4 border-live-400 pl-4">
        {editMode ? (
          <div className="grid gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
            <input
              value={eyebrow}
              onChange={(e) => onConfigChange({ eyebrow: e.target.value })}
              className="w-40 border-0 bg-transparent p-0 text-[9px] font-bold uppercase tracking-[0.2em] text-live-300 outline-none"
              aria-label="Etiqueta de sección"
            />
            <input
              value={title}
              onChange={(e) => onConfigChange({ title: e.target.value })}
              className="w-full border-0 bg-transparent p-0 text-lg font-bold text-white outline-none"
              aria-label="Título de sección"
            />
            <input
              value={subtitle}
              onChange={(e) => onConfigChange({ subtitle: e.target.value })}
              className="w-full border-0 bg-transparent p-0 text-xs text-navy-200 outline-none"
              aria-label="Subtítulo de sección"
            />
          </div>
        ) : (
          <>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-live-300">{eyebrow}</p>
            <h2 className="truncate text-lg font-bold text-white">{title}</h2>
            <p className="truncate text-xs text-navy-200">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  )
}
