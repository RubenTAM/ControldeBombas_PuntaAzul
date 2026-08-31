import PumpCard from '../../PumpCard.jsx'

export default function PumpWidget({ telemetry, config, onConfigChange, editMode }) {
  const pumpId = config.pumpId ?? 'p1'
  const pump = telemetry.pumps[pumpId]

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {editMode && (
        <select
          value={pumpId}
          onChange={(e) => onConfigChange({ pumpId: e.target.value })}
          className="w-full rounded-lg border border-ink-100 bg-navy-50/60 px-2 py-1.5 text-xs font-semibold text-ink-500"
        >
          <option value="p1">Bomba 1</option>
          <option value="p2">Bomba 2</option>
        </select>
      )}
      <PumpCard pump={pump} onToggle={telemetry.setPumpRunning} />
    </div>
  )
}
