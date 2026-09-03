import { useEffect, useRef, useState } from 'react'
import { WIDGET_CATALOG } from './registry.js'
import { IconPencil, IconDroplet } from '../../icons.jsx'

// Palette of draggable widget "chips". Dropping one on the canvas (handled
// in DashboardCanvas) adds an instance at the exact drop point. This is the
// seed catalog — more widget types (válvulas, caudalímetros, alarmas, etc.)
// get added in registry.js.
//
// The "Dibujar tubería" tool lives here too, in the Tubería group right
// next to the pipe chips it's an alternative to — it used to float over
// the canvas itself, which put it away from every other "make a pipe"
// control and over whatever was already drawn there.
//
// The "Simulación de flujo" toggle sits right beside it for the same
// reason: it's the other control that affects how the pipe pieces look.
// It's OFF by default (see useTelemetry's flowSimEnabled) — with no real
// tag connected yet, nothing on the canvas should animate or start/stop on
// its own. Turning it ON previews the demo look (animated water + the
// AUTO pumps cycling against the simulated tank level); it is not real
// flow telemetry, and once a real tag drives a pump, THAT pump's own
// running state — not this switch — is what will make its pipes flow.
export default function WidgetPalette({ canvas, telemetry }) {
  const { drawMode, toggleDrawMode, pendingPieces, acceptSketch, cancelSketch } = canvas
  const flowSimEnabled = Boolean(telemetry?.flowSimEnabled)
  const [pointerDrag, setPointerDrag] = useState(null)
  const cleanupRef = useRef(null)
  const groups = ['Proceso', 'Tubería', 'Información', 'Estructura']

  useEffect(() => () => cleanupRef.current?.(), [])

  const startPointerDrag = (event, widget) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    cleanupRef.current?.()
    const pointerId = event.pointerId
    setPointerDrag({ type: widget.type, label: widget.label, x: event.clientX, y: event.clientY })

    const move = (nextEvent) => {
      if (nextEvent.pointerId !== pointerId) return
      nextEvent.preventDefault()
      setPointerDrag((current) => current && { ...current, x: nextEvent.clientX, y: nextEvent.clientY })
    }
    const finish = (nextEvent) => {
      if (nextEvent.pointerId !== pointerId) return
      window.dispatchEvent(new CustomEvent('puntaazul:widget-pointer-drop', {
        detail: { type: widget.type, clientX: nextEvent.clientX, clientY: nextEvent.clientY },
      }))
      setPointerDrag(null)
      cleanupRef.current?.()
    }
    const cancel = (nextEvent) => {
      if (nextEvent.pointerId !== pointerId) return
      setPointerDrag(null)
      cleanupRef.current?.()
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
    }
  }

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
                onPointerDown={(event) => startPointerDrag(event, w)}
                className="flex touch-none select-none cursor-grab items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-600 shadow-sm transition-colors hover:border-navy-200 hover:bg-navy-50 active:cursor-grabbing"
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
                title="Dibuja con mouse, dedo o Apple Pencil por donde quieres que pase la tubería; al soltar te muestra el resultado para aceptar o cancelar."
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

          {group === 'Tubería' && telemetry && (
            <button
              onClick={telemetry.toggleFlowSim}
              title="Solo es una simulación visual del flujo en las tuberías — no viene de ningún sensor real. Con una bomba realmente encendida (por tag real, o por esta simulación) sus tuberías se ven fluyendo; si no, se ven quietas."
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold shadow-sm ring-1 transition-colors',
                flowSimEnabled
                  ? 'bg-navy-600 text-white ring-navy-600'
                  : 'border-ink-100 bg-white text-navy-500 ring-ink-100 hover:bg-navy-50',
              ].join(' ')}
            >
              <IconDroplet className="h-4 w-4" />
              {flowSimEnabled ? 'Apagar simulación de flujo' : 'Encender simulación de flujo'}
            </button>
          )}
        </div>
      ))}
      {pointerDrag && (
        <div
          className="pointer-events-none fixed z-[100] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-live-400 bg-white/95 px-3 py-2 text-xs font-bold text-navy-600 shadow-pop"
          style={{ left: pointerDrag.x, top: pointerDrag.y }}
        >
          {pointerDrag.label}
        </div>
      )}
    </div>
  )
}
