import WidgetShell from './WidgetShell.jsx'
import PumpWidget from './widgets/PumpWidget.jsx'
import TankWidget from './widgets/TankWidget.jsx'
import LevelBarWidget from './widgets/LevelBarWidget.jsx'
import ModeSelectWidget from './widgets/ModeSelectWidget.jsx'
import { IconLayoutBoard } from '../../icons.jsx'

const REGISTRY = {
  pump: { title: 'Bomba', width: 'w-[200px]', Component: PumpWidget, defaultConfig: { pumpId: 'p1' } },
  tank: { title: 'Tanque de nivel', width: 'w-[260px]', Component: TankWidget, defaultConfig: {} },
  levelbar: { title: 'Barra de nivel', width: 'w-[180px]', Component: LevelBarWidget, defaultConfig: {} },
  modeselect: { title: 'Selector Auto/Manual', width: 'w-[220px]', Component: ModeSelectWidget, defaultConfig: { pumpId: 'p1' } },
}

export default function DashboardCanvas({ telemetry, canvas }) {
  const { widgets, editMode, addWidget, removeWidget, updateWidgetConfig, moveWidget } = canvas

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('text/widget-type')
    const def = REGISTRY[type]
    if (def) addWidget(type, def.defaultConfig)
  }

  return (
    <div
      onDragOver={editMode ? (e) => e.preventDefault() : undefined}
      onDrop={editMode ? handleCanvasDrop : undefined}
      className={[
        'flex min-h-0 flex-1 flex-wrap content-start items-start gap-4 overflow-auto rounded-2xl p-4',
        editMode ? 'border-2 border-dashed border-navy-200 bg-navy-50/30' : '',
      ].join(' ')}
    >
      {widgets.length === 0 && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-300">
          <IconLayoutBoard className="h-6 w-6" />
          {editMode ? 'Arrastra un widget de la paleta hacia aquí para empezar' : 'Lienzo vacío — activa "Editar lienzo" para agregar widgets'}
        </div>
      )}

      {widgets.map((w) => {
        const def = REGISTRY[w.type]
        if (!def) return null
        const { Component, title, width } = def
        return (
          <WidgetShell
            key={w.id}
            title={title}
            editMode={editMode}
            widthClass={width}
            draggable={editMode}
            onDragStart={(e) => e.dataTransfer.setData('text/widget-id', w.id)}
            onDragOver={(e) => editMode && e.preventDefault()}
            onDrop={(e) => {
              if (!editMode) return
              e.preventDefault()
              e.stopPropagation()
              const draggedId = e.dataTransfer.getData('text/widget-id')
              if (draggedId) moveWidget(draggedId, w.id)
            }}
            onRemove={() => removeWidget(w.id)}
          >
            <Component
              telemetry={telemetry}
              config={w.config}
              editMode={editMode}
              onConfigChange={(patch) => updateWidgetConfig(w.id, patch)}
            />
          </WidgetShell>
        )
      })}
    </div>
  )
}
