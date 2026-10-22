const TANKS = {
  carcamo: {
    key: 'carcamo',
    label: 'Tanque cárcamo',
    location: 'Captación',
    levelTag: 'PACarcamo_Real_5',
    capacity: 18.5,
    start: { key: 'start', writeTag: 'Real_3', feedbackTag: 'PACarcamo_Real_3' },
    stop: { key: 'stop', writeTag: 'Real_4', feedbackTag: 'PACarcamo_Real_4' },
  },
  superior: {
    key: 'superior',
    label: 'Tanque superior',
    location: 'Distribución',
    levelTag: 'PATanque_Real_1',
    capacity: 18.5,
    start: { key: 'start', writeTag: 'Real_1', feedbackTag: 'PACarcamo_Real_1' },
    stop: { key: 'stop', writeTag: 'Real_2', feedbackTag: 'PACarcamo_Real_2' },
  },
}

const PUMPS = [
  { id: 'p1', label: 'Bomba 1', offset: 0 },
  { id: 'p2', label: 'Bomba 2', offset: 5 },
]

function topicValue(broker, topic) {
  return broker?.topicValues?.[topic]?.value
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'on', 'running', 'run', 'encendida', 'encendido'].includes(normalized)) return true
  if (['0', 'false', 'off', 'stopped', 'stop', 'detenida', 'detenido'].includes(normalized)) return false
  return undefined
}

export function buildTelemetryModel(base, broker) {
  const tanks = Object.fromEntries(Object.values(TANKS).map((definition) => {
    const rawLevel = Number(topicValue(broker, definition.levelTag))
    const level = Number.isFinite(rawLevel) ? Math.max(0, Math.min(100, rawLevel)) : 0
    const history = broker?.topicHistory?.[definition.levelTag] || []
    const setpoint = (meta) => {
      const raw = Number(topicValue(broker, meta.feedbackTag))
      return Number.isFinite(raw) ? raw : 0
    }
    const thresholds = { start: setpoint(definition.start), stop: setpoint(definition.stop) }
    const makeSetpointTelemetry = (meta) => ({
      ...base,
      level,
      volume: (level / 100) * definition.capacity,
      capacity: definition.capacity,
      history,
      now: broker?.topicValues?.[definition.levelTag]?.receivedAt || Date.now(),
      thresholds,
      setpointFeedbackAt: broker?.topicValues?.[meta.feedbackTag]?.receivedAt,
      setThreshold: (_key, value) => broker.publish(meta.writeTag, value),
    })
    return [definition.key, {
      ...definition,
      level,
      volume: (level / 100) * definition.capacity,
      history,
      thresholds,
      telemetry: {
        ...base,
        level,
        volume: (level / 100) * definition.capacity,
        capacity: definition.capacity,
        history,
        now: broker?.topicValues?.[definition.levelTag]?.receivedAt || Date.now(),
        thresholds,
      },
      setpoints: {
        start: makeSetpointTelemetry(definition.start),
        stop: makeSetpointTelemetry(definition.stop),
      },
    }]
  }))

  const pumps = PUMPS.map(({ id, label, offset }) => {
    const auto = asBoolean(topicValue(broker, `PACarcamo_Bool_${offset + 1}`))
    const manual = asBoolean(topicValue(broker, `PACarcamo_Bool_${offset + 2}`))
    const off = asBoolean(topicValue(broker, `PACarcamo_Bool_${offset + 3}`))
    return {
      id,
      label,
      mode: auto ? 'AUTO' : manual ? 'MANUAL' : off ? 'OFF' : 'OFF',
      running: asBoolean(topicValue(broker, `PACarcamo_Bool_${offset + 4}`)) ?? false,
      fault: asBoolean(topicValue(broker, `PACarcamo_Bool_${offset + 5}`)) ?? false,
    }
  })

  return { tanks, pumps }
}

export const TELEMETRY_TOPICS = [
  ...Object.values(TANKS).flatMap((tank) => [tank.levelTag, tank.start.feedbackTag, tank.stop.feedbackTag]),
  ...PUMPS.flatMap(({ offset }) => Array.from({ length: 5 }, (_, index) => `PACarcamo_Bool_${offset + index + 1}`)),
  'PACarcamo_Bool_11',
]
