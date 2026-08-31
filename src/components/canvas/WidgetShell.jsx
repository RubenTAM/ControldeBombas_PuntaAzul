import { useRef } from 'react'
import { IconGrip, IconX, IconRotate } from '../../icons.jsx'
import { useTransformable } from './useTransformable.js'

// Generic chrome + move/resize/rotate mechanics for every widget placed on
// the canvas. In edit mode it grows a title/drag handle, a remove button,
// a resize grip (when the widget type allows it) and a rotate handle
// (when the widget type is rotatable, e.g. pipes). In run mode it's just a
// plain, static card.
export default function WidgetShell({
  title,
  editMode,
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
  onRemove,
  children,
}) {
  const rootRef = useRef(null)
  const { startMove, startResize, startRotate } = useTransformable({
    x,
    y,
    w,
    h,
    minW,
    minH,
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
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}
      onMouseDown={editMode ? onFront : undefined}
      className={[
        'flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 shadow-card transition-shadow',
        editMode ? 'border-dashed border-navy-300' : 'border-ink-100',
      ].join(' ')}
    >
      {editMode && (
        <div className="flex w-full shrink-0 items-center justify-between">
          <span
            onMouseDown={startMove}
            className="flex cursor-grab items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy-400 active:cursor-grabbing"
          >
            <IconGrip className="h-3.5 w-3.5" /> {title}
          </span>
          <button
            onClick={onRemove}
            className="rounded p-1 text-ink-300 hover:bg-status-criticalBg hover:text-status-critical"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
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

      {editMode && resizeAxis !== 'none' && (
        <div
          onMouseDown={(e) => startResize(e, resizeAxis)}
          title="Redimensionar"
          className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 cursor-se-resize rounded-sm border-b-2 border-r-2 border-navy-400"
        />
      )}
    </div>
  )
}
