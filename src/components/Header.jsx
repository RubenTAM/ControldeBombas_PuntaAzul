import { useMemo } from 'react'
import { IconWifi, IconBell, IconMenu } from '../icons.jsx'

export default function Header({ connected, now, alarmCount, onMenu }) {
  const { time, date } = useMemo(() => {
    const d = new Date(now)
    return {
      time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    }
  }, [now])

  return (
    <header className="flex items-center justify-between gap-4 border-b border-ink-100 bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-ink-500 hover:bg-navy-50 lg:hidden">
          <IconMenu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-sans text-xl font-bold tracking-tight text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-400">Estación Cabo Viejo · Sistema de bombeo</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className={[
            'hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 sm:flex',
            connected
              ? 'bg-status-goodBg text-status-good ring-status-good/20'
              : 'bg-status-criticalBg text-status-critical ring-status-critical/20',
          ].join(' ')}
        >
          <IconWifi className="h-3.5 w-3.5" />
          {connected ? 'MQTT conectado' : 'Reconectando…'}
        </div>

        <div className="hidden flex-col items-end leading-tight md:flex">
          <span className="font-mono text-sm font-semibold tabular-nums text-ink-900">{time}</span>
          <span className="text-[11px] text-ink-400">{date}</span>
        </div>

        <button className="relative rounded-full border border-ink-100 bg-white p-2.5 text-ink-500 shadow-sm hover:text-navy-600">
          <IconBell className="h-[18px] w-[18px]" />
          {alarmCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-[10px] font-bold text-white ring-2 ring-white">
              {alarmCount}
            </span>
          )}
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-xs font-bold text-white">
          RL
        </div>
      </div>
    </header>
  )
}
