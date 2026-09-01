// Hand-drawn icon set — stroke-based, 24px grid, one consistent line style.
// Kept deliberately small and bespoke instead of pulling in an icon library.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ children, className }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    {children}
  </svg>
)

export const IconGrid = ({ className }) => (
  <Svg className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
)

export const IconPump = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 7.5 8.7 14.5h6.6z" strokeLinejoin="round" />
  </Svg>
)

export const IconTank = ({ className }) => (
  <Svg className={className}>
    <rect x="6" y="3.5" width="12" height="17" rx="3" />
    <path d="M6 13.5h12" />
  </Svg>
)

export const IconHistory = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12.5" r="8" />
    <path d="M12 8v5l3.2 2" />
    <path d="M8.5 3.5 12 1.2l3.5 2.3" strokeLinecap="round" />
  </Svg>
)

export const IconBell = ({ className }) => (
  <Svg className={className}>
    <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.4 5.4 1.4 5.4H4.6S6 14.5 6 10.5Z" />
    <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
  </Svg>
)

export const IconCalendar = ({ className }) => (
  <Svg className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
  </Svg>
)

export const IconMap = ({ className }) => (
  <Svg className={className}>
    <path d="M9 4.5 4.5 6.3v13.2L9 17.7l6 2.4 4.5-1.8V5.1L15 6.9 9 4.5Z" strokeLinejoin="round" />
    <path d="M9 4.5v13.2M15 6.9v13.2" />
  </Svg>
)

export const IconSettings = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
  </Svg>
)

export const IconUsers = ({ className }) => (
  <Svg className={className}>
    <circle cx="9" cy="8.2" r="3.2" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M15.5 5.3a3.2 3.2 0 0 1 0 6.2" />
    <path d="M17 14.3c2.4.5 3.5 2.2 3.5 4.7" />
  </Svg>
)

export const IconWifi = ({ className }) => (
  <Svg className={className}>
    <path d="M4 9.5a12 12 0 0 1 16 0" />
    <path d="M7 13.2a7.5 7.5 0 0 1 10 0" />
    <path d="M10.2 16.8a3 3 0 0 1 3.6 0" />
    <circle cx="12" cy="19.3" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconClock = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7.3V12l3.3 1.9" />
  </Svg>
)

export const IconChevronDown = ({ className }) => (
  <Svg className={className}>
    <path d="M5.5 8.5 12 15l6.5-6.5" />
  </Svg>
)

export const IconCheck = ({ className }) => (
  <Svg className={className}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Svg>
)

