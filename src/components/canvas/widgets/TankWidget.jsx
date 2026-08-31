import TankVisual from '../../TankVisual.jsx'

export default function TankWidget({ telemetry }) {
  const { level, thresholds, limits, volume, capacity } = telemetry
  return <TankVisual level={level} thresholds={thresholds} limits={limits} volume={volume} capacity={capacity} />
}
