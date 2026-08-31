import { IconGrip, IconX } from '../../icons.jsx'

// Generic chrome around every widget placed on the canvas: in edit mode it
// grows a drag handle + remove button; in run mode it's just a plain card.
export default function WidgetShell({
  title,
  editMode,
  widthClass = 'w-[220px]',
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  children,
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        'flex flex-col items-center gap-3 rounded-2xl border bg-white p-4 shadow-card transition-shadow',
        editMode ? 'border-dashed border-navy-300' : 'border-ink-100',
        widthClass,
      ].join(' ')}
    >
      {editMode && (
        <div className="flex w-full items-center justify-between">
          <span className="flex cursor-grab items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy-400 active:cursor-grabbing">
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
      {children}
    </div>
  )
}
