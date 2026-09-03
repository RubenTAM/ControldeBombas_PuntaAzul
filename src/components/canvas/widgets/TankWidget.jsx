import TankVisual from '../../TankVisual.jsx'

export default function TankWidget({ telemetry, connectedTypes, config }) {
  const { level, thresholds, limits, volume, capacity, flowAnimating } = telemetry
  return (
    <TankVisual
      level={level}
      thresholds={thresholds}
      limits={limits}
      volume={volume}
      capacity={capacity}
      connectedTypes={connectedTypes}
      label={config?.label}
      editMode={false}
      flowing={flowAnimating}
    />
  )
}
