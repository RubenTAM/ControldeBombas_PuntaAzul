import { IconAlertTriangle } from '../icons.jsx'
import pumpHorizontalBlue from '../assets/pump-horizontal-blue.png'

function PumpEquipment({ running, fault }) {
  return (
    <div
      className="relative h-[124px] w-[142px]"
      role="img"
      aria-label="Bomba centrífuga horizontal"
    >
      <img
        src={pumpHorizontalBlue}
        alt=""
        draggable="false"
        className="absolute inset-x-0 bottom-0 h-[100px] w-[142px] origin-bottom scale-y-[0.70] select-none object-contain object-bottom"
        style={{
          filter: fault
            ? 'drop-shadow(0 0 4px rgba(239,68,68,.65))'
            : running
              ? 'drop-shadow(0 0 4px rgba(34,197,94,.38))'
              : 'drop-shadow(0 2px 2px rgba(15,35,65,.2))',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute right-2 top-5 h-2 w-2 rounded-full ring-2 ring-white/80"
        style={{ backgroundColor: fault ? '#ef4444' : running ? '#22c55e' : '#94a3b8' }}
      />
    </div>
  )
}

export default function PumpCard({ pump, onToggle }) {
  const running = pump.running
  return (
    <div
      className={[
        'relative flex h-[182px] w-[142px] flex-col items-center overflow-hidden rounded-2xl border bg-white shadow-card transition-all',
        running ? 'border-live-400/40' : 'border-ink-100',
      ].join(' ')}
    >
      <div className="relative z-10 flex w-full flex-col items-center pt-3 text-center">
        <p className="text-sm font-bold text-ink-900">{pump.label}</p>
        <div className="mt-0.5 flex items-center justify-center gap-1.5">
          <p
            className={[
              'text-[10px] font-bold tracking-wide',
              pump.fault ? 'text-status-critical' : running ? 'text-status-good' : 'text-ink-400',
            ].join(' ')}
          >
            {pump.fault ? 'FALLA' : running ? 'EN MARCHA' : 'DETENIDA'}
          </p>
          <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-navy-500">
            {pump.mode}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0">
        <PumpEquipment running={running} fault={pump.fault} />
      </div>

      {pump.mode === 'MANUAL' && (
        <button
          onClick={() => onToggle(pump.id, !running)}
          className={[
            'absolute bottom-2 left-2 z-20 rounded-md px-2 py-1 text-[9px] font-bold shadow-sm transition-colors',
            running ? 'bg-status-criticalBg text-status-critical hover:bg-status-critical/20' : 'bg-status-goodBg text-status-good hover:bg-status-good/20',
          ].join(' ')}
        >
          {running ? 'Detener' : 'Arrancar'}
        </button>
      )}

      {pump.fault && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-1 text-[9px] font-semibold text-status-critical shadow-sm">
          <IconAlertTriangle className="h-3 w-3" /> Requiere atención
        </div>
      )}
    </div>
  )
}
