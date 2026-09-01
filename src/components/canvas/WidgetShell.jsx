import { useRef } from 'react'
import { IconGrip, IconX, IconRotate, IconSendBack } from '../../icons.jsx'
import { useTransformable } from './useTransformable.js'

// Generic chrome + move/resize/rotate mechanics for every widget placed on
// the canvas.
//
// Normal widgets (pump, tank, ...) get a white card with a title/drag
// header. Pipe pieces (`bare: true` in registry.js) render with NO card at
// all — just the raw pipe graphic sitting directly on the canvas, so
// several pieces visually merge into one continuous run — and get small
// floating controls instead of a header when in edit mode.
export default function WidgetShell({
  title,
  editMode,
  bare = false,
  backdrop = false,
  layer,
  x,
  y,
  w,
  h,
  rotation = 0,
  minW,
  minH,
  resizeAxis = 'both',
  rotatable = false,
  onTransform,
  onFront,
  onBack,
  onRemove,
  children,
}) {
  const rootRef = useRef(null)
  const { startMove, startResize, startRotate } = useTransformable({
    x,
    y,
    w,
    h,
    rotation,
    minW,
    minH,
    onChange: onTransform,
    onFront,
  })

  const positionStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width: w,
    height: h,
    zIndex: layer,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  }

  if (bare) {
    return (
      <div
        ref={rootRef}
        style={positionStyle}
        onMouseDown={editMode ? onFront : undefined}
        className={editMode ? 'rounded outline-dashed outline-1 outline-navy-300' : ''}
      >
        <div className="h-full w-full">{children}</div>

        {editMode && (
          <>
            <button
              onMouseDown={startMove}
              title={title}
              className="absolute -left-2.5 -top-2.5 flex h-5 w-5 cursor-grab items-center justify-center rounded-full bg-white text-navy-500 shadow-sm ring-1 ring-navy-200 active:cursor-grabbing"
            >
              <IconGrip className="h-3 w-3" />
            </button>
            <button
              onClick={onRemove}
              title="Quitar"
              className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink-300 shadow-sm ring-1 ring-ink-200 hover:text-status-critical"
            >
              <IconX className="h-3 w-3" />
            </button>
            {rotatable && (
              <button
                onMouseDown={(e) => startRotate(e, rootRef)}
                title="Girar"
                className="absolute -top-7 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-white text-navy-500 shadow-sm ring-1 ring-navy-200 active:cursor-grabbing"
              >
                <IconRotate className="h-3 w-3" />
              </button>
            )}
            {resizeAxis !== 'none' && (
              <div
                onMouseDown={(e) => startResize(e, resizeAxis)}
                title="Redimensionar"
                className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm border-b-2 border-r-2 border-navy-400 bg-white"
              />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      style={positionStyle}
      onMouseDown={editMode ? onFront : undefined}
      className={[
        'flex flex-col items-center gap-2 rounded-2xl border p-3 shadow-card transition-shadow',
        'bg-white',
        editMode ? 'border-dashed border-navy-300' : backdrop ? 'border-navy-100' : 'border-ink-100',
      ].join(' ')}
    >
      {editMode && !backdrop && (
        <div className="flex w-full shrink-0 items-center justify-between">
          <span
            onMouseDown={startMove}
            className="flex cursor-grab items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy-400 active:cursor-grabbing"
          >
            <IconGrip className="h-3.5 w-3.5" /> {title}
          </span>
          <div className="flex items-center gap-1">
            {onBack && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onBack}
                title="Enviar panel atrás"
                aria-label="Enviar panel atrás"
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-navy-400 hover:bg-navy-50 hover:text-navy-600"
              >
                <IconSendBack className="h-3.5 w-3.5" />
                Atrás
              </button>
            )}
            <button
              onClick={onRemove}
              className="rounded p-1 text-ink-300 hover:bg-status-criticalBg hover:text-status-critical"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">{children}</div>

      {editMode && rotatable && (
        <button
          onMouseDown={(e) => startRotate(e, rootRef)}
          title="Girar"
          className="absolute -top-4 left-1/2 flex h-7 w-7 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-navy-200 bg-white text-navy-500 shadow-sm active:cursor-grabbing"
        >
          <IconRotate className="h-3.5 w-3.5" />
        </button>
      )}

      {editMode && resizeAxis !== 'none' && !backdrop && (
        <div
          onMouseDown={(e) => startResize(e, resizeAxis)}
          title="Redimensionar"
          className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 cursor-se-resize rounded-sm border-b-2 border-r-2 border-navy-400"
        />
      )}
    </div>
  )
}


// Escape hatch for the one widget type that's forced BEHIND every other
// widget by design (see DashboardCanvas's `layer` prop / useCanvas's
// bringToFront comment): a blank Panel is meant to sit visually under
// whatever real widgets get placed on top of it, which is exactly what
// used to make its own move/remove/resize chrome (drawn inside its own
// body above, now suppressed via `!backdrop`) impossible to click the
// moment anything covered it — "el panel... no me deja borrar". This
// renders as a true SIBLING of every widget body (see DashboardCanvas),
// at a z-index above ALL of them, so it's always reachable no matter
// what's stacked on top of the panel itself.
export function PanelReachHandle({ x, y, w, h, minW, minH, onTransform, onFront, onRemove }) {
  const { startMove, startResize } = useTransformable({
    x,
    y,
    w,
    h,
    rotation: 0,
    minW,
    minH,
    onChange: onTransform,
    onFront,
  })

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 25, pointerEvents: 'none' }}>
      <button
        onMouseDown={startMove}
        title="Mover panel"
        className="pointer-events-auto absolute -left-2.5 -top-2.5 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-white text-navy-500 shadow-sm ring-1 ring-navy-300 active:cursor-grabbing"
      >
        <IconGrip className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onRemove}
        title="Quitar panel"
        className="pointer-events-auto absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-300 shadow-sm ring-1 ring-ink-200 hover:text-status-critical"
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
      <div
        onMouseDown={(e) => startResize(e, 'both')}
        title="Redimensionar panel"
        className="pointer-events-auto absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-sm border-b-2 border-r-2 border-navy-400 bg-white"
      />
    </div>
  )
}
