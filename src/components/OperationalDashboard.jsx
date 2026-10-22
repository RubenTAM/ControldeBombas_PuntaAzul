import { useEffect, useMemo, useRef, useState } from 'react'
import LevelHistoryChart from './LevelHistoryChart.jsx'
import SetpointWidget from './canvas/widgets/SetpointWidget.jsx'
import HistoryTableWidget from './canvas/widgets/HistoryTableWidget.jsx'
import pumpPhoto from '../assets/pump-photo.png'
import { IconActivity, IconAlertTriangle, IconDroplet, IconGauge, IconHistory, IconPump, IconWifi } from '../icons.jsx'

const cx = (...classes) => classes.filter(Boolean).join(' ')
const PLC_ACTIVITY_WINDOW_MS = 2 * 60 * 1000

function lastRecordedChange(history = []) {
  for (let index = history.length - 1; index > 0; index -= 1) {
    if (Math.abs(Number(history[index].level) - Number(history[index - 1].level)) >= 0.01) return Number(history[index].t)
  }
  return null
}

function usePlcActivity(broker, topic) {
  const sample = broker.topicValues?.[topic]
  const history = broker.topicHistory?.[topic]
  const previousValue = useRef()
  const [lastChangedAt, setLastChangedAt] = useState(() => lastRecordedChange(history))
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const value = Number(sample?.value)
    if (!Number.isFinite(value)) return
    if (previousValue.current !== undefined && Math.abs(value - previousValue.current) >= 0.01) {
      setLastChangedAt(Number(sample.receivedAt) || Date.now())
    } else if (previousValue.current === undefined) {
      const recorded = lastRecordedChange(history)
      if (recorded) setLastChangedAt(recorded)
    }
    previousValue.current = value
  }, [sample?.value, sample?.receivedAt, history])

  return useMemo(() => {
    if (broker.status !== 'connected' || !sample) return { value: 'Sin enlace', detail: `Sin datos de ${topic}`, tone: 'critical', active: false }
    if (!lastChangedAt) return { value: 'Sin variación', detail: `Esperando cambio en ${topic}`, tone: 'warning', active: false }
    const age = Math.max(0, now - lastChangedAt)
    if (age <= PLC_ACTIVITY_WINDOW_MS) {
      const seconds = Math.floor(age / 1000)
      return { value: 'Activo', detail: seconds < 5 ? `${topic} cambiando ahora` : `Último cambio hace ${seconds}s`, tone: 'good', active: true }
    }
    return { value: 'Sin actividad', detail: `Sin cambios por ${Math.floor(age / 60_000)} min`, tone: 'critical', active: false }
  }, [broker.status, sample, lastChangedAt, now, topic])
}

function CardTitle({ eyebrow, title, detail, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-live-600">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-extrabold tracking-tight text-navy-900">{title}</h3>
        {detail && <p className="mt-0.5 text-xs text-ink-400">{detail}</p>}
      </div>
      {action}
    </div>
  )
}

function TankGauge({ tank, compact = false }) {
  const level = Number.isFinite(tank.level) ? tank.level : 0
  const state = level >= 95 ? ['Crítico', 'critical'] : level <= 15 ? ['Crítico', 'critical'] : tank.thresholds.stop > 0 && level >= tank.thresholds.stop ? ['Nivel alto', 'warning'] : tank.thresholds.start > 0 && level <= tank.thresholds.start ? ['Nivel bajo', 'warning'] : ['En rango', 'good']
  return (
    <article className={cx('tank-card relative overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-card', compact ? 'p-4' : 'p-5')}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-400">{tank.location}</p>
          <h4 className="mt-1 text-base font-extrabold text-navy-900">{tank.label}</h4>
        </div>
        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold', state[1] === 'good' ? 'bg-status-goodBg text-status-good' : state[1] === 'warning' ? 'bg-status-warningBg text-status-warning' : 'bg-status-criticalBg text-status-critical')}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> {state[0]}
        </span>
      </div>
      <div className={cx('relative z-10 flex items-center justify-center', compact ? 'mt-3' : 'mt-4')}>
        <div className={cx('tank-orb relative overflow-hidden rounded-full border-[3px] border-white bg-navy-50 shadow-[0_0_0_2px_#83a9ff,0_18px_45px_-22px_rgba(35,67,139,.75)]', compact ? 'h-36 w-36' : 'h-44 w-44')}>
          <div className="tank-liquid absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#9bbcff] via-[#658ee8] to-[#345bb2] transition-all duration-700" style={{ height: `${level}%` }}>
            <div className="tank-wave absolute -top-2 left-[-10%] h-5 w-[120%] rounded-[50%] bg-[#b9d0ff]/90" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-black tracking-tight text-navy-950 drop-shadow-[0_1px_2px_rgba(255,255,255,.8)]">{level.toFixed(0)}%</span>
            <span className="mt-1 font-mono text-[10px] font-bold text-navy-600">{tank.volume.toFixed(1)} m³</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-navy-50 px-3 py-2 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-ink-400">Arranque</p><p className="mt-0.5 font-mono text-sm font-black text-navy-800">{tank.thresholds.start}%</p></div>
        <div className="rounded-xl bg-navy-50 px-3 py-2 text-center"><p className="text-[9px] font-bold uppercase tracking-wide text-ink-400">Paro</p><p className="mt-0.5 font-mono text-sm font-black text-navy-800">{tank.thresholds.stop}%</p></div>
      </div>
    </article>
  )
}

