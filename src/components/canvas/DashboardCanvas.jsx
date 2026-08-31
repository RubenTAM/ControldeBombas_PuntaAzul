import { useMemo, useRef, useState } from 'react'
import WidgetShell from './WidgetShell.jsx'
import { WIDGET_REGISTRY } from './registry.js'
import { getPortWorld, placeAttached } from './ports.js'
import { IconLayoutBoard, IconPipeStraight, IconPipeElbow, IconPipeTee } from '../../icons.jsx'

const GRID = 20
const CANVAS_W = 1800
const CANVAS_H = 1400
const CONNECT_THRESHOLD = 14 // px — a port closer than this to another is "connected"

// The 3 piece types offered from every open port's "+" menu.
const ATTACH_CHOICES = [
  { type: 'pipe-straight', label: 'Recta', icon: IconPipeStraight },
  { type: 'pipe-elbow', label: 'Codo 90°', icon: IconPipeElbow },
  { type: 'pipe-tee', label: 'Te', icon: IconPipeTee },
]

export default function DashboardCanvas({ telemetry, canvas }) {
  const { widgets, editMode, addWidgetAt, removeWidget, updateWidgetConfig, updateTransform, bringToFront } = canvas
  const canvasRef = useRef(null)
  const [openPicker, setOpenPicker] = useState(null) // { widgetId, portIndex, port }

  // every port on every placed widget, in canvas coordinates, plus whether
  // another widget's port already sits right on top of it (= "connected")
  const ports = useMemo(() => {
    const all = []
    widgets.forEach((w) => {
      const def = WIDGET_REGISTRY[w.type]
      def?.ports?.forEach((p, i) => all.push({ widgetId: w.id, portIndex: i, ...getPortWorld(w, p), portDef: p }))
    })
    return all.map((p) => ({
      ...p,
      open: !all.some(
        (o) =>
          o.widgetId !== p.widgetId &&
          Math.hypot(o.x - p.x, o.y - p.y) < CONNECT_THRESHOLD,
      ),
    }))
  }, [widgets])

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
    setOpenPicker(null)
  }

  const handleAttach = (port, type) => {
    const def = WIDGET_REGISTRY[type]
    const transform = placeAttached(port, def.defaultSize, def.ports[0])
    addWidgetAt(type, transform.x, transform.y, { w: transform.w, h: transform.h }, def.defaultConfig, transform.rotation)
    setOpenPicker(null)
  }

  return (
    <div
      ref={canvasRef}
      onDragOver={editMode ? (e) => e.preventDefault() : undefined}
      onDrop={editMode ? handleDrop : undefined}
      onMouseDown={() => setOpenPicker(null)}
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
          const { Component, label, minW, minH, resizeAxis, rotatable, bare } = def
          return (
            <WidgetShell
              key={w.id}
              title={label}
              editMode={editMode}
              bare={bare}
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

        {editMode &&
          ports
            .filter((p) => p.open)
            .map((p) => {
              const key = `${p.widgetId}:${p.portIndex}`
              const isOpenHere = openPicker?.widgetId === p.widgetId && openPicker?.portIndex === p.portIndex
              return (
                <div key={key} style={{ position: 'absolute', left: p.x, top: p.y }}>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenPicker(isOpenHere ? null : { widgetId: p.widgetId, portIndex: p.portIndex, port: p })
                    }}
                    className={[
                      'flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-1 transition-colors',
                      isOpenHere
                        ? 'bg-navy-600 text-white ring-navy-600'
                        : 'bg-white text-navy-500 ring-navy-300 hover:bg-navy-50',
                    ].join(' ')}
                  >
                    +
                  </button>

                  {isOpenHere && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1 rounded-xl border border-ink-100 bg-white p-1.5 shadow-pop"
                    >
                      {ATTACH_CHOICES.map((choice) => {
                        const Icon = choice.icon
                        return (
                          <button
                            key={choice.type}
                            onClick={() => handleAttach(p, choice.type)}
                            title={choice.label}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-50"
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
      </div>
    </div>
  )
}
