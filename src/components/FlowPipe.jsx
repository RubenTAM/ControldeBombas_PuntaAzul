// A horizontal pipe segment between a pump and the tank. Shows a
// directional, animated chevron flow when the pump is running, a plain
// still line otherwise.

export default function FlowPipe({ running, reverse = false }) {
  return (
    <div className="flex flex-1 items-center px-1">
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-ink-100">
        {running && (
          <div
            className="absolute inset-0 animate-flowX"
            style={{
              transform: reverse ? 'scaleX(-1)' : undefined,
              backgroundImage:
                'repeating-linear-gradient(-45deg, #0fb3cc 0 4px, transparent 4px 11px)',
              backgroundSize: '22px 100%',
            }}
          />
        )}
      </div>
    </div>
  )
}
