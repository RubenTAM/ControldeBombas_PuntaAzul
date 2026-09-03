import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Simulated telemetry engine for the pumping-station dashboard.
// No backend yet — this stands in for the future LOGO!/MQTT feed so the
// visualization and controls can be demoed end-to-end.
//
// Each pump has its OWN control mode (AUTO | MANUAL) — there is no single
// system-wide mode and no "lead pump" concept. A pump in AUTO starts/stops
// itself against the shared tank thresholds; a pump in MANUAL only moves
// when the operator toggles it.
// ---------------------------------------------------------------------------

const TANK_CAPACITY_M3 = 18.5
const HH_LIMIT = 95 // fixed high-high alarm
const LL_LIMIT = 15 // fixed low-low alarm
const TICK_MS = 1400
const PUMP_IDS = ['p1', 'p2']

let uid = 1
const nextId = () => `evt-${Date.now()}-${uid++}`

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// Deterministic-ish diurnal demand curve (higher draw at "day" hours),
// used to seed a plausible-looking historical series.
function diurnalLevel(hourFraction, seedOffset = 0) {
  const wave = Math.sin((hourFraction - 0.15) * Math.PI * 2) * 16
  const wiggle = Math.sin((hourFraction * 7 + seedOffset) * Math.PI * 2) * 5
  return clamp(68 + wave + wiggle, LL_LIMIT + 4, HH_LIMIT - 4)
}

function buildSeries(points, spanMs, endTime) {
  const out = []
  for (let i = 0; i < points; i++) {
    const t = endTime - spanMs + (i / (points - 1)) * spanMs
    const hourFraction = (t / 3_600_000) % 24 / 24
    out.push({ t, level: Math.round(diurnalLevel(hourFraction, i * 0.13) * 10) / 10 })
  }
  return out
}

const ALARM_LIBRARY = [
  { severity: 'warning', tag: 'SENSOR', message: 'Señal débil en sensor de nivel' },
  { severity: 'serious', tag: 'COMMS', message: 'Reintento de conexión MQTT' },
  { severity: 'serious', tag: 'FALLA', message: 'Sobrecorriente transitoria detectada' },
]

// Both pumps start DETENIDA. There is no real tag wired up yet (no LOGO!/
// MQTT feed), so nothing here should look "alive" until either a real tag
// is configured on a pump widget or the operator explicitly turns on
// flowSimEnabled below to preview the demo animation.
const initialPumps = {
  p1: { id: 'p1', label: 'Bomba 1', running: false, fault: false, hours: 128.6, mode: 'AUTO' },
  p2: { id: 'p2', label: 'Bomba 2', running: false, fault: false, hours: 96.3, mode: 'AUTO' },
}

