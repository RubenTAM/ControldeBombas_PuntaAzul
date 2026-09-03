import { IconLogout, IconMenu } from '../icons.jsx'

// The notifications bell used to live here (before the user menu), showing
// alarmCount as a red badge — removed for now at the operator's request; the
// alarms themselves still exist (Sidebar's Dashboard badge, AlarmsPanel), just
// not this header shortcut. Re-add a <button> with IconBell + alarmCount if
// it comes back.
export default function Header({ onMenu, user, onLogout }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-100 bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-ink-500 hover:bg-navy-50 lg:hidden">
          <IconMenu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center rounded-xl border border-ink-100 bg-white p-1 shadow-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-600 text-[11px] font-bold uppercase text-white">
            {(user?.username || 'U').slice(0, 2)}
          </span>
          <span className="hidden max-w-28 truncate px-2 text-xs font-semibold text-ink-600 sm:block">{user?.username || 'Usuario'}</span>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-ink-400 transition hover:bg-status-criticalBg hover:text-status-critical sm:px-2.5"
          >
            <IconLogout className="h-4 w-4" />
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  )
}
