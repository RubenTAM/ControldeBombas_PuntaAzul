import { WIDGET_CATALOG } from './registry.js'
import { IconPencil } from '../../icons.jsx'

// Palette of draggable widget "chips". Dropping one on the canvas (handled
// in DashboardCanvas) adds an instance at the exact drop point. This is the
// seed catalog — more widget types (válvulas, caudalímetros, alarmas, etc.)
// get added in registry.js.
//
// The "Dibujar tubería" tool lives here too, in the Tubería group right
// next to the pipe chips it's an alternative to — it used to float over
// the canvas itself, which put it away from every other "make a pipe"
// control and over whatever was already drawn there.
export default function WidgetPalette({ canvas }) {
  const { drawMode, toggleDrawMode, pendingPieces, acceptSketch, cancelSketch } = canvas
  const groups = ['Proceso', 'Tubería', 'Información', 'Estructura']
  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 p-3 xl:grid-cols-2">
      {groups.map((group) => (
        <div key={group} className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-navy-400">{group}</span>
          {WIDGET_CATALOG.filter((w) => w.group === group).map((w) => {
            const Icon = w.icon
            return (
              <div
                key={w.type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/widget-type', w.type)}
                className="flex cursor-grab items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-600 shadow-sm transition-colors hover:border-navy-200 hover:bg-navy-50 active:cursor-grabbing"
              >
                <Icon className="h-4 w-4 text-navy-500" />
                {w.label}
              </div>
            )
          })}

          {group === 'Tubería' &&
            (!pendingPieces ? (
              <button
                onClick={toggleDrawMode}
                title="Dibuja con el mouse por donde quieres que pase la tubería; al soltar el clic te muestra el resultado para aceptar o cancelar. Si el inicio del trazo queda cerca de un puerto abierto, la tubería nace pegada a él, del mismo diámetro."
                className={[
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold shadow-sm ring-1 transition-colors',
                  drawMode
                    ? 'bg-navy-600 text-white ring-navy-600'
                    : 'border-ink-100 bg-white text-navy-500 ring-ink-100 hover:bg-navy-50',
                ].join(' ')}
              >
                <IconPencil className="h-4 w-4" />
                {drawMode ? 'Dibujando… suelta para ver el resultado' : 'Dibujar tubería'}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 shadow-sm ring-1 ring-ink-100">
                <span className="px-1 text-xs font-semibold text-ink-400">
                  {pendingPieces.length} pieza{pendingPieces.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={acceptSketch}
                  className="rounded-md bg-navy-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-navy-700"
                >
                  Aceptar
                </button>
                <button
                  onClick={cancelSketch}
                  className="rounded-md px-2.5 py-1.5 text-xs font-bold text-ink-400 hover:bg-navy-50"
                >
                  Cancelar
                </button>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
