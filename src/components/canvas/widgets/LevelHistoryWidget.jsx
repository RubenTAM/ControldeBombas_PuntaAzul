import LevelHistoryChart from '../../LevelHistoryChart.jsx'

export default function LevelHistoryWidget({ telemetry, config, editMode, onConfigChange }) {
  return <LevelHistoryChart telemetry={telemetry} config={config} editMode={editMode} onConfigChange={onConfigChange} />
}
