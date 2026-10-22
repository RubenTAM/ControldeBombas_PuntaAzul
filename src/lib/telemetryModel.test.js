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

test('a PLC is connected when its level tag was received recently', () => {
  assert.equal(plcIsConnected({ value: 40, receivedAt: 2_000 }, 'connected', 2_500), true)
})

test('a PLC remains connected when the received level value stays unchanged', () => {
  assert.equal(plcIsConnected({ value: 40, receivedAt: 122_001 }, 'connected', 122_500), true)
})

test('a PLC is disconnected when its level tag stops arriving', () => {
  assert.equal(plcIsConnected({ value: 40, receivedAt: 2_000 }, 'connected', 122_001), false)
})

test('a PLC is disconnected when the broker is offline', () => {
  assert.equal(plcIsConnected({ value: 40, receivedAt: 2_000 }, 'disconnected', 2_500), false)
})
