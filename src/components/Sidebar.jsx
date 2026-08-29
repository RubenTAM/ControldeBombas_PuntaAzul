import { IconGrid, IconSettings, IconUsers } from '../icons.jsx'

const NAV = [{ key: 'dashboard', label: 'Dashboard', icon: IconGrid }]

const FOOT = [
  { key: 'config', label: 'Configuración', icon: IconSettings },
  { key: 'usuarios', label: 'Usuarios', icon: IconUsers },
]

export default function Sidebar({ active, onNavigate, alarmCount }) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-gradient-to-b from-navy-900 to-navy-950 text-navy-100">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-live-500/15 ring-1 ring-live-400/40">
          <IconDroplet />
        </div>
        <div>
          <p className="font-sans text-[15px] font-bold tracking-tight text-white">PuntaAzul</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-navy-300">Control de bombeo</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={active === item.key}
            badge={item.badgeKey === 'alarms' ? alarmCount : 0}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </nav>

      <div className="border-t border-white/[0.06] px-3 py-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">
          Administración
        </p>
        {FOOT.map((item) => (
          <NavItem key={item.key} item={item} active={active === item.key} onClick={() => onNavigate(item.key)} />
        ))}
      </div>

      <div className="border-t border-white/[0.06] px-6 py-4">
        <p className="text-[11px] text-navy-400">Telemetría PuntaAzul · v0.1</p>
      </div>
    </aside>
  )
}

function NavItem({ item, active, badge, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={[
        'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-live-500/15 text-white ring-1 ring-live-400/30'
          : 'text-navy-200 hover:bg-white/[0.05] hover:text-white',
      ].join(' ')}
    >
      <span className="flex items-center gap-3">
        <Icon className={['h-[18px] w-[18px]', active ? 'text-live-300' : 'text-navy-400 group-hover:text-navy-200'].join(' ')} />
        {item.label}
      </span>
      {badge > 0 && (
        <span className="rounded-full bg-status-critical px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

function IconDroplet() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-live-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5s6.2 6.9 6.2 11.3a6.2 6.2 0 1 1-12.4 0C5.8 10.4 12 3.5 12 3.5Z" />
    </svg>
  )
}
