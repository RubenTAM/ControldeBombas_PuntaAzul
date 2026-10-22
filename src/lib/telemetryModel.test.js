import test from 'node:test'
import assert from 'node:assert/strict'
import { freshBoolean } from './telemetryModel.js'

test('a fresh numeric zero stops the pump', () => {
  assert.deepEqual(freshBoolean({ value: 0, receivedAt: 1_000 }, 1_500), { value: false, known: true })
})

test('a fresh numeric one runs the pump', () => {
  assert.deepEqual(freshBoolean({ value: 1, receivedAt: 1_000 }, 1_500), { value: true, known: true })
})

test('an expired running value is never kept as running', () => {
  assert.deepEqual(freshBoolean({ value: 1, receivedAt: 1_000 }, 121_001), { value: false, known: false })
})
