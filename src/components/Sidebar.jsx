import { IconBroker, IconGrid, IconSettings, IconUsers, IconX } from '../icons.jsx'
import puntaAzulLogo from '../assets/puntaazul-logo.png'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: IconGrid },
  { key: 'broker', label: 'Broker', icon: IconBroker },
]

const FOOT = [
  { key: 'config', label: 'Configuración', icon: IconSettings },
  { key: 'usuarios', label: 'Usuarios', icon: IconUsers },
]

export default function Sidebar({ active, onNavigate, alarmCount, open = false, onClose, user }) {
  const navigate = (key) => {
    onNavigate(key)
    onClose?.()
  }

  return (
    <>
      {open && <button type="button" aria-label="Cerrar navegación" onClick={onClose} className="fixed inset-0 z-40 bg-ink-900/35 backdrop-blur-[1px] lg:hidden" />}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col bg-gradient-to-b from-navy-900 to-navy-950 text-navy-100 shadow-pop transition-transform lg:static lg:z-auto lg:flex lg:translate-x-0 lg:shadow-none',
          open ? 'flex translate-x-0' : 'hidden -translate-x-full',
        ].join(' ')}
      >
        <div className="flex min-h-[92px] items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <img
            src={puntaAzulLogo}
            alt="Punta Azul Residencial & Fitness"
            className="h-auto min-w-0 flex-1 object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
          />
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-300 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Cerrar menú">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.filter((item) => user?.role === 'admin' || item.key === 'dashboard').map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={active === item.key}
              badge={item.badgeKey === 'alarms' ? alarmCount : 0}
              onClick={() => navigate(item.key)}
            />
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-3 py-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">
            Administración
          </p>
          {FOOT.filter((item) => user?.role === 'admin').map((item) => (
            <NavItem key={item.key} item={item} active={active === item.key} onClick={() => navigate(item.key)} />
          ))}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <p className="text-[11px] text-navy-400">Telemetría PuntaAzul · v0.1</p>
        </div>
      </aside>
    </>
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
