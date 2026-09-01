import PumpWidget from './widgets/PumpWidget.jsx'
import TankWidget from './widgets/TankWidget.jsx'
import LevelBarWidget from './widgets/LevelBarWidget.jsx'
import ModeSelectWidget from './widgets/ModeSelectWidget.jsx'
import PipeStraightWidget from './widgets/PipeStraightWidget.jsx'
import PipeElbowWidget from './widgets/PipeElbowWidget.jsx'
import PipeTeeWidget from './widgets/PipeTeeWidget.jsx'
import PipeTeeUpWidget from './widgets/PipeTeeUpWidget.jsx'
import LevelHistoryWidget from './widgets/LevelHistoryWidget.jsx'
import PanelWidget from './widgets/PanelWidget.jsx'
import SectionHeaderWidget from './widgets/SectionHeaderWidget.jsx'
import DividerWidget from './widgets/DividerWidget.jsx'
import OperationsSummaryWidget from './widgets/OperationsSummaryWidget.jsx'
import SetpointWidget from './widgets/SetpointWidget.jsx'
import HistoryTableWidget from './widgets/HistoryTableWidget.jsx'
import {
  IconPump,
  IconTank,
  IconBars,
  IconToggle,
  IconPipeStraight,
  IconPipeElbow,
  IconPipeTee,
  IconPipeTeeUp,
  IconHistory,
  IconSquare,
  IconHeading,
  IconDivider,
  IconActivity,
  IconGauge,
  IconTable,
} from '../../icons.jsx'

