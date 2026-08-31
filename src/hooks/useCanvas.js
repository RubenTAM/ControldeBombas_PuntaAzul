import { useCallback, useEffect, useState } from 'react'

// Persists the operator's canvas layout in the browser so it survives a
// refresh. This is a per-browser convenience for now — once there's a
// backend for dashboard definitions, this is the hook that would read/write
// there instead.
const STORAGE_KEY = 'puntaazul-canvas-v1'

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

  const addWidget = useCallback((type, config = {}) => {
    setWidgets((prev) => [...prev, { id: nextId(), type, config }])
  }, [])

  const removeWidget = useCallback((id) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const updateWidgetConfig = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w)))
  }, [])

  const moveWidget = useCallback((dragId, dropId) => {
    setWidgets((prev) => {
      const from = prev.findIndex((w) => w.id === dragId)
      const to = prev.findIndex((w) => w.id === dropId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  return { widgets, editMode, setEditMode, addWidget, removeWidget, updateWidgetConfig, moveWidget }
}
