import { useEffect, useMemo, useRef, useState } from 'react'
import WidgetShell, { WidgetReachHandle } from './WidgetShell.jsx'
import { WIDGET_REGISTRY } from './registry.js'
import { getPortWorld, placeAttached, CONNECT_THRESHOLD } from './ports.js'
import { sketchToPieces, simplify, orthogonalize, findAlignmentGuide } from './sketchToPipes.js'
import { IconLayoutBoard, IconPipeStraight, IconPipeElbow, IconPipeTee, IconPipeTeeUp, IconPump } from '../../icons.jsx'

const GRID = 20
// A widget placed right at the canvas edge (x/y near 0) has its floating
// edit controls (grip, remove-X, rotate) sitting on small NEGATIVE offsets
// outside its own box (see WidgetShell's bare mode) — with no buffer, that
// button lands outside the canvas's own boundary and is unreachable, with
// no scrollbar to reveal it (the canvas is a fixed, non-scrolling area —
// see the outer container below). This padding reserves that buffer on
// every edge so the controls always render fully on-screen.
const CANVAS_PAD = 28
// px — while DRAGGING a widget, one of its own ports coming within this
// distance of another widget's open port (and facing it, i.e. the two
// ports' outward directions are opposite) snaps its position so the two
// line up exactly — "acercarlo y que se conecte" instead of having to
// eyeball pixel-perfect placement by hand. Bigger than CONNECT_THRESHOLD
// on purpose: it should grab well before the piece is already close
// enough to visually read as connected.
const SNAP_THRESHOLD = 26
const LAYOUT_SNAP_THRESHOLD = 10
const snapGrid = (value) => Math.round(value / GRID) * GRID

// The 3 piece types offered from every open port's "+" menu.
const ATTACH_CHOICES = [
  { type: 'pipe-straight', label: 'Recta', icon: IconPipeStraight },
  { type: 'pipe-elbow', label: 'Codo 90°', icon: IconPipeElbow },
  { type: 'pipe-tee', label: 'Te', icon: IconPipeTee },
  { type: 'pipe-tee-up', label: 'Te (arriba)', icon: IconPipeTeeUp },
  // Bomba/Tanque go through this SAME "+" flow now too — it's what makes
  // the tank's own connections come out pixel-exact with zero gap: it
  // places the new piece with placeAttached (so its port lands exactly
  // on the source port, no eyeballing) AND scales it via scaleOfSource
  // (so its tube/flange comes out the same diameter as whatever it's
  // attached to). Dragging a fresh "Bomba" in from the palette instead
  // skips both of those — it lands whole at the registry's raw
  // defaultSize, which is why a hand-placed pump ends up a different
  // size than the rest of an already-scaled-up run, with a gap besides.
  { type: 'pump', label: 'Bomba', icon: IconPump },
]

