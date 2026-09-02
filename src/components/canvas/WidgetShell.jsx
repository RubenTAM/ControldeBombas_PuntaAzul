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
// Move/resize/rotate/remove no longer happen inside this component at
// all (see WidgetReachHandle below) — WidgetShell now only draws each
// widget's own visual chrome (card vs. bare) and forwards a plain click
// to bring it to front; it accepts (and DashboardCanvas still passes)
// minW/minH/resizeAxis/rotatable/onBack/onTransform purely because the
// same widget definition also feeds WidgetReachHandle, not because this
// component itself uses them.
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
  onFront,
  children,
}) {
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
        style={positionStyle}
        onPointerDown={editMode ? onFront : undefined}
        className={editMode ? 'rounded outline-dashed outline-1 outline-navy-300' : ''}
      >
        <div className="h-full w-full">{children}</div>
      </div>
    )
  }

  return (
    <div
      style={positionStyle}
      onPointerDown={editMode ? onFront : undefined}
      className={[
        'flex flex-col items-center gap-2 rounded-2xl border p-3 shadow-card transition-shadow',
        'bg-white',
        editMode ? 'border-dashed border-navy-300' : backdrop ? 'border-navy-100' : 'border-ink-100',
      ].join(' ')}
    >
      {editMode && !backdrop && (
        <div className="flex w-full shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy-400">
          <IconGrip className="h-3.5 w-3.5" /> {title}
        </div>
      )}

      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">{children}</div>

    </div>
  )
}


// Escape hatch for EVERY widget on the canvas, not just panels — this used
// to be panel-only (a blank Panel is deliberately kept BEHIND every real
// widget by design, see useCanvas's bringToFront comment, which made it
// the first thing to get its own chrome trapped), but the exact same trap
// turned out to catch ANY widget: two widgets share the same flat
// `layer` value (0 for panels, 1 for everything else — see
// DashboardCanvas), so among widgets with equal layer, plain paint order
// decides who's on top, and a widget painted later (e.g. dragged/added
// after another, or simply later in the list) visually covers an earlier
// one's own in-card header/resize chrome — an explicit z-index (even
// z-index: 1 on both) still opens its own stacking context, which traps
// that chrome below the later sibling no matter what z-index the chrome
// itself claims. "los widgets se quedan detras... no me permite borrarlos
// o moverlos" — a Bomba 1 control card sitting under the Bomba 1 pump
// card is the same bug as the panel one, just not limited to panels.
//
// Fix: move/remove/resize/rotate controls for EVERY widget are rendered
// here, as true SIBLINGS of every widget body (see DashboardCanvas's own
// widgets.map for the bodies vs. this one for the handles), all sharing
// ONE z-index (25) that sits above every widget body's (0 or 1) — so
// no matter which widget got painted last, its handles are never the
// ones buried; they're always in this separate, always-on-top layer.
// WidgetShell's own in-card header/resize/rotate blocks are gone now
// (see the `bare`/non-bare branches above) — this is the only copy.
export function WidgetReachHandle({
  x,
  y,
  w,
  h,
  rotation = 0,
  minW,
  minH,
  resizeStep,
  resizeAxis = 'both',
  rotatable = false,
  title,
  onTransform,
  onFront,
  onBack,
  onRemove,
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
    resizeStep,
    onChange: onTransform,
    onFront,
  })

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        zIndex: 25,
        pointerEvents: 'none',
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      <button
        onPointerDown={startMove}
        title={title ? `Mover ${title}` : 'Mover'}
        className="pointer-events-auto absolute -left-2.5 -top-2.5 flex h-7 w-7 touch-none select-none items-center justify-center rounded-full bg-white text-navy-500 shadow-sm ring-1 ring-navy-300 active:cursor-grabbing"
      >
        <IconGrip className="h-3.5 w-3.5" />
      </button>
      {/* only panels pass onBack; never coincides with the rotate button
          below (only bare pipe pieces are rotatable, and those never pass
          onBack), so both can safely claim the same top-center spot */}
      {onBack && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onBack}
          title="Enviar atrás"
          className="pointer-events-auto absolute -top-2.5 left-1/2 flex h-7 w-7 touch-manipulation items-center justify-center -translate-x-1/2 rounded-full bg-white text-navy-400 shadow-sm ring-1 ring-navy-200 hover:text-navy-600"
        >
          <IconSendBack className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={onRemove}
        title={title ? `Quitar ${title}` : 'Quitar'}
        className="pointer-events-auto absolute -right-2.5 -top-2.5 flex h-7 w-7 touch-manipulation items-center justify-center rounded-full bg-white text-ink-300 shadow-sm ring-1 ring-ink-200 hover:text-status-critical"
      >
        <IconX className="h-3.5 w-3.5" />
      </button>
      {rotatable && (
        <button
          onPointerDown={(e) => startRotate(e, rootRef)}
          title="Girar"
          className="pointer-events-auto absolute -top-8 left-1/2 flex h-7 w-7 touch-none select-none -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-white text-navy-500 shadow-sm ring-1 ring-navy-200 active:cursor-grabbing"
        >
          <IconRotate className="h-3.5 w-3.5" />
        </button>
      )}
      {resizeAxis !== 'none' && (
        <div
          onPointerDown={(e) => startResize(e, resizeAxis)}
          title="Redimensionar"
          className="pointer-events-auto absolute -bottom-2.5 -right-2.5 h-7 w-7 touch-none select-none cursor-se-resize rounded-md border-b-2 border-r-2 border-navy-400 bg-white/90"
        />
      )}
    </div>
  )
}