function PumpStatus({ pump }) {
  const status = pump.fault ? 'Falla' : pump.running ? 'En marcha' : 'Detenida'
  return (
    <article className={cx('relative overflow-hidden rounded-2xl border bg-white p-4 shadow-card transition', pump.fault ? 'border-status-critical/30' : pump.running ? 'border-status-good/30' : 'border-ink-100')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-400">Equipo de bombeo</p>
          <h4 className="mt-1 text-base font-extrabold text-navy-900">{pump.label}</h4>
        </div>
        <span className={cx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase', pump.fault ? 'bg-status-criticalBg text-status-critical' : pump.running ? 'bg-status-goodBg text-status-good' : 'bg-navy-50 text-ink-400')}>
          <span className={cx('relative h-2 w-2 rounded-full bg-current', pump.running && 'after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-current')} />{status}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-50 to-white">
          <img src={pumpPhoto} alt="Bomba centrífuga" className={cx('max-h-[72px] max-w-[105px] object-contain', !pump.running && 'opacity-80 saturate-[.8]')} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-400">Selector actual</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-navy-50 p-1">
            {['MANUAL', 'OFF', 'AUTO'].map((mode) => <span key={mode} className={cx('rounded-lg px-1 py-2 text-center text-[9px] font-extrabold transition', pump.mode === mode ? 'bg-navy-600 text-white shadow-sm' : 'text-ink-400')}>{mode === 'MANUAL' ? 'MAN' : mode}</span>)}
          </div>
          <p className="mt-2 text-[10px] text-ink-400">{pump.fault ? 'Requiere revisión del operador' : pump.running ? 'Motor energizado y operando' : 'Equipo disponible en espera'}</p>
        </div>
      </div>
    </article>
  )
}

function ProcessLine({ tanks, pumps }) {
  const running = pumps.some((pump) => pump.running)
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-card backdrop-blur sm:p-5">
      <CardTitle eyebrow="Proceso en tiempo real" title="Sistema de bombeo Punta Azul" detail="Captación, impulsión y almacenamiento" action={<span className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide', running ? 'bg-status-goodBg text-status-good' : 'bg-navy-50 text-ink-400')}><span className={cx('h-2 w-2 rounded-full', running ? 'bg-status-good animate-pulse' : 'bg-ink-300')} />{running ? 'Flujo activo' : 'En espera'}</span>} />
      <div className="relative mt-5 grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,1.25fr)_minmax(220px,1fr)] lg:items-center">
        <TankGauge tank={tanks.carcamo} compact />
        <div className="relative grid gap-3 sm:grid-cols-2 lg:block lg:min-h-[350px]">
          <div className="process-pipe absolute left-[-11%] right-[-11%] top-1/2 hidden h-3 -translate-y-1/2 rounded-full lg:block" />
          <div className="relative z-10 grid gap-3 lg:absolute lg:inset-x-3 lg:top-1/2 lg:-translate-y-1/2 lg:grid-cols-2">
            {pumps.map((pump) => <PumpStatus key={pump.id} pump={pump} />)}
          </div>
        </div>
        <TankGauge tank={tanks.superior} compact />
      </div>
    </section>
  )
}

function SetpointCard({ tank, point }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
      <SetpointWidget telemetry={tank.setpoints[point]} config={{ key: point, tankLabel: tank.label }} />
    </div>
  )
}

function SummaryTile({ icon: Icon, label, value, detail, tone = 'navy', pulse = false }) {
  const tones = { navy: 'bg-navy-100 text-navy-600', good: 'bg-status-goodBg text-status-good', warning: 'bg-status-warningBg text-status-warning', critical: 'bg-status-criticalBg text-status-critical', live: 'bg-live-100 text-live-600' }
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card">
      <span className={cx('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tones[tone])}><Icon className="h-5 w-5" />{pulse && <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-ping rounded-full bg-current opacity-50" />}</span>
      <div className="min-w-0"><p className="truncate text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-400">{label}</p><p className="mt-0.5 truncate font-mono text-xl font-black text-navy-900">{value}</p><p className="truncate text-[10px] text-ink-400">{detail}</p></div>
    </article>
  )
}

export function DashboardOverview({ model, broker, alarmCount }) {
  const running = model.pumps.filter((pump) => pump.running).length
  const faults = model.pumps.filter((pump) => pump.fault).length
  const carcamoPlc = usePlcActivity(broker, 'PACarcamo_Real_5')
  const tanquePlc = usePlcActivity(broker, 'PATanque_Real_1')
  return (
    <div className="space-y-5 pb-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile icon={IconWifi} label="PLC · Cárcamo" value={carcamoPlc.value} detail={carcamoPlc.detail} tone={carcamoPlc.tone} pulse={carcamoPlc.active} />
        <SummaryTile icon={IconWifi} label="PLC · Tanque superior" value={tanquePlc.value} detail={tanquePlc.detail} tone={tanquePlc.tone} pulse={tanquePlc.active} />
        <SummaryTile icon={IconDroplet} label="Nivel cárcamo" value={`${model.tanks.carcamo.level.toFixed(1)}%`} detail={`${model.tanks.carcamo.volume.toFixed(1)} m³ estimados`} tone="live" />
        <SummaryTile icon={IconGauge} label="Nivel superior" value={`${model.tanks.superior.level.toFixed(1)}%`} detail={`${model.tanks.superior.volume.toFixed(1)} m³ estimados`} tone="navy" />
        <SummaryTile icon={alarmCount ? IconAlertTriangle : IconActivity} label="Estado de equipos" value={`${running} / ${model.pumps.length}`} detail={faults ? `${faults} equipo(s) con falla` : alarmCount ? `${alarmCount} alarma(s) activa(s)` : 'Sin fallas reportadas'} tone={faults || alarmCount ? 'warning' : 'good'} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,.8fr)]">
        <ProcessLine tanks={model.tanks} pumps={model.pumps} />
        <section className="rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur sm:p-5">
          <CardTitle eyebrow="Control de operación" title="Niveles de arranque y paro" detail="Cambios enviados al PLC con confirmación" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            <SetpointCard tank={model.tanks.superior} point="start" />
            <SetpointCard tank={model.tanks.superior} point="stop" />
            <SetpointCard tank={model.tanks.carcamo} point="start" />
            <SetpointCard tank={model.tanks.carcamo} point="stop" />
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <CardTitle eyebrow="Tendencias" title="Lecturas recientes" detail="Histórico recibido y almacenado por MQTT" />
          <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-ink-400 shadow-sm sm:inline-flex"><IconHistory className="h-4 w-4" /> Muestreo cada 10 min</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="h-[390px]"><LevelHistoryChart telemetry={model.tanks.carcamo.telemetry} config={{ title: 'Nivel del tanque cárcamo', subtitle: 'Captación · lectura PACarcamo_Real_5' }} /></div>
          <div className="h-[390px]"><LevelHistoryChart telemetry={model.tanks.superior.telemetry} config={{ title: 'Nivel del tanque superior', subtitle: 'Distribución · lectura PATanque_Real_1' }} /></div>
        </div>
      </section>
    </div>
  )
}

