import { useId } from 'react'
import { IconAlertTriangle } from '../icons.jsx'
import pumpPhoto from '../assets/pump-photo.png'

// Equipment art dimensions: the photo itself, fit to the card's own 142px
// width (never cropped/overflowed — CARD_WIDTH in PumpWidget.jsx is what
// this has to match) at its native aspect ratio, so nothing is stretched
// or sliced off. 104.2 = 142 * (photo's own height/width ratio). PNG (not
// JPEG) because this version has a real alpha-cut background — no more
// white box around the pump's silhouette, it just sits on the card.
const EQUIPMENT_W = 142
const EQUIPMENT_H = 104.2

function PumpEquipment({ running, fault }) {
  const uid = useId().replace(/:/g, '')
  const glowId = `pump-glow-${uid}`
  const alarmId = `pump-alarm-${uid}`

  return (
    <svg
      viewBox={`0 0 ${EQUIPMENT_W} ${EQUIPMENT_H}`}
      className="h-[104.2px] w-[142px] overflow-visible"
      role="img"
      aria-label="Bomba centrífuga horizontal"
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={alarmId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      {/* The real pump photo, fit to the card's full width — this is what
          replaced the hand-drawn silhouette. Ports/flanges are added
          separately by PumpConnection in PumpWidget.jsx, which is tuned
          (SIDE_ROOT_X/Y, BOTTOM_ROOT_Y) to pick up right where this image's
          own base plate and body edge sit, so the drawn tube reads as a
          continuation of the photo rather than a piece floating next to
          it. */}
      <image
        href={pumpPhoto}
        x="0"
        y="0"
        width={EQUIPMENT_W}
        height={EQUIPMENT_H}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* A fault tints the whole equipment photo red instead of the old
          hand-drawn body's own gradient swap — a photo can't recolor a
          single shape, so this is a soft translucent wash over all of it,
          same "something's wrong here" read at a glance. */}
      {fault && <rect x="0" y="0" width={EQUIPMENT_W} height={EQUIPMENT_H} fill={`url(#${alarmId})`} opacity="0.4" />}

      {/* Same discreet "equipment energized" indicator as before, now
          placed over the motor's terminal box in the photo. */}
      <circle cx="96" cy="11" r="3.5" fill={fault ? '#ef4444' : running ? '#22c55e' : '#94a3b8'} filter={running || fault ? `url(#${glowId})` : undefined} />
    </svg>
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
