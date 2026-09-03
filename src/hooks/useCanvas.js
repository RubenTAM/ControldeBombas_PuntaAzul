import { useCallback, useEffect, useRef, useState } from 'react'
import { WIDGET_REGISTRY } from '../components/canvas/registry.js'
import { getPortWorld, placeAttached, CONNECT_THRESHOLD } from '../components/canvas/ports.js'
import { lengthAlongDir, ALIGN_SNAP } from '../components/canvas/sketchToPipes.js'
import { apiRequest } from '../lib/api.js'

// Persists the operator's canvas layout in the browser so it survives a
// refresh. This is a per-browser convenience for now — once there's a
// backend for dashboard definitions, this is the hook that would read/write
// there instead.
// v3 — bumped after the pipe-fitting geometry (thickness, flange scaling,
// tank outlet port) changed shape multiple times; any layout saved under
// an older key would keep stale x/y/w/h computed from the old math, which
// is exactly what caused pieces to look misaligned even after the
// underlying bug was already fixed. Bumping the key forces every browser
// back to a clean canvas so everything on it was placed with current code.
const STORAGE_KEY = 'puntaazul-canvas-v4'

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

export function useCanvas(authToken = '', canEdit = false) {
  const [widgets, setWidgets] = useState(loadInitial)
  const [editMode, setEditMode] = useState(false)
  const [syncStatus, setSyncStatus] = useState(authToken ? 'loading' : 'local')
  const syncReadyRef = useRef(false)
  const widgetsRef = useRef(widgets)
  const lastRemoteUpdateRef = useRef(null)
  const lastRemoteWidgetsRef = useRef(null)

  // "Dibujar tubería" free-hand sketch tool — lives here (rather than in
  // DashboardCanvas, where the actual mouse-capture/geometry math still
  // happens) so its own toggle button and its "N piezas · Aceptar ·
  // Cancelar" bar can be shown from WidgetPalette, next to the rest of
  // the pipe widgets, instead of floating over the canvas itself. See
  // toggleDrawMode/acceptSketch/cancelSketch below and DashboardCanvas's
  // handleDrawMouseDown/handleDrawMouseMove/finishStroke, which read and
  // write this same state via the shared `canvas` object.
  const [drawMode, setDrawMode] = useState(false)
  const [strokePoints, setStrokePoints] = useState([])
  const [pendingPieces, setPendingPieces] = useState(null)
  // { axis: 'x'|'y', value } while the current stroke's latest segment
  // just auto-leveled against an earlier corner in the SAME stroke — see
  // sketchToPipes.js's findAlignmentGuide.
  const [guideLine, setGuideLine] = useState(null)

  useEffect(() => {
    widgetsRef.current = widgets
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
    } catch (err) {
      // not critical if persistence fails (e.g. private browsing)
    }
  }, [widgets])

  // The browser copy is retained as a migration/offline fallback, but the
  // server is authoritative once a user signs in. On the first authenticated
  // load, an existing local layout seeds an empty server so the dashboard the
  // operator already built is not lost when shared persistence is enabled.
  useEffect(() => {
    syncReadyRef.current = false
    if (!authToken) {
      setSyncStatus('local')
      return
    }
    let cancelled = false
    setSyncStatus('loading')
    apiRequest('/api/dashboard', { token: authToken })
      .then(async (data) => {
        if (cancelled) return
        const remote = Array.isArray(data.widgets) ? data.widgets : []
        lastRemoteUpdateRef.current = data.updated_at || data.updatedAt || null
        lastRemoteWidgetsRef.current = JSON.stringify(remote)
        const hasRemoteState = Boolean(data.updated_at || data.updatedAt)
        if (hasRemoteState) {
          setWidgets(remote)
        } else if (widgetsRef.current.length && canEdit) {
          const saved = await apiRequest('/api/dashboard', {
            method: 'PUT',
            token: authToken,
            body: JSON.stringify({ widgets: widgetsRef.current }),
          })
          lastRemoteUpdateRef.current = saved.updatedAt
          lastRemoteWidgetsRef.current = JSON.stringify(widgetsRef.current)
        } else {
          setWidgets(remote)
        }
        if (!cancelled) {
          syncReadyRef.current = true
          setSyncStatus('synced')
        }
      })
      .catch(() => !cancelled && setSyncStatus('error'))
    return () => { cancelled = true }
  }, [authToken, canEdit])

  useEffect(() => {
    if (!authToken || !canEdit || !syncReadyRef.current) return undefined
    const serialized = JSON.stringify(widgets)
    if (serialized === lastRemoteWidgetsRef.current) return undefined
    setSyncStatus('saving')
    const timeout = window.setTimeout(() => {
      apiRequest('/api/dashboard', {
        method: 'PUT',
        token: authToken,
        body: JSON.stringify({ widgets }),
      }).then((data) => {
        lastRemoteWidgetsRef.current = serialized
        lastRemoteUpdateRef.current = data.updatedAt
        setSyncStatus('synced')
      }).catch(() => setSyncStatus('error'))
    }, 600)
    return () => window.clearTimeout(timeout)
  }, [widgets, authToken, canEdit])

  // A second computer receives dashboard edits without a reload. Polling is
  // paused while this browser is actively editing so two administrators do
  // not pull the canvas underneath one another mid-drag.
  useEffect(() => {
    if (!authToken || editMode || !syncReadyRef.current) return undefined
    const refresh = () => apiRequest('/api/dashboard', { token: authToken })
      .then((data) => {
        if (!data.updated_at || data.updated_at === lastRemoteUpdateRef.current) return
        const remote = Array.isArray(data.widgets) ? data.widgets : []
        const serialized = JSON.stringify(remote)
        lastRemoteUpdateRef.current = data.updated_at
        lastRemoteWidgetsRef.current = serialized
        if (serialized !== JSON.stringify(widgetsRef.current)) setWidgets(remote)
      })
      .catch(() => setSyncStatus('error'))
    const interval = window.setInterval(refresh, 2500)
    return () => window.clearInterval(interval)
  }, [authToken, editMode])

  // places a new widget instance with its top-left corner at (x, y); an
  // optional rotation is used by the pipe-chain "+" builder so a new piece
  // can be dropped in already pointing the right way.
  //
  // x/y are stored exactly as given, NOT rounded to whole pixels — a
  // widget dropped from the palette is already grid-snapped by the caller
  // (see DashboardCanvas's handleDrop), but a piece placed by the "+"
  // pipe-chain builder (see placeAttached in ports.js) is positioned by
  // exact trigonometry so its port lands precisely on the port it's
  // attaching to; rounding that to the nearest pixel was introducing a
  // sub-pixel gap at the joint that showed up as a faint seam.
  const addWidgetAt = useCallback((type, x, y, size, config = {}, rotation = 0) => {
    setWidgets((prev) => [
      ...prev,
      {
        id: nextId(),
        type,
        config,
        x,
        y,
        w: size.w,
        h: size.h,
        rotation,
      },
    ])
  }, [])

  const toggleDrawMode = useCallback(() => {
    setDrawMode((v) => {
      if (v) {
        // turning the tool off mid-stroke — drop whatever was in progress
        setStrokePoints([])
        setGuideLine(null)
      }
      return !v
    })
  }, [])

  const acceptSketch = useCallback(() => {
    setPendingPieces((pieces) => {
      pieces?.forEach((p) => {
        addWidgetAt(p.type, p.x, p.y, { w: p.w, h: p.h }, WIDGET_REGISTRY[p.type].defaultConfig, p.rotation)
      })
      return null
    })
    setStrokePoints([])
    setDrawMode(false)
  }, [addWidgetAt])

  const cancelSketch = useCallback(() => {
    setPendingPieces(null)
    setStrokePoints([])
    setDrawMode(false)
  }, [])

  const removeWidget = useCallback((id) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
  }, [])

  // full reset — the escape hatch for "this piece's controls are stuck /
  // I don't want to hunt for it", instead of relying on clearing browser
  // storage by hand or waiting on a schema-version bump to take effect.
  const clearAll = useCallback(() => {
    setWidgets([])
  }, [])

  const updateWidgetConfig = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w)))
  }, [])

  // patch is any of {x, y, w, h, rotation} — used by move/resize/rotate drags
  const updateTransform = useCallback((id, patch) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }, [])

  // Fixes the exact complaint "las bridas/tuberias no estan a la misma
  // altura": two ports within CONNECT_THRESHOLD already draw as a single
  // connected joint (see the `ports` memo in DashboardCanvas.jsx), but
  // "close enough to hide the seam" isn't the same as "pixel-identical" —
  // a piece placed by hand (drag from the palette, or dragged into range
  // before the snap-while-dragging feature existed) can sit a few px off
  // on either axis and still pass that test, which is exactly the kind of
  // gap that reads as "one is lower than the other" once you draw a
  // reference line through it. This walks every already-connected pair
  // and closes that residual gap with the same exact trigonometry
  // placeAttached uses for a brand-new piece, so existing pieces don't
  // need to be deleted and re-attached through "+" just to line up.
  //
  // Runs in a few passes because nudging one widget to fix joint A can
  // change where ITS other port sits relative to joint B — a short chain
  // settles in 1-2 passes; capped at 6 so a layout that can't fully
  // converge (e.g. a closed loop) can't spin forever.
  const alignConnections = useCallback(() => {
    const next = widgets.map((w) => ({ ...w }))
    const byId = Object.fromEntries(next.map((w) => [w.id, w]))
    let moved = 0

    for (let pass = 0; pass < 6; pass++) {
      const allPorts = []
      next.forEach((w) => {
        const def = WIDGET_REGISTRY[w.type]
        def?.ports?.forEach((p, i) => allPorts.push({ widgetId: w.id, portIndex: i, ...getPortWorld(w, p) }))
      })

      let changedThisPass = false
      const claimed = new Set()
      allPorts.forEach((p) => {
        const pKey = `${p.widgetId}:${p.portIndex}`
        if (claimed.has(pKey)) return
        // same match rule as the `ports` memo (distance), plus a facing
        // check — two ports pointing the same way that happen to be close
        // are two ends laid side by side, not a joint, and shouldn't snap.
        const match = allPorts.find(
          (o) =>
            o.widgetId !== p.widgetId &&
            !claimed.has(`${o.widgetId}:${o.portIndex}`) &&
            (o.dir + 180) % 360 === p.dir &&
            Math.hypot(o.x - p.x, o.y - p.y) < CONNECT_THRESHOLD,
        )
        if (!match) return
        claimed.add(pKey)
        claimed.add(`${match.widgetId}:${match.portIndex}`)

        const dx = p.x - match.x
        const dy = p.y - match.y
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return // already exact

        byId[match.widgetId].x += dx
        byId[match.widgetId].y += dy
        changedThisPass = true
        moved++
      })
      if (!changedThisPass) break
    }

    // Second kind of misalignment "Alinear conexiones" fixes: two OPEN
    // ends that don't touch anything (so the loop above never looks at
    // them) but face the SAME way and are already close — the classic
    // hand-drawn U or n shape where both legs are meant to end at the
    // same height. Only a pipe-straight's own length can be adjusted to
    // close that kind of gap (an elbow/tee/tank's port position is fixed
    // by the rest of its own geometry), so this only ever resizes a
    // straight pipe, anchored at its OTHER end — same trick buildPieces
    // uses when it does this at draw time in sketchToPipes.js; this is
    // what lets an already-placed, already-crooked sketch get fixed with
    // the button instead of needing to be deleted and redrawn.
    {
      const allPorts = []
      next.forEach((w) => {
        const def = WIDGET_REGISTRY[w.type]
        def?.ports?.forEach((p, i) => allPorts.push({ widgetId: w.id, portIndex: i, ...getPortWorld(w, p) }))
      })
      const isFree = (p) =>
        !allPorts.some((o) => o.widgetId !== p.widgetId && Math.hypot(o.x - p.x, o.y - p.y) < CONNECT_THRESHOLD)
      const freePorts = allPorts.filter(isFree)
      const claimedFree = new Set()
      freePorts.forEach((p) => {
        const key = `${p.widgetId}:${p.portIndex}`
        if (claimedFree.has(key)) return
        const widget = byId[p.widgetId]
        if (widget.type !== 'pipe-straight') return
        const axis = p.dir === 90 || p.dir === 270 ? 'y' : p.dir === 0 || p.dir === 180 ? 'x' : null
        if (!axis) return
        const match = freePorts.find(
          (o) =>
            o.widgetId !== p.widgetId &&
            !claimedFree.has(`${o.widgetId}:${o.portIndex}`) &&
            o.dir === p.dir &&
            Math.abs(o[axis] - p[axis]) > 0.01 &&
            Math.abs(o[axis] - p[axis]) < ALIGN_SNAP,
        )
        if (!match) return
        claimedFree.add(key)
        claimedFree.add(`${match.widgetId}:${match.portIndex}`)

        const def = WIDGET_REGISTRY[widget.type]
        const entryIndex = p.portIndex === 0 ? 1 : 0
        const entryWorld = getPortWorld(widget, def.ports[entryIndex])
        const entrySource = { x: entryWorld.x, y: entryWorld.y, dir: (entryWorld.dir + 180) % 360 }
        const target = axis === 'y' ? { x: p.x, y: match.y } : { x: match.x, y: p.y }
        const newLength = Math.max(def.minW, Math.round(lengthAlongDir(entrySource.dir, entrySource, target)))
        const relevelled = placeAttached(entrySource, { w: newLength, h: widget.h }, def.ports[entryIndex])
        Object.assign(widget, relevelled)
        moved++
      })
    }

    if (moved > 0) setWidgets(next)
    return moved
  }, [widgets])

  // Self-heal on load: a layout saved from manual dragging (or from before
  // the snap-while-dragging / "+" fixes existed) can have joints that are
  // "connected" (within CONNECT_THRESHOLD, so they already draw as one
  // piece) but still a few px off — which is exactly what reads as "the
  // flange/pipe isn't at the same height" the moment you compare two of
  // them. Running the same correction once, automatically, the moment the
  // saved canvas loads means an already-broken layout fixes itself on the
  // next refresh, instead of only benefiting pieces placed after this
  // code shipped. Guarded to run only once per mount — it's a fixed point
  // once applied (a second run always reports 0), so there's no risk of
  // it fighting a manual drag afterwards.
  const didAutoAlign = useRef(false)
  useEffect(() => {
    if (didAutoAlign.current) return
    didAutoAlign.current = true
    alignConnections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // re-stacks a widget to the top (drawn last) so it sits above overlapping
  // pieces while it's being dragged/resized/rotated
  const bringToFront = useCallback((id) => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      if (item.type === 'panel') {
        // A panel can move in front of another panel while it is edited,
        // but it must remain below every real dashboard widget.
        const firstNonPanel = next.findIndex((w) => w.type !== 'panel')
        next.splice(firstNonPanel === -1 ? next.length : firstNonPanel, 0, item)
      } else {
        next.push(item)
      }
      return next
    })
  }, [])

  const sendToBack = useCallback((id) => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === id)
      if (idx <= 0 || prev[idx].type !== 'panel') return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.unshift(item)
      return next
    })
  }, [])

  return {
    widgets,
    editMode,
    setEditMode,
    addWidgetAt,
    removeWidget,
    clearAll,
    updateWidgetConfig,
    updateTransform,
    bringToFront,
    sendToBack,
    alignConnections,
    drawMode,
    toggleDrawMode,
    strokePoints,
    setStrokePoints,
    pendingPieces,
    setPendingPieces,
    guideLine,
    setGuideLine,
    acceptSketch,
    syncStatus,
    cancelSketch,
  }
}
