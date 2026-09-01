import { IconBell, IconMenu } from '../icons.jsx'

export default function Header({ alarmCount, onMenu }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-100 bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-lg p-2 text-ink-500 hover:bg-navy-50 lg:hidden">
          <IconMenu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
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
