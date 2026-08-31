import PumpWidget from './widgets/PumpWidget.jsx'
import TankWidget from './widgets/TankWidget.jsx'
import LevelBarWidget from './widgets/LevelBarWidget.jsx'
import ModeSelectWidget from './widgets/ModeSelectWidget.jsx'
import PipeStraightWidget from './widgets/PipeStraightWidget.jsx'
import PipeElbowWidget from './widgets/PipeElbowWidget.jsx'
import PipeTeeWidget from './widgets/PipeTeeWidget.jsx'
import { IconPump, IconTank, IconBars, IconToggle, IconPipeStraight, IconPipeElbow, IconPipeTee } from '../../icons.jsx'

// Single source of truth for every placeable widget: how it renders, its
// default footprint, and how it can be resized/rotated on the canvas.
// Adding a new widget type to the platform means adding one entry here.
export const WIDGET_REGISTRY = {
  pump: {
    label: 'Bomba',
    icon: IconPump,
    Component: PumpWidget,
    defaultConfig: { pumpId: 'p1' },
    defaultSize: { w: 190, h: 270 },
    minW: 150,
    minH: 220,
    resizeAxis: 'both',
    rotatable: false,
  },
  tank: {
    label: 'Tanque de nivel',
    icon: IconTank,
    Component: TankWidget,
    defaultConfig: {},
    defaultSize: { w: 220, h: 320 },
    minW: 140,
    minH: 200,
    resizeAxis: 'both',
    rotatable: false,
  },
  levelbar: {
    label: 'Barra de nivel',
    icon: IconBars,
    Component: LevelBarWidget,
    defaultConfig: {},
    defaultSize: { w: 160, h: 300 },
    minW: 110,
    minH: 180,
    resizeAxis: 'both',
    rotatable: false,
  },
  modeselect: {
    label: 'Selector Auto/Manual',
    icon: IconToggle,
    Component: ModeSelectWidget,
    defaultConfig: { pumpId: 'p1' },
    defaultSize: { w: 220, h: 140 },
    minW: 180,
    minH: 110,
    resizeAxis: 'both',
    rotatable: false,
  },
  'pipe-straight': {
    label: 'Tubería recta',
    icon: IconPipeStraight,
    Component: PipeStraightWidget,
    defaultConfig: {},
    defaultSize: { w: 140, h: 28 },
    minW: 40,
    minH: 20,
    resizeAxis: 'width',
    rotatable: true,
  },
  'pipe-elbow': {
    label: 'Codo 90°',
    icon: IconPipeElbow,
    Component: PipeElbowWidget,
    defaultConfig: {},
    defaultSize: { w: 60, h: 60 },
    minW: 40,
    minH: 40,
    resizeAxis: 'none',
    rotatable: true,
  },
  'pipe-tee': {
    label: 'Te',
    icon: IconPipeTee,
    Component: PipeTeeWidget,
    defaultConfig: {},
    defaultSize: { w: 64, h: 64 },
    minW: 44,
    minH: 44,
    resizeAxis: 'none',
    rotatable: true,
  },
}

export const WIDGET_CATALOG = Object.entries(WIDGET_REGISTRY).map(([type, def]) => ({
  type,
  label: def.label,
  icon: def.icon,
}))
