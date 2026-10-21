import { useCallback, useMemo, useState } from 'react'

const TANK_CAPACITY_M3 = 18.5
const HH_LIMIT = 95
const LL_LIMIT = 15

const initialPumps = {
  p1: { id: 'p1', label: 'Bomba 1', running: false, fault: false, hours: 0, mode: 'OFF' },
  p2: { id: 'p2', label: 'Bomba 2', running: false, fault: false, hours: 0, mode: 'OFF' },
}

// Base model only. Real values are overlaid per widget by DashboardCanvas;
// there is intentionally no demo generator or synthetic history anymore.
export function useTelemetry() {
  const [thresholds, setThresholds] = useState({ start: 0, stop: 0 })
  const [alarms, setAlarms] = useState([])

  const setThreshold = useCallback((key, value) => {
    setThresholds((current) => ({ ...current, [key]: Number(value) }))
  }, [])
  const acknowledgeAlarm = useCallback((id) => {
    setAlarms((current) => current.map((alarm) => alarm.id === id ? { ...alarm, acknowledged: true } : alarm))
  }, [])
  const acknowledgeAll = useCallback(() => {
    setAlarms((current) => current.map((alarm) => ({ ...alarm, acknowledged: true })))
  }, [])
  const activeAlarms = useMemo(() => alarms.filter((alarm) => !alarm.acknowledged), [alarms])

  return {
    level: 0,
    volume: 0,
    capacity: TANK_CAPACITY_M3,
    limits: { hh: HH_LIMIT, ll: LL_LIMIT },
    thresholds,
    setThreshold,
    pumps: initialPumps,
    setPumpRunning: () => {},
    setPumpMode: () => {},
    alarms,
    activeAlarms,
    acknowledgeAlarm,
    acknowledgeAll,
    connected: false,
    now: Date.now(),
    history: [],
    flowSimEnabled: false,
    toggleFlowSim: () => {},
    flowAnimating: false,
  }
}
