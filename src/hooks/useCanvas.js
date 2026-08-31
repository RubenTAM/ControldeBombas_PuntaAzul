import { useCallback, useEffect, useState } from 'react'

// Persists the operator's canvas layout in the browser so it survives a
// refresh. This is a per-browser convenience for now — once there's a
// backend for dashboard definitions, this is the hook that would read/write
// there instead.
const STORAGE_KEY = 'puntaazul-canvas-v2'

function loadInitial() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    // ignore — start from a blank canvas if storage is unavailable/corrupt
  }
  return []
}

let uid = 1
const nextId = () => `w-${Date.now()}-${uid++}`

export function useCanvas() {
  const [widgets, setWidgets] = useState(loadInitial)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
    } catch (err) {
      // not critical if persistence fails (e.g. private browsing)
    }
  }, [widgets])

  // places a new widget instance with its top-left corner at (x, y)
  const addWidgetAt = useCallback((type, x, y, size, config = {}) => {
    setWidgets((prev) => [
      ...prev,
      {
        id: nextId(),
        type,
        config,
        x: Math.max(0, Math.round(x)),
        y: Math.max(0, Math.round(y)),
        w: size.w,
        h: size.h,
        rotation: 0,
      },
    ])
  }, [])

  const removeWidget = useCallback((id) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const updateWidgetConfig = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w)))
  }, [])

  // patch is any of {x, y, w, h, rotation} — used by move/resize/rotate drags
  const updateTransform = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }, [])

  // re-stacks a widget to the top (drawn last) so it sits above overlapping
  // pieces while it's being dragged/resized/rotated
  const bringToFront = useCallback((id) => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id)
      if (idx === -1 || idx === prev.length - 1) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.push(item)
      return next
    })
  }, [])

  return {
    widgets,
    editMode,
    setEditMode,
    addWidgetAt,
    removeWidget,
    updateWidgetConfig,
    updateTransform,
    bringToFront,
  }
}
