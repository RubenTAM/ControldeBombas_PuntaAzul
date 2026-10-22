import test from 'node:test'
import assert from 'node:assert/strict'
import { freshBoolean, plcIsConnected } from './telemetryModel.js'

test('a fresh numeric zero stops the pump', () => {
  assert.deepEqual(freshBoolean({ value: 0, receivedAt: 1_000 }, 1_500), { value: false, known: true })
})

test('a fresh numeric one runs the pump', () => {
  assert.deepEqual(freshBoolean({ value: 1, receivedAt: 1_000 }, 1_500), { value: true, known: true })
})

test('an expired running value is never kept as running', () => {
  assert.deepEqual(freshBoolean({ value: 1, receivedAt: 1_000 }, 121_001), { value: false, known: false })
})

test('a PLC is connected when its level changed recently', () => {
  const history = [{ t: 1_000, level: 40 }, { t: 2_000, level: 41 }]
  assert.equal(plcIsConnected(history, 'connected', 2_500), true)
})

test('a PLC is disconnected when fresh samples stay unchanged', () => {
  const history = [{ t: 1_000, level: 40 }, { t: 2_000, level: 41 }, { t: 122_001, level: 41 }]
  assert.equal(plcIsConnected(history, 'connected', 122_500), false)
})

test('a PLC is disconnected when the broker is offline', () => {
  const history = [{ t: 1_000, level: 40 }, { t: 2_000, level: 41 }]
  assert.equal(plcIsConnected(history, 'disconnected', 2_500), false)
})