function HistoryPanel({ tank }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
      <div className="h-[480px]"><LevelHistoryChart telemetry={tank.telemetry} config={{ title: `Histórico de ${tank.label.toLowerCase()}`, subtitle: `${tank.location} · siete días disponibles` }} /></div>
      <div className="h-[480px]"><HistoryTableWidget telemetry={tank.telemetry} config={{ eyebrow: tank.location, title: 'Registro de lecturas' }} /></div>
    </section>
  )
}

export function HistoryPage({ model }) {
  return (
    <div className="space-y-5 pb-8">
      <div className="rounded-[28px] bg-gradient-to-r from-navy-800 via-navy-700 to-navy-500 p-5 text-white shadow-pop sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-live-300">Análisis histórico</p><h2 className="mt-1 text-2xl font-black tracking-tight">Comportamiento de niveles</h2><p className="mt-1 text-sm text-navy-200">Consulta visual y registro detallado de ambos tanques.</p></div>
          <div className="flex gap-2"><span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Cárcamo · {model.tanks.carcamo.history.length} lecturas</span><span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Superior · {model.tanks.superior.history.length} lecturas</span></div>
        </div>
      </div>
      <HistoryPanel tank={model.tanks.carcamo} />
      <HistoryPanel tank={model.tanks.superior} />
    </div>
  )
}
