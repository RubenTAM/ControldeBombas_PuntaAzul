import test from 'node:test'
import assert from 'node:assert/strict'
import { computeShadeFlips } from './shadeSync.js'
import { buildPieces } from './sketchToPipes.js'
import { getPortWorld, CONNECT_THRESHOLD } from './ports.js'

const registry = {
  'pipe-straight': {
    defaultSize: { w: 140, h: 24 },
    minW: 8,
    ports: [
      { fx: 0, fy: 0.5, dir: 180 },
      { fx: 1, fy: 0.5, dir: 0 },
    ],
  },
  'pipe-elbow': {
    defaultSize: { w: 72, h: 72 },
    ports: [
      { fx: 0.5, fy: 0, dir: 270 },
      { fx: 1, fy: 0.5, dir: 0 },
    ],
  },
}

const shadeAngles = {
  'pipe-straight': [90, 90],
  'pipe-elbow': [180, 90],
}

const norm360 = (degrees) => ((degrees % 360) + 360) % 360

function assertEveryJointIsContinuous(widgets) {
  const flips = computeShadeFlips(widgets)
  const ports = []
  widgets.forEach((widget) => {
    registry[widget.type].ports.forEach((port, index) => {
      ports.push({
        widget,
        index,
        ...getPortWorld(widget, port),
      })
    })
  })

  let joints = 0
  ports.forEach((port, index) => {
    ports.slice(index + 1).forEach((other) => {
      if (other.widget.id === port.widget.id) return
      if (norm360(other.dir - port.dir) !== 180) return
      if (Math.hypot(other.x - port.x, other.y - port.y) >= CONNECT_THRESHOLD) return
      joints++
      const angleA = norm360(
        shadeAngles[port.widget.type][port.index] +
          (port.widget.rotation || 0) +
          (flips[port.widget.id].flipped ? 180 : 0),
      )
      const angleB = norm360(
        shadeAngles[other.widget.type][other.index] +
          (other.widget.rotation || 0) +
          (flips[other.widget.id].flipped ? 180 : 0),
      )
      assert.equal(angleA, angleB, `${port.widget.id} -> ${other.widget.id}`)
    })
  })
  assert.ok(joints > 0)
}

test('the drawn pipe shape from the report keeps one continuous metal band', () => {
  const pieces = buildPieces(
    [
      { x: 100, y: 500 },
      { x: 240, y: 500 },
      { x: 240, y: 120 },
      { x: 760, y: 120 },
    ],
    registry,
  ).map((piece, index) => ({ ...piece, id: `piece-${index}` }))

  assert.equal(pieces.filter((piece) => piece.type === 'pipe-elbow').length, 2)
  assertEveryJointIsContinuous(pieces)
})

test('a run assembled backwards is corrected without per-stub fitting flips', () => {
  const pieces = buildPieces(
    [
      { x: 760, y: 120 },
      { x: 240, y: 120 },
      { x: 240, y: 500 },
      { x: 100, y: 500 },
    ],
    registry,
  ).map((piece, index) => ({ ...piece, id: `reverse-${index}` }))

  const flips = computeShadeFlips(pieces)
  Object.values(flips).forEach((value) => assert.deepEqual(Object.keys(value), ['flipped']))
  assertEveryJointIsContinuous(pieces)
})
