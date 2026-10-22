import { IconGrid, IconHistory, IconSettings, IconUsers, IconX } from '../icons.jsx'
import puntaAzulLogo from '../assets/puntaazul-logo.png'

const NAV = [
  { key: 'dashboard', label: 'Operación', caption: 'Vista general', icon: IconGrid },
  { key: 'historicos', label: 'Históricos', caption: 'Gráficas y lecturas', icon: IconHistory },
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
          'fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 flex-col bg-gradient-to-b from-[#111b36] via-navy-900 to-navy-950 text-navy-100 shadow-pop transition-transform lg:static lg:z-auto lg:flex lg:translate-x-0 lg:shadow-none',
          open ? 'flex translate-x-0' : 'hidden -translate-x-full',
        ].join(' ')}
      >
        <div className="flex min-h-[112px] items-center gap-3 border-b border-white/[0.1] px-6 py-5">
          <img
            src={puntaAzulLogo}
            alt="Punta Azul Residencial & Fitness"
            className="h-auto min-w-0 flex-1 object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
          />
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-300 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Cerrar menú">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-2 px-4">
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

        <div className="border-t border-white/[0.1] px-4 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">
            Administración
          </p>
          {FOOT.filter((item) => user?.role === 'admin').map((item) => (
            <NavItem key={item.key} item={item} active={active === item.key} onClick={() => navigate(item.key)} />
          ))}
        </div>

        <div className="border-t border-white/[0.1] px-6 py-5">
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
        'group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition-all',
        active
          ? 'bg-white text-navy-900 shadow-[0_12px_28px_-14px_rgba(0,0,0,.55)]'
          : 'text-navy-200 hover:bg-white/[0.07] hover:text-white',
      ].join(' ')}
    >
      <span className="flex items-center gap-3.5">
        <span className={['flex h-10 w-10 items-center justify-center rounded-xl', active ? 'bg-navy-100 text-navy-600' : 'bg-white/[0.06] text-navy-300 group-hover:text-white'].join(' ')}><Icon className="h-[19px] w-[19px]" /></span>
        <span><span className="block">{item.label}</span>{item.caption && <span className={['mt-0.5 block text-[10px] font-medium', active ? 'text-ink-400' : 'text-navy-400'].join(' ')}>{item.caption}</span>}</span>
      </span>
      {badge > 0 && (
        <span className="rounded-full bg-status-critical px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
