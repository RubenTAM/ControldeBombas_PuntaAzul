// Keeps the metal banding continuous across a connected pipe network.
//
// Every piece has one shading "polarity": normal or reversed. Reversing a
// fitting reverses ALL of its gradients together (including the elbow ring),
// so we never repair an outer joint by introducing a seam inside the fitting.
// The polarity is solved from the actual connection graph and therefore also
// fixes runs drawn backwards, rotated later, or assembled from both ends.
import { getPortWorld, CONNECT_THRESHOLD } from './ports.js'

// Kept here instead of importing registry.js so this geometry-only module can
// be exercised directly by Node tests (registry imports React JSX widgets).
const PIPE_SHADE_META = {
  'pipe-straight': {
    ports: [
      { fx: 0, fy: 0.5, dir: 180, angle: 90 },
      { fx: 1, fy: 0.5, dir: 0, angle: 90 },
    ],
  },
  'pipe-elbow': {
    ports: [
      { fx: 0.5, fy: 0, dir: 270, angle: 180 },
      { fx: 1, fy: 0.5, dir: 0, angle: 90 },
    ],
  },
  'pipe-tee': {
    ports: [
      { fx: 0, fy: 0.5, dir: 180, angle: 90 },
      { fx: 1, fy: 0.5, dir: 0, angle: 90 },
      { fx: 0.5, fy: 1, dir: 90, angle: 0 },
    ],
  },
  'pipe-tee-up': {
    ports: [
      { fx: 0, fy: 0.5, dir: 180, angle: 90 },
      { fx: 1, fy: 0.5, dir: 0, angle: 90 },
      { fx: 0.5, fy: 0, dir: 270, angle: 0 },
    ],
  },
}

const norm360 = (degrees) => ((degrees % 360) + 360) % 360

export function computeShadeFlips(widgets) {
  const pipes = widgets.filter((widget) => PIPE_SHADE_META[widget.type])
  if (!pipes.length) return {}

  const ports = []
  pipes.forEach((widget) => {
    PIPE_SHADE_META[widget.type].ports.forEach((port, portIndex) => {
      const world = getPortWorld(widget, port)
      ports.push({
        widgetId: widget.id,
        portIndex,
        x: world.x,
        y: world.y,
        dir: world.dir,
        angle: norm360(port.angle + (widget.rotation || 0)),
      })
    })
  })

  const graph = new Map(pipes.map((widget) => [widget.id, []]))
  const claimed = new Set()

  ports.forEach((port, index) => {
    const portKey = `${port.widgetId}:${port.portIndex}`
    if (claimed.has(portKey)) return
    const neighbor = ports.find((other, otherIndex) => {
      if (otherIndex === index || other.widgetId === port.widgetId) return false
      if (claimed.has(`${other.widgetId}:${other.portIndex}`)) return false
      if (norm360(other.dir - port.dir) !== 180) return false
      return Math.hypot(other.x - port.x, other.y - port.y) < CONNECT_THRESHOLD
    })
    if (!neighbor) return

    const delta = norm360(neighbor.angle - port.angle)
    if (delta !== 0 && delta !== 180) return
    const toggle = delta === 180
    graph.get(port.widgetId).push({ id: neighbor.widgetId, toggle })
    graph.get(neighbor.widgetId).push({ id: port.widgetId, toggle })
    claimed.add(portKey)
    claimed.add(`${neighbor.widgetId}:${neighbor.portIndex}`)
  })

  const flipped = new Map()
  pipes.forEach((start) => {
    if (flipped.has(start.id)) return
    flipped.set(start.id, false)
    const queue = [start.id]
    while (queue.length) {
      const id = queue.shift()
      graph.get(id).forEach((edge) => {
        if (flipped.has(edge.id)) return
        flipped.set(edge.id, Boolean(flipped.get(id)) !== edge.toggle)
        queue.push(edge.id)
      })
    }
  })

  return Object.fromEntries(pipes.map((widget) => [widget.id, { flipped: Boolean(flipped.get(widget.id)) }]))
}
