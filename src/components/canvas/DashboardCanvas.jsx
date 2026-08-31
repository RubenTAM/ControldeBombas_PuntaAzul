import { useRef } from 'react'
import WidgetShell from './WidgetShell.jsx'
import { WIDGET_REGISTRY } from './registry.js'
import { IconLayoutBoard } from '../../icons.jsx'

const GRID = 20
const CANVAS_W = 1800
const CANVAS_H = 1400

export default function DashboardCanvas({ telemetry, canvas }) {
  const { widgets, editMode, addWidgetAt, removeWidget, updateWidgetConfig, updateTransform, bringToFront } = canvas
  const canvasRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('text/widget-type')
    const def = WIDGET_REGISTRY[type]
    if (!def || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const rawX = e.clientX - rect.left + canvasRef.current.scrollLeft - def.defaultSize.w / 2
    const rawY = e.clientY - rect.top + canvasRef.current.scrollTop - def.defaultSize.h / 2
    const x = Math.round(rawX / GRID) * GRID
    const y = Math.round(rawY / GRID) * GRID
    addWidgetAt(type, x, y, def.defaultSize, def.defaultConfig)
  }

  return (
    <div
      ref={canvasRef}
      onDragOver={editMode ? (e) => e.preventDefault() : undefined}
      onDrop={editMode ? handleDrop : undefined}
      className={['relative min-h-0 flex-1 overflow-auto rounded-2xl', editMode ? 'bg-navy-50/30' : 'bg-white'].join(' ')}
      style={
        editMode
          ? { backgroundImage: 'radial-gradient(circle, #c7ccdb 1px, transparent 1px)', backgroundSize: `${GRID}px ${GRID}px` }
          : undefined
      }
    >
      <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-ink-300">
            <IconLayoutBoard className="h-6 w-6" />
            {editMode ? 'Arrastra un widget de la paleta hacia aquí para empezar' : 'Lienzo vacío — activa "Editar lienzo" para agregar widgets'}
          </div>
        )}

        {widgets.map((w) => {
          const def = WIDGET_REGISTRY[w.type]
          if (!def) return null
          const { Component, label, minW, minH, resizeAxis, rotatable } = def
          return (
            <WidgetShell
              key={w.id}
              title={label}
              editMode={editMode}
              x={w.x}
              y={w.y}
              w={w.w}
              h={w.h}
              rotation={w.rotation}
              minW={minW}
              minH={minH}
              resizeAxis={resizeAxis}
              rotatable={rotatable}
              onTransform={(patch) => updateTransform(w.id, patch)}
              onFront={() => bringToFront(w.id)}
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
    </div>
  )
}