// Single source of truth for every placeable widget: how it renders, its
// default footprint, and how it can be resized/rotated on the canvas.
//
// `ports` (optional) describes connection points for the pipe-chain "+"
// builder: fx/fy are fractions (0..1) of the widget's own w/h at rotation 0,
// and `dir` is the direction pipe extends outward from that port (degrees,
// 0 = east, 90 = south, 180 = west, 270 = north). Port index 0 is always
// treated as the "entry" side when a new piece is attached onto it.
//
// Every pipe piece (straight, elbow, tee) shares one drawing system so
// chained pieces line up exactly: a 16-unit tube diameter and a 24-unit
// flange span, with each flange drawn flush against its own viewBox edge
// at the same fx/fy the port declares. The straight pipe's viewBox height
// (24) matches its fixed rendered height exactly — no vertical squish —
// and the elbow/tee use a square 72x72 viewBox at 1:1 scale, so all three
// read as the same pipe thickness regardless of length or rotation.
export const WIDGET_REGISTRY = {
  pump: {
    label: 'Bomba',
    icon: IconPump,
    Component: PumpWidget,
    defaultConfig: { pumpId: 'p1' },
    // fixed size, not resizable — PumpWidget is a fixed-content card, not
    // a stretchable drawing like the tank's SVG, and the flanged inlet
    // stub at its bottom needs a stable box height for its port fraction
    // to always land on the same real pixel position (see PumpWidget.jsx)
    defaultSize: { w: 190, h: 212 },
    minW: 150,
    minH: 212,
    resizeAxis: 'none',
    rotatable: false,
    bare: true,
    // inlet flange at the bottom-center, flush with the widget's own
    // bottom edge — PumpWidget bottom-anchors the card + flange stack in
    // its box (see its own comment), so fy: 1 always lands right on the
    // flange's own bottom edge, same as the tank's outlet port.
    ports: [{ fx: 0.5, fy: 1, dir: 90 }],
  },
  tank: {
    label: 'Tanque de nivel',
    icon: IconTank,
    Component: TankWidget,
    defaultConfig: {},
    // matches TankVisual's own viewBox (220x300) exactly at the default
    // size, so there's no letterboxing and the outlet port below lines up
    // pixel-for-pixel; resizing non-proportionally can still shift it
    // slightly, a small manual nudge in that case is normal.
    defaultSize: { w: 220, h: 300 },
    minW: 140,
    minH: 190,
    resizeAxis: 'both',
    rotatable: false,
    // bare (no WidgetShell card padding/header) so the SVG fills the
    // widget's box exactly edge-to-edge — the tank draws its own
    // card-style background instead. This is what keeps the outlet port
    // fraction below pixel-accurate: with a padded card, the port math
    // would land inside the padding instead of on the actual flange.
    bare: true,
    // outlet flange at the bottom-center of the tank drawing, flush with
    // its bottom edge (see TankVisual.jsx's outlet flange rect)
    ports: [{ fx: 0.5, fy: 284 / 300, dir: 90 }],
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
  setpoint: {
    label: 'Setpoint de nivel',
    icon: IconGauge,
    Component: SetpointWidget,
    defaultConfig: { key: 'start' },
    defaultSize: { w: 220, h: 150 },
    minW: 180,
    minH: 130,
    resizeAxis: 'both',
    rotatable: false,
  },
  'pipe-straight': {
    label: 'Tubería recta',
    icon: IconPipeStraight,
    Component: PipeStraightWidget,
    defaultConfig: {},
    defaultSize: { w: 140, h: 24 },
    minW: 40,
    minH: 24,
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
    defaultSize: { w: 72, h: 72 },
    minW: 56,
    minH: 56,
    resizeAxis: 'none',
    rotatable: true,
    bare: true,
    // Both openings are centered on the axes of the 72x72 box. Rotating a
    // fitting therefore cannot move one flange relative to its mirrored
    // counterpart in a U, omega or stepped run.
    ports: [
      { fx: 0.5, fy: 0, dir: 270 },
      { fx: 1, fy: 0.5, dir: 0 },
    ],
  },
  'pipe-tee': {
    label: 'Te',
    icon: IconPipeTee,
    Component: PipeTeeWidget,
    defaultConfig: {},
    defaultSize: { w: 72, h: 72 },
    minW: 56,
    minH: 56,
    resizeAxis: 'none',
    rotatable: true,
    bare: true,
    ports: [
      { fx: 0, fy: 0.5, dir: 180 },
      { fx: 1, fy: 0.5, dir: 0 },
      { fx: 0.5, fy: 1, dir: 90 },
    ],
  },
  'pipe-tee-up': {
    label: 'Te (arriba)',
    icon: IconPipeTeeUp,
    Component: PipeTeeUpWidget,
    defaultConfig: {},
    defaultSize: { w: 72, h: 72 },
    minW: 56,
    minH: 56,
    resizeAxis: 'none',
    rotatable: true,
    bare: true,
    ports: [
      { fx: 0, fy: 0.5, dir: 180 },
      { fx: 1, fy: 0.5, dir: 0 },
      { fx: 0.5, fy: 0, dir: 270 },
    ],
  },
  levelhistory: {
    label: 'Histórico de nivel',
    icon: IconHistory,
    Component: LevelHistoryWidget,
    defaultConfig: {},
    defaultSize: { w: 720, h: 380 },
    minW: 480,
    minH: 280,
    resizeAxis: 'both',
    rotatable: false,
    bare: true,
  },
  'history-table': {
    label: 'Tabla de históricos',
    icon: IconTable,
    Component: HistoryTableWidget,
    defaultConfig: {},
    defaultSize: { w: 460, h: 280 },
    minW: 280,
    minH: 200,
    resizeAxis: 'both',
    rotatable: false,
    bare: true,
  },
  panel: {
    label: 'Panel en blanco',
    icon: IconSquare,
    Component: PanelWidget,
    defaultConfig: {},
    defaultSize: { w: 280, h: 420 },
    minW: 160,
    minH: 160,
    resizeAxis: 'both',
    rotatable: false,
  },
  'section-header': {
    label: 'Encabezado de sección',
    icon: IconHeading,
    Component: SectionHeaderWidget,
    defaultConfig: {
      eyebrow: 'OPERACIÓN',
      title: 'Vista general del sistema',
      subtitle: 'Estado hidráulico y equipos en tiempo real',
    },
    defaultSize: { w: 620, h: 92 },
    minW: 320,
    minH: 92,
    resizeAxis: 'width',
    rotatable: false,
    bare: true,
  },
  divider: {
    label: 'Divisor con etiqueta',
    icon: IconDivider,
    Component: DividerWidget,
    defaultConfig: { label: 'SECCIÓN' },
    defaultSize: { w: 520, h: 34 },
    minW: 220,
    minH: 34,
    resizeAxis: 'width',
    rotatable: false,
    bare: true,
  },
  'operations-summary': {
    label: 'Resumen operativo',
    icon: IconActivity,
    Component: OperationsSummaryWidget,
    defaultConfig: {},
    defaultSize: { w: 820, h: 150 },
    minW: 650,
    minH: 140,
    resizeAxis: 'both',
    rotatable: false,
    bare: true,
  },
}

const GROUP_BY_TYPE = {
  pump: 'Proceso',
  tank: 'Proceso',
  levelbar: 'Proceso',
  modeselect: 'Proceso',
  setpoint: 'Proceso',
  'pipe-straight': 'Tubería',
  'pipe-elbow': 'Tubería',
  'pipe-tee': 'Tubería',
  'pipe-tee-up': 'Tubería',
  levelhistory: 'Información',
  'history-table': 'Información',
  'operations-summary': 'Información',
  panel: 'Estructura',
  'section-header': 'Estructura',
  divider: 'Estructura',
}

export const WIDGET_CATALOG = Object.entries(WIDGET_REGISTRY).map(([type, def]) => ({
  type,
  label: def.label,
  icon: def.icon,
  group: GROUP_BY_TYPE[type] ?? 'Otros',
}))
