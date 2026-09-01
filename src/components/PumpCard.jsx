import { useId } from 'react'
import { IconAlertTriangle } from '../icons.jsx'

function PumpEquipment({ running, fault, showPorts }) {
  const uid = useId().replace(/:/g, '')
  const metalId = `pump-metal-${uid}`
  const darkMetalId = `pump-dark-${uid}`
  const bodyId = `pump-body-${uid}`
  const glowId = `pump-glow-${uid}`

  return (
    <svg
      viewBox="0 0 142 124"
      className="h-[124px] w-[142px] overflow-visible"
      role="img"
      aria-label="Bomba centrífuga vertical"
    >
      <defs>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f8da0" />
          <stop offset="0.14" stopColor="#e8edf3" />
          <stop offset="0.38" stopColor="#aab5c3" />
          <stop offset="0.68" stopColor="#f7f9fc" />
          <stop offset="1" stopColor="#77869a" />
        </linearGradient>
        <linearGradient id={darkMetalId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#47566b" />
          <stop offset="1" stopColor="#1f2c40" />
        </linearGradient>
        <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fault ? '#f87171' : '#1e5fae'} />
          <stop offset="0.55" stopColor={fault ? '#dc2626' : '#123f7b'} />
          <stop offset="1" stopColor="#0b2447" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Motor vertical: conserva la silueta de la referencia, pero con
          volumen, ventilación y una lectura más industrial. */}
      <ellipse cx="71" cy="10" rx="25" ry="7" fill="#dbe3ed" stroke="#607086" strokeWidth="1.5" />
      <path d="M46 10v38c0 8 6 14 14 14h22c8 0 14-6 14-14V10" fill={`url(#${metalId})`} stroke="#607086" strokeWidth="1.5" />
      <path d="M51 14v34M59 12v43M67 12v43M75 12v43M83 12v43M91 14v34" stroke="#77869a" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <path d="M54 15v31M62 14v38M70 14v38M78 14v38M87 14v34" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".72" />
      <rect x="61" y="60" width="20" height="12" rx="2" fill={`url(#${darkMetalId})`} stroke="#26364b" />
      <rect x="55" y="68" width="32" height="7" rx="2" fill={`url(#${metalId})`} stroke="#607086" />

      {/* Cuerpo hidráulico y voluta. */}
      <path d="M35 80c0-6 5-11 11-11h48c7 0 12 5 12 12v21c0 9-7 15-16 15H51c-9 0-16-7-16-16V80Z" fill={`url(#${bodyId})`} stroke="#0b2e5b" strokeWidth="2" />
      <path d="M42 108h57" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".35" />
      <path d="M46 79h48" stroke="#6bb8ef" strokeWidth="1.5" strokeLinecap="round" opacity=".65" />

      {/* Descarga lateral y succión inferior terminan exactamente en los
          bordes de la tarjeta, donde comienzan las bridas del widget. */}
      {showPorts && (
        <>
          <path d="M104 86h38" stroke={`url(#${metalId})`} strokeWidth="16" />
          <path d="M104 86h38" stroke="#1d8ff2" strokeWidth="8" />
          <rect x="63" y="109" width="16" height="15" fill={`url(#${metalId})`} stroke="#64748b" strokeWidth="1" />
          <path d="M71 111v13" stroke="#1d8ff2" strokeWidth="8" />
        </>
      )}

      {/* Indicador discreto de equipo energizado. */}
      <circle cx="89" cy="23" r="3.5" fill={fault ? '#ef4444' : running ? '#22c55e' : '#94a3b8'} filter={running || fault ? `url(#${glowId})` : undefined} />
      <path d="M32 117h29v6H32zM81 117h29v6H81z" fill={`url(#${darkMetalId})`} />
      <path d="M43 121h18v3H43zM81 121h18v3H81z" fill="#718096" />
    </svg>
  )
}

export default function PumpCard({ pump, onToggle, showPorts = false }) {
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
        <PumpEquipment running={running} fault={pump.fault} showPorts={showPorts} />
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
