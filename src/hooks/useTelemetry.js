import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Simulated telemetry engine for the pumping-station dashboard.
// No backend yet — this stands in for the future LOGO!/MQTT feed so the
// visualization and controls can be demoed end-to-end.
// ---------------------------------------------------------------------------

const TANK_CAPACITY_M3 = 18.5
const HH_LIMIT = 95 // fixed high-high alarm
const LL_LIMIT = 15 // fixed low-low alarm
const TICK_MS = 1400

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

const initialPumps = {
  p1: { id: 'p1', label: 'Bomba 1', running: true, fault: false, hours: 128.6 },
  p2: { id: 'p2', label: 'Bomba 2', running: false, fault: false, hours: 96.3 },
}

export function useTelemetry() {
  const [level, setLevel] = useState(73)
  const [thresholds, setThresholds] = useState({ start: 40, stop: 85 })
  const [controlMode, setControlMode] = useState('AUTO') // AUTO | MANUAL
  const [leadPump, setLeadPump] = useState('p1')
  const [alternation, setAlternation] = useState(true)
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

  const historyRef = useRef(buildSeries(144, 24 * 3_600_000, Date.now()))
  const [history, setHistory] = useState(historyRef.current)
  const cycleRef = useRef({ startedBy: 'p1' })

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

  const pushAlarm = useCallback((partial) => {
    setAlarms((prev) => [
      { id: nextId(), time: Date.now(), acknowledged: false, ...partial },
      ...prev,
    ].slice(0, 40))
  }, [])

  const crossedHH = useRef(false)
  const crossedLL = useRef(false)

  // keep the alternation cycle in sync with whichever pump the operator
  // just picked as lead, so the selector always reflects who starts next
  useEffect(() => {
    cycleRef.current.startedBy = leadPump
  }, [leadPump])

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

  // automatic start/stop control loop + running-hours accrual
  useEffect(() => {
    if (controlMode !== 'AUTO') return
    if (level <= thresholds.start) {
      setPumps((prev) => {
        const lead = alternation ? cycleRef.current.startedBy : leadPump
        if (prev[lead].running) return prev
        return { ...prev, [lead]: { ...prev[lead], running: true } }
      })
    } else if (level >= thresholds.stop) {
      setPumps((prev) => {
        if (!prev.p1.running && !prev.p2.running) return prev
        if (alternation) {
          cycleRef.current.startedBy = cycleRef.current.startedBy === 'p1' ? 'p2' : 'p1'
        }
        return {
          p1: { ...prev.p1, running: false },
          p2: { ...prev.p2, running: false },
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, controlMode, thresholds.start, thresholds.stop, alternation])

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

  return {
    level,
    volume,
    capacity: TANK_CAPACITY_M3,
    limits: { hh: HH_LIMIT, ll: LL_LIMIT },
    thresholds,
    setThreshold,
    controlMode,
    setControlMode,
    leadPump,
    setLeadPump,
    alternation,
    setAlternation,
    pumps,
    setPumpRunning,
    alarms,
    activeAlarms,
    acknowledgeAlarm,
    acknowledgeAll,
    connected,
    now,
    history,
  }
}
