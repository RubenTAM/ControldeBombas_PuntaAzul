import { computeShadeFlips } from './shadeSync.js'
import { placeAttached, getPortWorld } from './ports.js'
import { WIDGET_REGISTRY } from './registry.js'

let failures = 0
function assertEq(actual, expected, label) {
  if (actual !== expected) {
    failures++
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`)
  } else {
    console.log(`ok   ${label}`)
  }
}

// Chain builder mirroring how the "+" menu actually places pieces: each
// new piece's port[entryPortIndex] latches onto `sourcePort`.
function attach(sourcePort, type, entryPortIndex = 0, id) {
  const def = WIDGET_REGISTRY[type]
  const placed = placeAttached(sourcePort, def.defaultSize, def.ports[entryPortIndex])
  return { id, type, ...placed }
}

function portWorld(widget, index) {
  const def = WIDGET_REGISTRY[widget.type]
  return getPortWorld(widget, def.ports[index])
}

// --- Scenario 1: reproduce the reported bug ---
// tank -> straight (down) -> elbow (turn to horizontal) i.e. a vertical
// run capped by elbows at both ends, same shape as the screenshots
// (straight vertical run between two elbows, one matching, one not,
// before this fix).
{
  const tank = { id: 'tank', type: 'tank', x: 0, y: 0, w: 220, h: 300, rotation: 0 }
  const s1 = attach(portWorld(tank, 0), 'pipe-straight', 0, 's1')
  // extend the straight run a bit further (chain 3 straight segments, as
  // a real vertical run would be) before turning the corner
  const s2 = attach(portWorld(s1, 1), 'pipe-straight', 0, 's2')
  const s3 = attach(portWorld(s2, 1), 'pipe-straight', 0, 's3')
  const elbow = attach(portWorld(s3, 1), 'pipe-elbow', 0, 'elbow1')

  const widgets = [tank, s1, s2, s3, elbow]
  const flips = computeShadeFlips(widgets)

  // The straight run is never flipped, whatever its rotation ended up as.
  assertEq(flips.s1.tube, false, 'scenario1: straight s1 never auto-flips')
  assertEq(flips.s2.tube, false, 'scenario1: straight s2 never auto-flips')
  assertEq(flips.s3.tube, false, 'scenario1: straight s3 never auto-flips')

  // Whatever flip the elbow's vertical-facing gradient ended up with, it
  // must make its highlight match s3's, at the joint they share.
  const localAngleOf = { tube: 90, v: 180, h: 90 }
  const norm360 = (d) => ((d % 360) + 360) % 360
  const highlightAngle = (localAngle, rotation, flip) => norm360(localAngle + 180 + rotation + (flip ? 180 : 0))

  const s3Angle = highlightAngle(localAngleOf.tube, s3.rotation || 0, false)
  // elbow's port0 is the one that latched onto s3 (entryPortIndex 0 above)
  // -> uses gradient 'v'
  const elbowAngle = highlightAngle(localAngleOf.v, elbow.rotation || 0, flips.elbow1.v)
  assertEq(elbowAngle, s3Angle, 'scenario1: elbow highlight matches straight neighbor at the joint')
}

// --- Scenario 2: force the exact mismatch from the screenshots ---
// pipe-straight is the one piece with real rotation freedom — 0° and
// 180° are geometrically identical (symmetric flanges, same footprint)
// but shade differently since the revert — so two straight segments that
// LOOK identical can still end up 180° apart in practice: build the same
// run one way (chained forward, entryPort = ports[0]) vs. the other
// (chained backward, entryPort = ports[1]) and this is exactly what falls
// out, without hand-picking any rotation number. Confirms the algorithm
// actually corrects a real mismatch, not just an already-fine case.
{
  const norm360 = (d) => ((d % 360) + 360) % 360
  const highlightAngle = (localAngle, rotation, flip) => norm360(localAngle + 180 + rotation + (flip ? 180 : 0))

  const tank = { id: 'tank2', type: 'tank', x: 0, y: 0, w: 220, h: 300, rotation: 0 }
  const straight = attach(portWorld(tank, 0), 'pipe-straight', 0, 'straight')

  // Now attach the elbow from the "wrong" end on purpose: instead of
  // continuing forward off the straight's open port (entryPort =
  // elbow.ports[0], the usual "+" flow), place it as if the run had been
  // built backward — same technique useCanvas.js's own alignConnections
  // uses to reconcile independently-placed pieces, just applied here to
  // deliberately reproduce the drift instead of fix it.
  const straightPort1 = getPortWorld(straight, WIDGET_REGISTRY['pipe-straight'].ports[1])
  const elbow = attach(straightPort1, 'pipe-elbow', 1, 'elbow')

  const before = highlightAngle(90, elbow.rotation || 0, false) // elbow port1 -> 'h'
  const straightAngle = highlightAngle(90, straight.rotation || 0, false)
  console.log(`  (unflipped elbow angle=${before}, straight anchor angle=${straightAngle}, mismatched=${before !== straightAngle})`)
  assertEq(before !== straightAngle, true, 'scenario2 setup: entryPort=1 actually reproduces a raw mismatch')

  const flips = computeShadeFlips([tank, straight, elbow])
  const after = highlightAngle(90, elbow.rotation || 0, flips.elbow.h)
  assertEq(after, straightAngle, 'scenario2: the reproduced mismatch is corrected by the computed flip')
}

// --- Scenario 3: Tee with a straight run on each side of its through-run ---
{
  const westStraight = { id: 'west', type: 'pipe-straight', x: 0, y: 100, w: 140, h: 24, rotation: 0 }
  const westPort1 = getPortWorld(westStraight, WIDGET_REGISTRY['pipe-straight'].ports[1])
  const tee = attach(westPort1, 'pipe-tee', 0, 'tee')
  const teePort1 = getPortWorld(tee, WIDGET_REGISTRY['pipe-tee'].ports[1])
  const eastStraight = attach(teePort1, 'pipe-straight', 0, 'east')

  const flips = computeShadeFlips([westStraight, tee, eastStraight])
  const norm360 = (d) => ((d % 360) + 360) % 360
  const highlightAngle = (localAngle, rotation, flip) => norm360(localAngle + 180 + rotation + (flip ? 180 : 0))
  const westAngle = highlightAngle(90, westStraight.rotation, false)
  const teeAngle = highlightAngle(90, tee.rotation || 0, flips.tee.h)
  assertEq(teeAngle, westAngle, 'scenario3: tee through-run matches its west neighbor (both straights agree by construction)')
}

// --- Scenario 4: a long zigzag of elbows with NO straight piece anywhere
// (no fixed anchor at all) — every joint must still agree with its
// neighbor once the relaxation settles.
{
  const tank = { id: 'tank4', type: 'tank', x: 0, y: 0, w: 220, h: 300, rotation: 0 }
  let sourcePort = portWorld(tank, 0)
  const widgets = [tank]
  let prev = null
  for (let i = 0; i < 6; i++) {
    // alternate which port serves as entry, to force the same kind of
    // drift as scenario 2, repeatedly, down a whole chain
    const entryIdx = i % 2
    const piece = attach(sourcePort, 'pipe-elbow', entryIdx, `z${i}`)
    widgets.push(piece)
    const exitIdx = entryIdx === 0 ? 1 : 0
    sourcePort = portWorld(piece, exitIdx)
    prev = piece
  }
  void prev

  const flips = computeShadeFlips(widgets)
  const norm360 = (d) => ((d % 360) + 360) % 360
  const highlightAngle = (localAngle, rotation, flip) => norm360(localAngle + 180 + rotation + (flip ? 180 : 0))
  const gradFor = (portIndex) => (portIndex === 0 ? { grad: 'v', localAngle: 180 } : { grad: 'h', localAngle: 90 })

  // Walk the same chain again and check every consecutive pair agrees.
  let ok = true
  for (let i = 1; i < widgets.length - 1; i++) {
    const a = widgets[i]
    const b = widgets[i + 1]
    // a's exit port index is whichever one ISN'T its entry (mirrors the
    // build loop above)
    const aEntryIdx = (i - 1) % 2
    const aExitIdx = aEntryIdx === 0 ? 1 : 0
    const bEntryIdx = i % 2
    const aG = gradFor(aExitIdx)
    const bG = gradFor(bEntryIdx)
    const aAngle = highlightAngle(aG.localAngle, a.rotation || 0, flips[a.id][aG.grad])
    const bAngle = highlightAngle(bG.localAngle, b.rotation || 0, flips[b.id][bG.grad])
    if (aAngle !== bAngle) {
      ok = false
      console.error(`  mismatch between ${a.id} and ${b.id}: ${aAngle} vs ${bAngle}`)
    }
  }
  assertEq(ok, true, 'scenario4: long anchor-less elbow zigzag settles fully consistent')
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`)
  process.exit(1)
} else {
  console.log('\nall shadeSync tests passed')
}
