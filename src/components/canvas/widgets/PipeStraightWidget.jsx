// Straight pipe run — purely visual/structural for now (no MQTT binding).
// Resizes along its own length (see registry.js resizeAxis: 'width') and
// rotates freely so it can point in any direction.
export default function PipeStraightWidget() {
  return (
    <div className="flex h-full w-full items-center">
      <div className="relative h-3.5 w-full rounded-full bg-ink-300 ring-1 ring-ink-400/50">
        <div className="absolute inset-x-1 top-0.5 h-[3px] rounded-full bg-white/40" />
      </div>
    </div>
  )
}