export default function DashboardCanvas({ telemetry, canvas }) {
  const {
    widgets,
    editMode,
    addWidgetAt,
    removeWidget,
    updateWidgetConfig,
    updateTransform,
    bringToFront,
    sendToBack,
    // "Dibujar tubería" free-hand sketch mode — the toggle button and the
    // "N piezas · Aceptar · Cancelar" bar now live in WidgetPalette (next
    // to the pipe widgets, not floating over the canvas), so this state
    // itself lives in useCanvas; only the mouse-capture mechanics below
    // (which need canvasRef and the live `ports` list) stay here.
    drawMode,
    strokePoints,
    setStrokePoints,
    pendingPieces,
    setPendingPieces,
    guideLine,
    setGuideLine,
  } = canvas
  const canvasRef = useRef(null)
  const [layoutWidth, setLayoutWidth] = useState(0)
  const [openPicker, setOpenPicker] = useState(null) // { widgetId, portIndex, port }
  const isDrawingRef = useRef(null)
  const strokePointsRef = useRef([])

  // The dashboard is vertically scrollable, but it has a real, fixed
  // horizontal layout width. Keep enough inset for the floating edit
  // controls too: a widget at x=0 is technically inside the canvas, while
  // its remove/move buttons (negative offsets) are not.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return undefined
    const measure = () => setLayoutWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const constrainToLayout = (widget, patch = {}) => {
    const next = { ...widget, ...patch }
    const width = layoutWidth || canvasRef.current?.clientWidth || 0
    if (!width) return next

    const def = WIDGET_REGISTRY[next.type]
    const minW = def?.minW ?? 20
    const minH = def?.minH ?? 20
    const angle = (((next.rotation || 0) % 360) * Math.PI) / 180
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))
    const available = Math.max(1, width - CANVAS_PAD * 2)
    const isLayoutWidget = !def?.ports?.length

    // Cards and panels belong to the visual grid. Pipe-system pieces keep
    // their exact port geometry instead, otherwise rounding would reopen
    // connections that were positioned by trigonometry.
    if (isLayoutWidget) {
      next.x = snapGrid(next.x)
      next.y = snapGrid(next.y)
      if (def?.resizeAxis === 'both' || def?.resizeAxis === 'width') next.w = Math.max(minW, snapGrid(next.w))
      if (def?.resizeAxis === 'both' || def?.resizeAxis === 'height') next.h = Math.max(minH, snapGrid(next.h))
    }

    // If an old saved widget (or a very wide palette item on a narrow
    // screen) cannot fit at all, reduce it before positioning it. The
    // common 0/90-degree rotations keep their proportions and minimums.
    let visualW = next.w * cos + next.h * sin
    if (visualW > available) {
      const scale = available / visualW
      next.w = Math.max(Math.min(minW, available), next.w * scale)
      next.h = Math.max(Math.min(minH, available), next.h * scale)
      if (isLayoutWidget) {
        if (def?.resizeAxis === 'both' || def?.resizeAxis === 'width') next.w = Math.max(Math.min(minW, available), Math.floor(next.w / GRID) * GRID)
        if (def?.resizeAxis === 'both' || def?.resizeAxis === 'height') next.h = Math.max(minH, snapGrid(next.h))
      }
      visualW = next.w * cos + next.h * sin
    }

    const visualH = next.w * sin + next.h * cos
    const offsetX = (next.w - visualW) / 2
    const offsetY = (next.h - visualH) / 2
    const rawMinX = CANVAS_PAD - offsetX
    const rawMaxX = width - CANVAS_PAD - visualW - offsetX
    const minX = isLayoutWidget ? Math.ceil(rawMinX / GRID) * GRID : rawMinX
    const maxX = isLayoutWidget ? Math.floor(rawMaxX / GRID) * GRID : rawMaxX

    // When a widget's own minimum size is wider than the available area,
    // centering is the only non-arbitrary fallback. Normally minX <= maxX.
    next.x = maxX < minX ? (width - next.w) / 2 : Math.min(maxX, Math.max(minX, next.x))
    const minY = CANVAS_PAD - offsetY
    next.y = Math.max(isLayoutWidget ? Math.ceil(minY / GRID) * GRID : minY, next.y)
    return next
  }

  // Recover layouts already persisted with negative/off-screen positions,
  // and re-fit them if the sidebar/window later makes the canvas narrower.
  useEffect(() => {
    if (!layoutWidth) return
    widgets.forEach((widget) => {
      const bounded = constrainToLayout(widget)
      if (
        Math.abs(bounded.x - widget.x) > 0.01 ||
        Math.abs(bounded.y - widget.y) > 0.01 ||
        Math.abs(bounded.w - widget.w) > 0.01 ||
        Math.abs(bounded.h - widget.h) > 0.01
      ) {
        updateTransform(widget.id, { x: bounded.x, y: bounded.y, w: bounded.w, h: bounded.h })
      }
    })
    // constrainToLayout intentionally reads the current registry and width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutWidth, widgets, updateTransform])

  // every port on every placed widget, in canvas coordinates, plus
  // whether another widget's port already sits right on top of it (=
  // "connected") and, when it is, what TYPE that other widget is.
  const ports = useMemo(() => {
    const all = []
    widgets.forEach((w) => {
      const def = WIDGET_REGISTRY[w.type]
      def?.ports?.forEach((p, i) =>
        all.push({ widgetId: w.id, widgetType: w.type, portIndex: i, ...getPortWorld(w, p), portDef: p }),
      )
    })
    return all.map((p) => {
      const match = all.find(
        (o) => o.widgetId !== p.widgetId && Math.hypot(o.x - p.x, o.y - p.y) < CONNECT_THRESHOLD,
      )
      return { ...p, open: !match, connectedType: match?.widgetType ?? null }
    })
  }, [widgets])

  // per-widget array of booleans (indexed like the widget's own `ports`
  // list in registry.js) saying which of ITS ports are still open/unused.
  // Pipe pieces use this to only draw a flange at a port that's a true,
  // unconnected end — a port that's actually touching another piece draws
  // no flange at all on either side, so two chained pieces read as one
  // continuous tube instead of two flanges pressed/overlapping together.
  const portsOpenByWidget = useMemo(() => {
    const map = {}
    ports.forEach((p) => {
      if (!map[p.widgetId]) map[p.widgetId] = []
      map[p.widgetId][p.portIndex] = p.open
    })
    return map
  }, [ports])

  // per-widget array of the TYPE connected at each port (or null when
  // open) — Tank/Bomba use this to decide whether to draw their own
  // permanent flange: a Te/curve always draws its own (see
  // ALWAYS_FLANGE_TYPES over in PipeTeeWidget/PipeElbowWidget), so a
  // tank/pump connected directly to one has to yield instead of stacking
  // a second flange plate right on top of it. A straight pipe hides its
  // OWN flange when connected instead, so a tank/pump connected to one
  // still has to show its own — that's the one case a plain boolean
  // "connected or not" can't tell apart, which is what caused the
  // doubled/gapped flange the moment a Te sat directly on a pump.
  const portsConnectedTypeByWidget = useMemo(() => {
    const map = {}
    ports.forEach((p) => {
      if (!map[p.widgetId]) map[p.widgetId] = []
      map[p.widgetId][p.portIndex] = p.connectedType
    })
    return map
  }, [ports])

  // The layout may grow downward and scroll, but never sideways. Track
  // only the deepest bottom edge; horizontal placement is constrained by
  // constrainToLayout above.
  const contentHeight = useMemo(() => {
    let maxY = 0
    widgets.forEach((w) => {
      maxY = Math.max(maxY, w.y + w.h)
    })
    return maxY
  }, [widgets])

  // While dragging a widget (a plain x/y move, not a resize or rotate),
  // check every one of ITS OWN ports against every OTHER widget's still-
  // open port; if one pair is close enough and actually facing each
  // other (outward directions 180° apart), snap the move so they land
  // exactly on top of one another instead of a few px off. This is what
  // makes dragging a piece "close enough" actually connect it, rather
  // than requiring pixel-perfect manual placement.
  const snapMove = (widget, patch) => {
    if (patch.x === undefined || patch.y === undefined || patch.w !== undefined || patch.rotation !== undefined) {
      return patch
    }
    const def = WIDGET_REGISTRY[widget.type]
    if (!def?.ports?.length) return patch
    const trial = { ...widget, x: patch.x, y: patch.y }
    let best = null
    def.ports.forEach((portDef) => {
      const myPort = getPortWorld(trial, portDef)
      ports.forEach((other) => {
        if (other.widgetId === widget.id || !other.open) return
        if (((myPort.dir + 180) % 360) !== other.dir) return
        const dist = Math.hypot(other.x - myPort.x, other.y - myPort.y)
        if (dist < SNAP_THRESHOLD && (!best || dist < best.dist)) {
          best = { dist, dx: other.x - myPort.x, dy: other.y - myPort.y }
        }
      })
    })
    return best ? { ...patch, x: patch.x + best.dx, y: patch.y + best.dy } : patch
  }

  // Magnetic alignment for panels/cards: match left, center and right (or
  // top, center and bottom) with neighboring layout widgets. The final
  // constrainToLayout pass still normalizes everything to the 20px grid.
  const snapLayoutTransform = (widget, patch) => {
    const def = WIDGET_REGISTRY[widget.type]
    if (def?.ports?.length || patch.rotation !== undefined) return snapMove(widget, patch)

    const trial = { ...widget, ...patch }
    const others = widgets.filter((other) => other.id !== widget.id && !WIDGET_REGISTRY[other.type]?.ports?.length)
    const closest = (values, targets) => {
      let best = null
      values.forEach((value) => targets.forEach((target) => {
        const delta = target - value
        if (Math.abs(delta) <= LAYOUT_SNAP_THRESHOLD && (best === null || Math.abs(delta) < Math.abs(best))) best = delta
      }))
      return best
    }

    if (patch.x !== undefined && patch.y !== undefined) {
      const myX = [trial.x, trial.x + trial.w / 2, trial.x + trial.w]
      const myY = [trial.y, trial.y + trial.h / 2, trial.y + trial.h]
      const targetX = others.flatMap((other) => [other.x, other.x + other.w / 2, other.x + other.w])
      const targetY = others.flatMap((other) => [other.y, other.y + other.h / 2, other.y + other.h])
      const dx = closest(myX, targetX)
      const dy = closest(myY, targetY)
      return { ...patch, x: trial.x + (dx ?? 0), y: trial.y + (dy ?? 0) }
    }

    if (patch.w !== undefined) {
      const targetX = others.flatMap((other) => [other.x, other.x + other.w / 2, other.x + other.w])
      const dx = closest([trial.x + trial.w], targetX)
      if (dx !== null) patch = { ...patch, w: trial.w + dx }
    }
    if (patch.h !== undefined) {
      const targetY = others.flatMap((other) => [other.y, other.y + other.h / 2, other.y + other.h])
      const dy = closest([trial.y + trial.h], targetY)
      if (dy !== null) patch = { ...patch, h: trial.h + dy }
    }
    return patch
  }

  const placePaletteWidget = (type, clientX, clientY) => {
    const def = WIDGET_REGISTRY[type]
    if (!def || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return
    // Widgets/ports are absolutely positioned inside the padded inner box,
    // but CSS resolves an absolutely-positioned child's left/top against
    // that box's OWN edge (its padding box, which starts at the same place
    // as its border box when there's no border) — the padding sits INSIDE
    // that box as empty space, it doesn't push the origin inward. So a
    // world x/y of 0 renders exactly at canvasRef's own rect.left/top, not
    // rect.left + CANVAS_PAD; subtracting CANVAS_PAD here used to shift
    // every drop/draw coordinate by a stray 28px versus what's actually
    // under the cursor — confirmed by comparing a real port's rendered
    // screen position against this conversion. Also add back however far
    // the canvas is currently scrolled vertically, since long layouts can
    // be taller than the visible viewport and rect only describes that
    // visible portion.
    const rawX = clientX - rect.left + canvasRef.current.scrollLeft - def.defaultSize.w / 2
    const rawY = clientY - rect.top + canvasRef.current.scrollTop - def.defaultSize.h / 2
    const candidate = {
      type,
      x: Math.round(rawX / GRID) * GRID,
      y: Math.round(rawY / GRID) * GRID,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      rotation: 0,
    }
    const bounded = constrainToLayout(candidate)
    addWidgetAt(type, bounded.x, bounded.y, { w: bounded.w, h: bounded.h }, def.defaultConfig)
    setOpenPicker(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    placePaletteWidget(e.dataTransfer.getData('text/widget-type'), e.clientX, e.clientY)
  }

  // HTML drag-and-drop is unreliable on iPadOS. WidgetPalette emits this
  // pointer-based drop for touch/pen/mouse and this canvas applies the
  // exact same positioning and boundary rules as the desktop drop path.
  useEffect(() => {
    const handlePointerDrop = (event) => {
      const { type, clientX, clientY } = event.detail || {}
      placePaletteWidget(type, clientX, clientY)
    }
    window.addEventListener('puntaazul:widget-pointer-drop', handlePointerDrop)
    return () => window.removeEventListener('puntaazul:widget-pointer-drop', handlePointerDrop)
  })

  // How much bigger/smaller the source widget currently is than the size
  // its own geometry (tube thickness, flange, etc.) was authored at — so
  // a piece attached from a resized-up tank or pipe comes out at the same
  // proportions as the flange it's actually attaching to, instead of
  // always defaulting to its own base size.
  const scaleOfSource = (widgetId) => {
    const source = widgets.find((w) => w.id === widgetId)
    const sourceDef = source && WIDGET_REGISTRY[source.type]
    if (!source || !sourceDef) return 1
    return source.h / sourceDef.defaultSize.h
  }

  const handleAttach = (port, type) => {
    const def = WIDGET_REGISTRY[type]
    const scale = scaleOfSource(port.widgetId)
    const size = { w: Math.round(def.defaultSize.w * scale), h: Math.round(def.defaultSize.h * scale) }
    const transform = placeAttached(port, size, def.ports[0])
    addWidgetAt(type, transform.x, transform.y, { w: transform.w, h: transform.h }, def.defaultConfig, transform.rotation)
    setOpenPicker(null)
  }

  // px — how close a stroke's own starting point has to land to an
  // existing OPEN port for the drawn run to weld onto it (see
  // sketchToPipes.js's START_SNAP) instead of starting fresh in free
  // space at the default pipe size. A bit more forgiving than
  // CONNECT_THRESHOLD/SNAP_THRESHOLD since a mouse-drawn start point is
  // naturally less precise than a dragged piece.
  const DRAW_START_SNAP = 40

  // canvas-local coordinates (same space widget x/y and port positions
  // live in) for a mouse event — see the CANVAS_PAD note on handleDrop
  // above for why this does NOT also subtract CANVAS_PAD.
  const toCanvasPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left + canvasRef.current.scrollLeft,
      y: e.clientY - rect.top + canvasRef.current.scrollTop,
    }
  }

  const findStartAnchor = (pt) => {
    const match = ports.find((p) => p.open && Math.hypot(p.x - pt.x, p.y - pt.y) < DRAW_START_SNAP)
    if (!match) return null
    return { port: { x: match.x, y: match.y, dir: match.dir }, scale: scaleOfSource(match.widgetId) }
  }

  // Same idea as findStartAnchor, but for the OTHER end of the stroke —
  // "llevando de una tubería a otra... va a quedar desfasada". Without
  // this, only the stroke's own start ever welded onto a real port; the
  // end just stopped wherever the mouse happened to lift, which could be
  // CLOSE enough to another port to visually merge (within
  // CONNECT_THRESHOLD) while still sitting a few px off on one axis —
  // exactly the "desfasada" the shadow/preview was already showing before
  // accepting. `startAnchor`'s own port is excluded so a short stroke that
  // starts and ends near the same port can't snap to itself.
  const findEndAnchor = (pt, startAnchor) => {
    const match = ports.find(
      (p) =>
        p.open &&
        Math.hypot(p.x - pt.x, p.y - pt.y) < DRAW_START_SNAP &&
        !(startAnchor && p.x === startAnchor.port.x && p.y === startAnchor.port.y),
    )
    if (!match) return null
    return { port: { x: match.x, y: match.y, dir: match.dir }, scale: scaleOfSource(match.widgetId) }
  }

  const handleDrawPointerDown = (e) => {
    if (!e.isPrimary) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    isDrawingRef.current = e.pointerId
    setGuideLine(null)
    const firstPoint = toCanvasPoint(e)
    strokePointsRef.current = [firstPoint]
    setStrokePoints([firstPoint])
  }

  const handleDrawPointerMove = (e) => {
    if (isDrawingRef.current !== e.pointerId) return
    e.preventDefault()
    const pt = toCanvasPoint(e)
    const last = strokePointsRef.current[strokePointsRef.current.length - 1]
    // thin out samples as they arrive — a real mousemove stream fires far
    // more often than the shape of the stroke needs
    if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 4) return
    const next = [...strokePointsRef.current, pt]
    strokePointsRef.current = next
    setStrokePoints(next)
    // Run the same simplify + orthogonalize stages as the final build. The
    // guide must describe the geometry that will actually be accepted; the
    // previous raw-point preview could promise an alignment that RDP later
    // changed when the stroke was converted into pieces.
    setGuideLine(findAlignmentGuide(orthogonalize(simplify(next))))
  }

  const finishStroke = (e) => {
    if (e && isDrawingRef.current !== e.pointerId) return
    if (isDrawingRef.current === null) return
    const points = strokePointsRef.current
    isDrawingRef.current = null
    setGuideLine(null)
    if (points.length < 2) {
      strokePointsRef.current = []
      setStrokePoints([])
      return
    }
    const anchor = findStartAnchor(points[0])
    const endAnchor = findEndAnchor(points[points.length - 1], anchor)
    const pieces = sketchToPieces(points, WIDGET_REGISTRY, anchor, endAnchor)
    if (pieces.length === 0) {
      strokePointsRef.current = []
      setStrokePoints([])
      return
    }
    setPendingPieces(pieces)
  }

  const cancelActiveStroke = (e) => {
    if (isDrawingRef.current !== e.pointerId) return
    isDrawingRef.current = null
    strokePointsRef.current = []
    setGuideLine(null)
    setStrokePoints([])
  }

  // One-click "fill this panel" shortcut offered by PanelWidget on any
  // panel that hasn't been used yet (see its `filled` config flag) — adds
  // a Bomba 1 / Bomba 2 auto-manual pair, the nivel-alto/nivel-bajo
  // setpoints, and a historical-readings table, laid out to fit inside
  // THIS panel's own current x/y/w/h instead of always landing at the
  // registry's default position. Falls back to a single stacked column
  // when the panel isn't wide enough for two cards side by side (see
  // `twoCol`), so a narrow, tall panel still gets something usable
  // instead of five overlapping, too-narrow widgets.
  // Defensive guard for the quick-fill shortcut below: a panel that
  // already has other widgets sitting inside its bounds — like the
  // tank/pump backdrop panel, which predates this feature and so was
  // never marked `filled` — must never offer "+ Plantilla de control"
  // either, even though its own `config.filled` flag is unset. Without
  // this, that button is only one accidental click away from stamping a
  // stray default title onto an already-built panel (exactly what
  // happened once already before this check existed).
  const panelHasChildren = (panel) =>
    widgets.some((o) => {
      if (o.id === panel.id || o.type === 'panel') return false
      const cx = o.x + o.w / 2
      const cy = o.y + o.h / 2
      return cx >= panel.x && cx <= panel.x + panel.w && cy >= panel.y && cy <= panel.y + panel.h
    })

  const handleQuickFillPanel = (panel) => {
    const pad = 16
    const gap = 16
    const innerW = panel.w - pad * 2
    const twoCol = innerW >= 420
    const colW = twoCol ? (innerW - gap) / 2 : innerW
    let cursorY = panel.y + 44 // leave room for the panel's own title row

    const place = (type, x, y, w, h, config) => {
      const def = WIDGET_REGISTRY[type]
      addWidgetAt(type, x, y, { w: Math.round(w), h: Math.round(h) }, { ...def.defaultConfig, ...config })
    }

    const modeH = 140
    if (twoCol) {
      place('modeselect', panel.x + pad, cursorY, colW, modeH, { pumpId: 'p1' })
      place('modeselect', panel.x + pad + colW + gap, cursorY, colW, modeH, { pumpId: 'p2' })
      cursorY += modeH + gap
    } else {
      place('modeselect', panel.x + pad, cursorY, colW, modeH, { pumpId: 'p1' })
      cursorY += modeH + 12
      place('modeselect', panel.x + pad, cursorY, colW, modeH, { pumpId: 'p2' })
      cursorY += modeH + gap
    }

    const spH = 150
    if (twoCol) {
      place('setpoint', panel.x + pad, cursorY, colW, spH, { key: 'start' })
      place('setpoint', panel.x + pad + colW + gap, cursorY, colW, spH, { key: 'stop' })
      cursorY += spH + gap
    } else {
      place('setpoint', panel.x + pad, cursorY, colW, spH, { key: 'start' })
      cursorY += spH + 12
      place('setpoint', panel.x + pad, cursorY, colW, spH, { key: 'stop' })
      cursorY += spH + gap
    }

    // the table takes whatever height is left in the panel, never
    // shrunk below its own registry minH even if that means it runs
    // past the panel's current bottom edge (better an overflow you can
    // resize away than a table too short to read)
    const tableMinH = WIDGET_REGISTRY['history-table'].minH
    const remaining = panel.y + panel.h - pad - cursorY
    place('history-table', panel.x + pad, cursorY, innerW, Math.max(tableMinH, remaining))

    updateWidgetConfig(panel.id, {
      filled: true,
      title: panel.config?.title || 'Control de bombas y niveles',
    })
  }

  return (
    <div
      ref={canvasRef}
      onDragOver={editMode ? (e) => e.preventDefault() : undefined}
      onDrop={editMode ? handleDrop : undefined}
      onPointerDown={() => setOpenPicker(null)}
      className={[
        'relative min-h-0 flex-1 rounded-2xl bg-navy-50',
        editMode ? 'overflow-auto' : 'overflow-hidden',
      ].join(' ')}
    >
      {/* The surface grows downward so long dashboards remain scrollable,
          while its width stays locked to the visible layout. */}
      <div
        className={editMode ? 'relative' : 'absolute inset-0'}
        style={
          editMode
            ? {
                padding: CANVAS_PAD,
                width: '100%',
                height: `max(100%, ${contentHeight + CANVAS_PAD * 2}px)`,
                backgroundImage: 'radial-gradient(circle, #c7ccdb 1px, transparent 1px)',
                backgroundSize: `${GRID}px ${GRID}px`,
              }
            : { padding: CANVAS_PAD }
        }
      >
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
              backdrop={w.type === 'panel'}
              layer={w.type === 'panel' ? 0 : w.type === 'pump' ? 2 : 1}
              x={w.x}
              y={w.y}
              w={w.w}
              h={w.h}
              rotation={w.rotation}
              minW={minW}
              minH={minH}
              resizeAxis={resizeAxis}
              rotatable={rotatable}
              onTransform={(patch) => updateTransform(w.id, constrainToLayout(w, snapLayoutTransform(w, patch)))}
              onFront={() => bringToFront(w.id)}
              onBack={w.type === 'panel' ? () => sendToBack(w.id) : undefined}
              onRemove={() => removeWidget(w.id)}
            >
              <Component
                telemetry={telemetry}
                config={w.config}
                editMode={editMode}
                onConfigChange={(patch) => updateWidgetConfig(w.id, patch)}
                width={w.w}
                height={w.h}
                portsOpen={portsOpenByWidget[w.id]}
                connectedTypes={portsConnectedTypeByWidget[w.id]}
                onQuickFill={w.type === 'panel' && !panelHasChildren(w) ? () => handleQuickFillPanel(w) : undefined}
              />
            </WidgetShell>
          )
        })}

        {/* Move/remove/resize/rotate handles for EVERY widget, not just
            panels — see WidgetShell.jsx's WidgetReachHandle comment for
            why this has to be a separate, always-on-top sibling layer
            instead of chrome drawn inside each widget's own body: two
            widgets sharing the same flat `layer` (0 or 1, right above)
            still trap an earlier one's own controls under whichever one
            painted later, panel or not — "los widgets se quedan detras
            de lo de arriba... no me permite borrarlos o moverlos". */}
        {editMode &&
          widgets.map((w) => {
            const def = WIDGET_REGISTRY[w.type]
            if (!def) return null
            return (
              <WidgetReachHandle
                key={`reach-${w.id}`}
                title={def.label}
                x={w.x}
                y={w.y}
                w={w.w}
                h={w.h}
                rotation={w.rotation}
                minW={def.minW}
                minH={def.minH}
                resizeStep={def.resizeStep}
                resizeAxis={def.resizeAxis}
                rotatable={def.rotatable}
                onTransform={(patch) => updateTransform(w.id, constrainToLayout(w, snapLayoutTransform(w, patch)))}
                onFront={() => bringToFront(w.id)}
                onBack={w.type === 'panel' ? () => sendToBack(w.id) : undefined}
                onRemove={() => removeWidget(w.id)}
              />
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
                    onPointerDown={(e) => e.stopPropagation()}
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
                      onPointerDown={(e) => e.stopPropagation()}
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

        {/* full-cover capture surface for "Dibujar tubería" — sits above
            every widget (z-30) so a stroke can be drawn anywhere without
            accidentally grabbing/dragging a piece underneath it */}
        {editMode && drawMode && (
          <div
            className="absolute inset-0 z-30 touch-none select-none cursor-crosshair"
            onPointerDown={handleDrawPointerDown}
            onPointerMove={handleDrawPointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={cancelActiveStroke}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {/* reference line for the "auto-level" snap — appears the
                  instant the segment being drawn locks its height/width to
                  an earlier one in this same stroke (see
                  findAlignmentGuide), so leveling is visible as it happens
                  instead of only checkable after accepting */}
              {guideLine?.axis === 'y' && (
                <line x1={-2000} y1={guideLine.value} x2={4000} y2={guideLine.value} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />
              )}
              {guideLine?.axis === 'x' && (
                <line x1={guideLine.value} y1={-2000} x2={guideLine.value} y2={4000} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />
              )}
              {strokePoints.length > 1 && (
                <polyline
                  points={strokePoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        )}

        {/* ghost preview of the piece chain sketchToPipes.js computed from
            the last stroke — shown until the user accepts or cancels it */}
        {pendingPieces && (
          <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
            {pendingPieces.map((p, i) => (
              <rect
                key={i}
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx="4"
                transform={`rotate(${p.rotation} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
                fill="rgba(37,99,235,0.14)"
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
