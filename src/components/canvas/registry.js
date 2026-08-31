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
//
// `ports` (optional) describes connection points for the pipe-chain "+"
// builder: fx/fy are fractions (0..1) of the widget's own w/h at rotation 0,
// and `dir` is the direction pipe extends outward from that port (degrees,
// 0 = east, 90 = south, 180 = west, 270 = north). Port index 0 is always
// treated as the "entry" side when a new piece is attached onto it.
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
    // outlet flange at the bottom-center of the tank drawing — approximate
    // (the SVG can letterbox a little at very different aspect ratios), a
    // small manual nudge after resizing the tank is normal.
    ports: [{ fx: 0.5, fy: 0.87, dir: 90 }],
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
    bare: true,
    ports: [
      { fx: 0, fy: 0.5, dir: 180 },
      { fx: 1, fy: 0.5, dir: 0 },
    ],
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
    bare: true,
    // top opening, then right opening (matches PipeElbowWidget's drawing)
    ports: [
      { fx: 28 / 60, fy: 0, dir: 270 },
      { fx: 1, fy: 28 / 60, dir: 0 },
    ],
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
    bare: true,
    ports: [
      { fx: 0, fy: 0.5, dir: 180 },
      { fx: 1, fy: 0.5, dir: 0 },
      { fx: 0.5, fy: 1, dir: 90 },
    ],
  },
}

export const WIDGET_CATALOG = Object.entries(WIDGET_REGISTRY).map(([type, def]) => ({
  type,
  label: def.label,
  icon: def.icon,
}))
