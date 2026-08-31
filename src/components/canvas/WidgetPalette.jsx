import { IconPump, IconTank, IconBars, IconToggle } from '../../icons.jsx'

export const WIDGET_CATALOG = [
  { type: 'pump', label: 'Bomba', icon: IconPump },
  { type: 'tank', label: 'Tanque de nivel', icon: IconTank },
  { type: 'levelbar', label: 'Barra de nivel', icon: IconBars },
  { type: 'modeselect', label: 'Selector Auto/Manual', icon: IconToggle },
]

// Palette of draggable widget "chips". Dropping one on the canvas (handled
// in DashboardCanvas) adds an instance. This is the seed catalog — more
// widget types (válvulas, caudalímetros, alarmas, etc.) get added here.
export default function WidgetPalette() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-dashed border-navy-200 bg-navy-50/40 p-3">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-navy-400">Widgets</span>
      {WIDGET_CATALOG.map((w) => {
        const Icon = w.icon
        return (
          <div
            key={w.type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/widget-type', w.type)}
            className="flex cursor-grab items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-600 shadow-sm active:cursor-grabbing"
          >
            <Icon className="h-4 w-4 text-navy-500" />
            {w.label}
          </div>
        )
      })}
    </div>
  )
}