export function useTelemetry() {
  const [level, setLevel] = useState(73)
  const [thresholds, setThresholds] = useState({ start: 40, stop: 85 })
  const [pumps, setPumps] = useState(initialPumps)
  const [alarms, setAlarms] = useState(() => [
    {
      id: nextId(),
      time: Date.now() - 4 * 60_000,
      severity: 'warning',
      tag: 'SENSOR',
      message: 'Señal débil en sensor de nivel',
      acknowledged: false,
    },
  ])
  const [connected, setConnected] = useState(true)
  const [now, setNow] = useState(Date.now())

  // Master switch for the demo/simulated flow effects (animated blue water
  // in the canvas pipes + the AUTO start/stop loop below). OFF by default:
  // with no real tag connected yet, nothing should start/stop or "flow" on
  // its own — an operator staring at the dashboard shouldn't see equipment
  // state flicker for no reason. Turning this ON is an explicit, temporary
  // "show me what it would look like" preview, not real telemetry.
  const [flowSimEnabled, setFlowSimEnabled] = useState(false)
  const toggleFlowSim = useCallback(() => setFlowSimEnabled((v) => !v), [])

  const historyRef = useRef(buildSeries(144, 24 * 3_600_000, Date.now()))
  const [history, setHistory] = useState(historyRef.current)

  const setThreshold = useCallback((key, value) => {
    setThresholds((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'start') next.start = clamp(value, LL_LIMIT + 2, next.stop - 5)
      if (key === 'stop') next.stop = clamp(value, next.start + 5, HH_LIMIT - 2)
      return next
    })
  }, [])

  const acknowledgeAlarm = useCallback((id) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }, [])

  const acknowledgeAll = useCallback(() => {
    setAlarms((prev) => prev.map((a) => ({ ...a, acknowledged: true })))
  }, [])

  const setPumpRunning = useCallback((id, running) => {
    setPumps((prev) => ({ ...prev, [id]: { ...prev[id], running } }))
  }, [])

  // each pump switches between AUTO and MANUAL independently of the other
  const setPumpMode = useCallback((id, mode) => {
    setPumps((prev) => ({ ...prev, [id]: { ...prev[id], mode } }))
  }, [])

  const pushAlarm = useCallback((partial) => {
    setAlarms((prev) => [
      { id: nextId(), time: Date.now(), acknowledged: false, ...partial },
      ...prev,
    ].slice(0, 40))
  }, [])

  const crossedHH = useRef(false)
  const crossedLL = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())

      setLevel((prevLevel) => {
        const anyRunning = pumps.p1.running || pumps.p2.running
        const inflow = anyRunning ? 0.75 : 0
        const demand = 0.28 + Math.random() * 0.22
        const noise = (Math.random() - 0.5) * 0.15
        let next = clamp(prevLevel + inflow - demand + noise, 4, 100)
        next = Math.round(next * 10) / 10

        if (next >= HH_LIMIT && !crossedHH.current) {
          crossedHH.current = true
          pushAlarm({ severity: 'critical', tag: 'HH', message: 'Nivel alto-alto en tanque principal' })
        } else if (next < HH_LIMIT - 3) {
          crossedHH.current = false
        }
        if (next <= LL_LIMIT && !crossedLL.current) {
          crossedLL.current = true
          pushAlarm({ severity: 'critical', tag: 'LL', message: 'Nivel bajo-bajo en tanque principal' })
        } else if (next > LL_LIMIT + 3) {
          crossedLL.current = false
        }

        setHistory((prevHist) => {
          const t = Date.now()
          const nextHist = [...prevHist, { t, level: next }]
          return nextHist.slice(-144)
        })

        return next
      })

      // occasional, sparse nuisance/status alarms for a lived-in log
      if (Math.random() < 0.035) {
        const pick = ALARM_LIBRARY[Math.floor(Math.random() * ALARM_LIBRARY.length)]
        pushAlarm(pick)
      }

      // occasional brief comms blip
      setConnected((c) => (Math.random() < 0.01 ? false : c || true))
    }, TICK_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pumps.p1.running, pumps.p2.running])

  // reconnect shortly after a simulated blip
  useEffect(() => {
    if (!connected) {
      const t = setTimeout(() => setConnected(true), 2600)
      return () => clearTimeout(t)
    }
  }, [connected])

  // automatic start/stop control loop — runs independently per pump.
  // Any pump in AUTO starts when the level drops to the arranque setpoint
  // and stops when it reaches the paro setpoint; a pump in MANUAL is left
  // alone here and only responds to the operator's button.
  //
  // Gated behind flowSimEnabled: this loop is driven by the fake tank
  // level above, not a real sensor, so without an explicit "yes, preview
  // the simulation" it must never move a pump between EN MARCHA/DETENIDA
  // on its own — that flicker with no real tag behind it is exactly what
  // reads as broken/stressful to an operator watching the screen.
  useEffect(() => {
    if (!flowSimEnabled) return
    if (level <= thresholds.start) {
      setPumps((prev) => {
        let changed = false
        const next = { ...prev }
        for (const id of PUMP_IDS) {
          if (next[id].mode === 'AUTO' && !next[id].running) {
            next[id] = { ...next[id], running: true }
            changed = true
          }
        }
        return changed ? next : prev
      })
    } else if (level >= thresholds.stop) {
      setPumps((prev) => {
        let changed = false
        const next = { ...prev }
        for (const id of PUMP_IDS) {
          if (next[id].mode === 'AUTO' && next[id].running) {
            next[id] = { ...next[id], running: false }
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [flowSimEnabled, level, thresholds.start, thresholds.stop, pumps.p1.mode, pumps.p2.mode])

  // accrue operating hours for whichever pump(s) are running
  useEffect(() => {
    const interval = setInterval(() => {
      setPumps((prev) => ({
        p1: { ...prev.p1, hours: prev.p1.running ? prev.p1.hours + TICK_MS / 3_600_000 * 40 : prev.p1.hours },
        p2: { ...prev.p2, hours: prev.p2.running ? prev.p2.hours + TICK_MS / 3_600_000 * 40 : prev.p2.hours },
      }))
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const volume = useMemo(() => Math.round((level / 100) * TANK_CAPACITY_M3 * 10) / 10, [level])
  const activeAlarms = useMemo(() => alarms.filter((a) => !a.acknowledged), [alarms])

  // Whether the canvas pipes/tank outlet should show the animated flow —
  // both conditions have to hold: the operator explicitly turned the
  // simulation preview on AND at least one pump is actually running (real
  // tag or, while flowSimEnabled, the demo loop above). This is what makes
  // "solo habrá flujo cuando las bombas estén realmente prendidas" true
  // instead of the old always-on animation that ran regardless of state.
  const pumpsRunning = useMemo(() => Object.values(pumps).some((p) => p.running), [pumps])
  const flowAnimating = flowSimEnabled && pumpsRunning

  return {
    level,
    volume,
    capacity: TANK_CAPACITY_M3,
    limits: { hh: HH_LIMIT, ll: LL_LIMIT },
    thresholds,
    setThreshold,
    pumps,
    setPumpRunning,
    setPumpMode,
    alarms,
    activeAlarms,
    acknowledgeAlarm,
    acknowledgeAll,
    connected,
    now,
    history,
    flowSimEnabled,
    toggleFlowSim,
    flowAnimating,
  }
}
