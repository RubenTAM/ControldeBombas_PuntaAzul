import assert from 'node:assert/strict'
import test from 'node:test'

import { resizeDimensions } from './useTransformable.js'

test('a straight pipe can resize below the 20px canvas grid in 2px steps', () => {
  const resized = resizeDimensions({
    origW: 40,
    origH: 24,
    dxLocal: -27,
    dyLocal: 0,
    axis: 'width',
    minW: 8,
    minH: 24,
    resizeStep: 2,
  })

  assert.deepEqual(resized, { w: 14, h: 24 })
})

test('a straight pipe reaches its real 8px minimum without bouncing back to 20px', () => {
  const resized = resizeDimensions({
    origW: 20,
    origH: 24,
    dxLocal: -100,
    dyLocal: 0,
    axis: 'width',
    minW: 8,
    minH: 24,
    resizeStep: 2,
  })

  assert.deepEqual(resized, { w: 8, h: 24 })
})
