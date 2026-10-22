import LevelHistoryChart from './LevelHistoryChart.jsx'
import SetpointWidget from './canvas/widgets/SetpointWidget.jsx'
import HistoryTableWidget from './canvas/widgets/HistoryTableWidget.jsx'
import pumpPhoto from '../assets/pump-photo.png'

const cx = (...classes) => classes.filter(Boolean).join(' ')

function CardTitle({ eyebrow, title, detail, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-live-600">{eyebrow}</p>
        {title && <h3 className="mt-1 text-lg font-extrabold tracking-tight text-navy-900">{title}</h3>}
        {detail && <p className="mt-0.5 text-xs text-ink-400">{detail}</p>}
      </div>
      {action}
    </div>
  )
}

function TankGauge({ tank, compact = false }) {
  const level = Number.isFinite(tank.level) ? tank.level : 0
  return (
    <article className={cx('tank-card relative overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-card', compact ? 'p-4' : 'p-5')}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-400">{tank.location}</p>
          <h4 className="mt-1 text-base font-extrabold text-navy-900">{tank.label}</h4>
        </div>
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
  const status = !pump.runningKnown ? 'Sin señal' : pump.fault ? 'Falla' : pump.running ? 'En marcha' : 'Detenida'
  return (
    <article className={cx('relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border bg-white p-5 shadow-card transition', !pump.runningKnown ? 'border-status-warning/30' : pump.fault ? 'border-status-critical/30' : pump.running ? 'border-status-good/30' : 'border-ink-100')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-400">Equipo de bombeo</p>
          <h4 className="mt-1 text-base font-extrabold text-navy-900">{pump.label}</h4>
        </div>
        <span className={cx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase', !pump.runningKnown ? 'bg-status-warningBg text-status-warning' : pump.fault ? 'bg-status-criticalBg text-status-critical' : pump.running ? 'bg-status-goodBg text-status-good' : 'bg-navy-50 text-ink-400')}>
          <span className={cx('relative h-2 w-2 rounded-full bg-current', pump.running && 'after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-current')} />{status}
        </span>
      </div>
      <div className="mt-4 flex min-h-[132px] items-center justify-center rounded-2xl bg-gradient-to-br from-navy-50/80 via-white to-live-100/30 px-4 py-3">
        <img src={pumpPhoto} alt="Bomba centrífuga" className={cx('max-h-[118px] w-auto max-w-[190px] object-contain', !pump.running && 'opacity-80 saturate-[.8]')} />
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-400">Selector actual</p>
          <p className="truncate text-[10px] font-semibold text-ink-400">{!pump.runningKnown ? 'Lectura digital no recibida' : pump.fault ? 'Requiere revisión' : pump.running ? 'Motor operando' : 'Equipo en espera'}</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-navy-50 p-1.5">
          {['MANUAL', 'OFF', 'AUTO'].map((mode) => <span key={mode} className={cx('rounded-lg px-2 py-2.5 text-center text-[10px] font-extrabold transition', pump.mode === mode ? 'bg-navy-600 text-white shadow-sm' : 'text-ink-400')}>{mode === 'MANUAL' ? 'MAN' : mode}</span>)}
        </div>
      </div>
    </article>
  )
}

function FlowConnector() {
  return (
    <div className="flex items-center justify-center py-1 xl:py-0">
      <span className="hidden h-3 w-full rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-200 shadow-sm xl:block" />
      <span className="h-10 w-2.5 rounded-full bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200 shadow-sm xl:hidden" />
    </div>
  )
}

function ProcessLine({ tanks, pumps }) {
  const running = pumps.some((pump) => pump.running)
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-card backdrop-blur sm:p-6">
      <CardTitle eyebrow="Proceso en tiempo real" action={<span className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide', running ? 'bg-status-goodBg text-status-good' : 'bg-navy-50 text-ink-400')}><span className={cx('h-2 w-2 rounded-full', running ? 'bg-status-good animate-pulse' : 'bg-ink-300')} />{running ? 'Flujo activo' : 'En espera'}</span>} />
      <div className="mt-6 grid items-stretch gap-4 xl:grid-cols-[minmax(190px,.75fr)_64px_minmax(360px,1.5fr)_64px_minmax(190px,.75fr)] 2xl:grid-cols-[minmax(240px,.8fr)_90px_minmax(520px,1.7fr)_90px_minmax(240px,.8fr)]">
        <TankGauge tank={tanks.carcamo} compact />
        <FlowConnector />
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {pumps.map((pump) => <PumpStatus key={pump.id} pump={pump} />)}
        </div>
        <FlowConnector />
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

export function DashboardOverview({ model }) {
  return (
    <div className="space-y-5 pb-8">
      <ProcessLine tanks={model.tanks} pumps={model.pumps} />
      <section className="rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur sm:p-6">
        <CardTitle eyebrow="Control de operación" title="Niveles de arranque y paro" detail="Cambios enviados al PLC con confirmación" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <SetpointCard tank={model.tanks.superior} point="start" />
          <SetpointCard tank={model.tanks.superior} point="stop" />
          <SetpointCard tank={model.tanks.carcamo} point="start" />
          <SetpointCard tank={model.tanks.carcamo} point="stop" />
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
