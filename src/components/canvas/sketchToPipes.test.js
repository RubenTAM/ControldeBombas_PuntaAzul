import assert from 'node:assert/strict'
import test from 'node:test'

import { getPortWorld } from './ports.js'
import { sketchToPieces } from './sketchToPipes.js'

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

test('drawn L follows the preview instead of adding the elbow size to it', () => {
  const pieces = sketchToPieces(
    [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ],
    registry,
  )

  assert.deepEqual(
    pieces.map(({ type, w }) => ({ type, w })),
    [
      { type: 'pipe-straight', w: 64 },
      { type: 'pipe-elbow', w: 72 },
      { type: 'pipe-straight', w: 64 },
    ],
  )

  const finalPiece = pieces.at(-1)
  const finalPort = getPortWorld(finalPiece, registry['pipe-straight'].ports[1])
  assert.equal(finalPort.x, 100)
  assert.equal(finalPort.y, 100)
})

test('a short segment before a bend remains short after accepting the drawing', () => {
  const pieces = sketchToPieces(
    [
      { x: 0, y: 0 },
      { x: 0, y: 52 },
      { x: 100, y: 52 },
    ],
    registry,
  )

  assert.equal(pieces[0].type, 'pipe-straight')
  assert.equal(pieces[0].w, 16)

  const finalPiece = pieces.at(-1)
  const finalPort = getPortWorld(finalPiece, registry['pipe-straight'].ports[1])
  assert.equal(finalPort.x, 100)
  assert.equal(finalPort.y, 52)
})
