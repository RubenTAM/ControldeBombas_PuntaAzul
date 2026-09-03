// Automatic metal-shading consistency across CONNECTED pipe pieces.
//
// Background: PipeStraightWidget's gradient rotates rigidly with the whole
// widget (a plain CSS transform) — turning a straight piece 180° visibly
// flips its highlight, which is deliberate: it's the user's own manual
// tool for fixing a one-off mismatch by eye, and a straight run's flanges
// are symmetric so flipping it never changes where it connects.
//
// Elbow and Te pieces are different: their rotation is decided entirely by
// how the pipe run needs to physically bend/branch (chosen by the "+"
// attach menu or the "Dibujar tubería" sketch tool), never by a person
// dragging the rotate handle — doing that would swing their ports away
// from whatever they're connected to. So for these, "just rotate it to
// fix the shading" was never actually usable, and the mismatch has to be
// fixed automatically instead: this module looks at which ports are
// actually touching (same distance rule used everywhere else — see
// CONNECT_THRESHOLD in ports.js) and decides, per elbow/Te gradient,
// whether it needs an extra 180° so its highlight lands on the same
// absolute side as whatever it's plugged into.
//
// Pure and framework-free (like sketchToPipes.js) so it's easy to unit
// test without React or a browser.
import { getPortWorld, CONNECT_THRESHOLD } from './ports.js'
import { WIDGET_REGISTRY } from './registry.js'

// For each pipe type, which gradient (by the same 'vId'/'hId' key the
// widget files use) draws the tube segment touching each port, and that
// gradient's own local vector angle — read directly off each widget's
// <linearGradient x1/y1/x2/y2> (see that file for the exact numbers this
// mirrors). Angle convention matches CSS rotate()/SVG screen space: 0°=
// pointing right (+x), 90°=down (+y), 180°=left, 270°=up, increasing
// clockwise. `flippable: false` (pipe-straight) means: use this piece's
// shading as a fixed reference when it's someone's neighbor, but never
// choose a flip for it ourselves.
const PIPE_SHADE_META = {
  'pipe-straight': {
    flippable: false,
    ports: [
      { grad: 'tube', localAngle: 90 },
      { grad: 'tube', localAngle: 90 },
    ],
  },
  'pipe-elbow': {
    flippable: true,
    // port0 = north (vId), port1 = east (hId) — see registry.js
    ports: [
      { grad: 'v', localAngle: 180 },
      { grad: 'h', localAngle: 90 },
    ],
  },
  'pipe-tee': {
    flippable: true,
    // port0 = west, port1 = east (both hId, the through-run), port2 =
    // south (vId, the branch)
    ports: [
      { grad: 'h', localAngle: 90 },
      { grad: 'h', localAngle: 90 },
      { grad: 'v', localAngle: 0 },
    ],
  },
  'pipe-tee-up': {
    flippable: true,
    ports: [
      { grad: 'h', localAngle: 90 },
      { grad: 'h', localAngle: 90 },
      { grad: 'v', localAngle: 0 },
    ],
  },
}

const norm360 = (deg) => ((deg % 360) + 360) % 360

// Absolute on-screen direction (see the angle convention above) that this
// gradient currently reads as "lit" — the side nearest its own (x1,y1),
// which is why it's localAngle+180 (the vector points AWAY from the lit
// side) before the widget's own rotation (and an optional extra 180° from
// `flip`) carries it to wherever the piece actually sits.
function highlightAngle(localAngle, rotation, flip) {
  return norm360(localAngle + 180 + rotation + (flip ? 180 : 0))
}

// widgets: the canvas's own widget list ({id, type, x, y, w, h, rotation}).
// Returns { [widgetId]: { v?: boolean, h?: boolean, tube?: boolean } } —
// only for pipe types, only for the gradient keys that type actually has,
// true meaning "add the extra 180°". Every pipe-straight entry is always
// { tube: false } (never flipped) — callers can ignore straight pieces
// entirely; it's returned mainly to make testing/inspection easier.
export function computeShadeFlips(widgets) {
  const pipeWidgets = widgets.filter((w) => PIPE_SHADE_META[w.type])
  if (pipeWidgets.length === 0) return {}

  // One entry per port: world position/direction (for matching touching
  // ports, exactly like DashboardCanvas's own `ports` memo) plus which
  // gradient/localAngle/flippability it feeds into.
  const portEntries = []
  pipeWidgets.forEach((w) => {
    const meta = PIPE_SHADE_META[w.type]
    const def = WIDGET_REGISTRY[w.type]
    def.ports.forEach((portDef, portIndex) => {
      const world = getPortWorld(w, portDef)
      const shade = meta.ports[portIndex]
      portEntries.push({
        widgetId: w.id,
        rotation: w.rotation || 0,
        flippable: meta.flippable,
        grad: shade.grad,
        localAngle: shade.localAngle,
        x: world.x,
        y: world.y,
      })
    })
  })

  // Same proximity rule as DashboardCanvas's `ports` memo (distance only —
  // two ports that close are connected in every other part of this
  // canvas too, so shading uses the identical definition).
  const neighborOf = (entry) =>
    portEntries.find(
      (o) => o.widgetId !== entry.widgetId && Math.hypot(o.x - entry.x, o.y - entry.y) < CONNECT_THRESHOLD,
    )

  const flip = {} // `${widgetId}:${grad}` -> boolean
  const flipKey = (widgetId, grad) => `${widgetId}:${grad}`
  pipeWidgets.forEach((w) => {
    const meta = PIPE_SHADE_META[w.type]
    if (!meta.flippable) return
    const grads = new Set(meta.ports.map((p) => p.grad))
    grads.forEach((g) => {
      flip[flipKey(w.id, g)] = false
    })
  })

  const currentAngleOf = (entry) => {
    const f = entry.flippable ? Boolean(flip[flipKey(entry.widgetId, entry.grad)]) : false
    return highlightAngle(entry.localAngle, entry.rotation, f)
  }

  // Multi-pass relaxation (same "run it a handful of times, let it
  // settle" shape as useCanvas.js's alignConnections): a straight run
  // never moves, so it anchors whichever elbow/Te touches it directly;
  // a chain of several elbows/Tes with no straight piece anywhere in it
  // just needs enough passes for that anchor-less agreement to spread
  // from wherever the loop happens to start being self-consistent.
  for (let pass = 0; pass < 8; pass++) {
    let changed = false
    portEntries.forEach((entry) => {
      if (!entry.flippable) return
      const neighbor = neighborOf(entry)
      if (!neighbor) return
      const key = flipKey(entry.widgetId, entry.grad)
      const mine = currentAngleOf(entry)
      const theirs = currentAngleOf(neighbor)
      if (mine === theirs) return
      // Connected ports share one physical axis, so a real mismatch is
      // always exactly 180° apart — flipping fixes it in one step. (If
      // it's ever something else, that's a geometry bug elsewhere, not
      // something this pass can fix — leave it alone rather than
      // flipping blindly.)
      if (norm360(mine - theirs) === 180) {
        flip[key] = !flip[key]
        changed = true
      }
    })
    if (!changed) break
  }

  const result = {}
  pipeWidgets.forEach((w) => {
    const meta = PIPE_SHADE_META[w.type]
    const entry = {}
    if (meta.flippable) {
      const grads = new Set(meta.ports.map((p) => p.grad))
      grads.forEach((g) => {
        entry[g] = Boolean(flip[flipKey(w.id, g)])
      })
    } else {
      entry.tube = false
    }
    result[w.id] = entry
  })
  return result
}