export const IconX = ({ className }) => (
  <Svg className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconSendBack = ({ className }) => (
  <Svg className={className}>
    <rect x="6.5" y="4.5" width="12" height="10" rx="1.5" />
    <path d="M4.5 9.5v8a2 2 0 0 0 2 2h10" />
    <path d="m12 14-3 3-3-3" />
  </Svg>
)

export const IconHeading = ({ className }) => (
  <Svg className={className}>
    <path d="M5 6v12M19 6v12M5 12h14" />
    <path d="M3 4h4M17 4h4" />
  </Svg>
)

export const IconDivider = ({ className }) => (
  <Svg className={className}>
    <path d="M3 12h6M15 12h6" />
    <rect x="9" y="9.5" width="6" height="5" rx="2.5" />
  </Svg>
)

export const IconActivity = ({ className }) => (
  <Svg className={className}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </Svg>
)

export const IconPower = ({ className }) => (
  <Svg className={className}>
    <path d="M12 3.8v7.2" />
    <path d="M7.2 6.4a8 8 0 1 0 9.6 0" />
  </Svg>
)

export const IconPlay = ({ className }) => (
  <Svg className={className}>
    <path d="M7 5.2v13.6l11-6.8Z" strokeLinejoin="round" />
  </Svg>
)

export const IconSquare = ({ className }) => (
  <Svg className={className}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.8" />
  </Svg>
)

export const IconAlertTriangle = ({ className }) => (
  <Svg className={className}>
    <path d="M12 4.2 21 19.5H3Z" strokeLinejoin="round" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.6" r="0.15" fill="currentColor" />
  </Svg>
)

export const IconInfo = ({ className }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 11v5.2" />
    <circle cx="12" cy="8" r="0.15" fill="currentColor" />
  </Svg>
)

export const IconSliders = ({ className }) => (
  <Svg className={className}>
    <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h13M21 18h-0" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="18" r="2" />
  </Svg>
)

export const IconMenu = ({ className }) => (
  <Svg className={className}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </Svg>
)

export const IconArrowUpRight = ({ className }) => (
  <Svg className={className}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
)

export const IconArrowDownRight = ({ className }) => (
  <Svg className={className}>
    <path d="M7 7l10 10M17 7v10H7" />
  </Svg>
)

export const IconDroplet = ({ className }) => (
  <Svg className={className}>
    <path d="M12 3.5s6.2 6.9 6.2 11.3a6.2 6.2 0 1 1-12.4 0C5.8 10.4 12 3.5 12 3.5Z" strokeLinejoin="round" />
  </Svg>
)

export const IconRepeat = ({ className }) => (
  <Svg className={className}>
    <path d="M4.5 11a7.5 7.5 0 0 1 13-5.2l2-.3" />
    <path d="M19.5 13a7.5 7.5 0 0 1-13 5.2l-2 .3" />
    <path d="M17 4.7l1.5 1 -1 1.7M7 19.3l-1.5-1 1-1.7" />
  </Svg>
)

export const IconCrown = ({ className }) => (
  <Svg className={className}>
    <path d="M4 17.5h16M4.5 17.5 3 8.3l4.8 3.4L12 5l4.2 6.7 4.8-3.4-1.5 9.2Z" strokeLinejoin="round" />
  </Svg>
)

export const IconGrip = ({ className }) => (
  <Svg className={className}>
    <circle cx="9" cy="6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconToggle = ({ className }) => (
  <Svg className={className}>
    <rect x="3" y="7" width="18" height="10" rx="5" />
    <circle cx="15" cy="12" r="3" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconBars = ({ className }) => (
  <Svg className={className}>
    <path d="M6 20V10M12 20V4M18 20v-7" />
  </Svg>
)

export const IconLayoutBoard = ({ className }) => (
  <Svg className={className}>
    <rect x="3.5" y="4" width="17" height="16" rx="2" />
    <path d="M3.5 9.5h17" strokeDasharray="1.5 2.2" />
  </Svg>
)

export const IconPipeStraight = ({ className }) => (
  <Svg className={className}>
    <path d="M3 12h18" strokeWidth="3.2" />
  </Svg>
)

export const IconPipeElbow = ({ className }) => (
  <Svg className={className}>
    <path d="M8 3v9a4 4 0 0 0 4 4h9" strokeWidth="3.2" />
  </Svg>
)

export const IconRotate = ({ className }) => (
  <Svg className={className}>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <path d="M4 17.5V12h5.5" />
  </Svg>
)

export const IconPipeTee = ({ className }) => (
  <Svg className={className}>
    <path d="M4 7h16M12 7v13" strokeWidth="3.2" />
  </Svg>
)

export const IconPipeTeeUp = ({ className }) => (
  <Svg className={className}>
    <path d="M4 17h16M12 17V4" strokeWidth="3.2" />
  </Svg>
)

export const IconAlign = ({ className }) => (
  <Svg className={className}>
    <path d="M7 4h4v8a3 3 0 0 0 6 0V4h4v8a7 7 0 0 1-14 0Z" />
    <path d="M7 8h4M13 8h4" />
  </Svg>
)

export const IconPencil = ({ className }) => (
  <Svg className={className}>
    <path d="M4 20l1-4.5L14.5 6 18 9.5 8.5 19 4 20Z" strokeLinejoin="round" />
    <path d="M12.5 8 16 11.5" />
  </Svg>
)

export const IconGauge = ({ className }) => (
  <Svg className={className}>
    <path d="M4 16a8 8 0 0 1 16 0" />
    <path d="M12 16 16.2 10.3" />
    <circle cx="12" cy="16" r="1.15" fill="currentColor" stroke="none" />
    <path d="M4 16h1.6M18.4 16H20M6.3 9.3l1.2 1.2M17.7 9.3l-1.2 1.2" />
  </Svg>
)

export const IconTable = ({ className }) => (
  <Svg className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9.7h17M3.5 14.9h17M9.5 4.5v15" />
  </Svg>
)
