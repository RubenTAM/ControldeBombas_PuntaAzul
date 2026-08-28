import PumpCard from './PumpCard.jsx'
import FlowPipe from './FlowPipe.jsx'
import TankVisual from './TankVisual.jsx'

export default function SystemDiagram({ telemetry }) {
  const { pumps, setPumpRunning, controlMode, leadPump, level, thresholds, limits, volume, capacity } = telemetry

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Diagrama general</h2>
          <p className="text-xs text-ink-400">Cabo Viejo · flujo en tiempo real (simulado)</p>
        </div>
        <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-500">
          {controlMode === 'AUTO' ? 'Control automático' : 'Control manual'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 md:flex-row md:justify-center">
        <PumpCard pump={pumps.p1} isLead={leadPump === 'p1'} controlMode={controlMode} onToggle={setPumpRunning} />
        <FlowPipe running={pumps.p1.running} />
        <TankVisual level={level} thresholds={thresholds} limits={limits} volume={volume} capacity={capacity} />
        <FlowPipe running={pumps.p2.running} reverse />
        <PumpCard pump={pumps.p2} isLead={leadPump === 'p2'} controlMode={controlMode} onToggle={setPumpRunning} />
      </div>
    </section>
  )
}
