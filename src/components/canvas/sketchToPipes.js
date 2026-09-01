// "Dibujar tubería" — turns a freehand mouse stroke into a real chain of
// pipe-straight / pipe-elbow widgets that follow the drawn shape.
//
// Pipeline: simplify() thins out the raw mousemove noise → orthogonalize()
// snaps what's left into a pure horizontal/vertical polyline (this app's
// fittings are all 0/90/180/270 — a straight pipe can point any way, but
// the elbow is a fixed 90° bend, so a diagonal stroke has no piece that
// could render it) → mergeCollinear() drops corners that aren't real turns
// → buildPieces() walks the corners and chains real widgets onto them with
// the exact same math the "+" attach menu uses (placeAttached/getPortWorld
// from ports.js), so every joint in the generated run is the same
// pixel-perfect, zero-gap connection as everywhere else in this app.
import { getPortWorld, placeAttached } from './ports.js'

// px — a corner-to-corner distance below this isn't a deliberate segment,
// it's noise/overshoot from an unsteady hand; folded into its neighbor.
export const MIN_SEGMENT = 44
// px — Ramer-Douglas-Peucker tolerance for thinning the raw mousemove
// samples before we try to read turns out of them.
export const SIMPLIFY_EPSILON = 10
// px — how close the FIRST point of a stroke has to land to an existing
// open port for the drawn run to weld onto it (and inherit its diameter)
// instead of starting fresh at the default pipe size.
export const START_SNAP = 40
// px — a new corner's x (for a horizontal segment) or y (for a vertical
// one) snaps to an EARLIER corner's own x/y in the same stroke when this
// close. This is what keeps a hand-drawn U or Z level: the two vertical
// legs almost never end at the exact same height by hand, but if they're
// already close, this locks them together instead of leaving the few px
// of drift that reads as "one side is higher than the other".
export const ALIGN_SNAP = 24

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function perpendicularDistance(pt, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return dist(pt, a)
  const t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / (dx * dx + dy * dy)
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return dist(pt, { x: projX, y: projY })
}

// Ramer-Douglas-Peucker — keeps only the points that actually shape the
// stroke, dropping the hundreds of near-duplicate samples a real mousemove
// stream produces.
export function simplify(points, epsilon = SIMPLIFY_EPSILON) {
  if (points.length < 3) return points
  let maxDist = 0
  let index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end])
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon)
    const right = simplify(points.slice(index), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [points[0], points[end]]
}

// 0/90/180/270 — the compass direction of travel from a to b (screen
// coords: y grows downward, so 90 is "down").
function compassDir(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 0 : 180
  return dy >= 0 ? 90 : 270
}

// signed distance from `from` to `to`, measured along the compass
// direction `dir` (0/90/180/270) — used to turn "the free end needs to be
// AT this point" back into "the piece's own length needs to be THIS".
export function lengthAlongDir(dir, from, to) {
  switch (dir) {
    case 0:
      return to.x - from.x
    case 180:
      return from.x - to.x
    case 90:
      return to.y - from.y
    case 270:
      return from.y - to.y
    default:
      return dist(from, to)
  }
}

// Rebuilds the (already-simplified) stroke as a pure horizontal/vertical
// polyline: each new corner shares exactly one coordinate with the last
// one, so every resulting segment is purely orthogonal by construction —
// never diagonal, even when the input briefly is. Points closer than
// MIN_SEGMENT to the last accepted corner are skipped rather than turned
// into their own tiny segment.
// finds an EARLIER value (excluding the immediately preceding corner,
// which always trivially shares one axis with the new one by construction)
// within ALIGN_SNAP of `value`; returns it unchanged if none is close.
function snapToEarlier(value, earlierValues, tolerance) {
  let best = value
  let bestDist = tolerance
  for (const v of earlierValues) {
    const d = Math.abs(v - value)
    if (d < bestDist) {
      bestDist = d
      best = v
    }
  }
  return best
}

export function orthogonalize(points, minSegment = MIN_SEGMENT, alignSnap = ALIGN_SNAP) {
  if (points.length === 0) return []
  const corners = [{ x: points[0].x, y: points[0].y }]
  for (let i = 1; i < points.length; i++) {
    const prev = corners[corners.length - 1]
    const pt = points[i]
    const dx = pt.x - prev.x
    const dy = pt.y - prev.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < minSegment) continue
    // corners so far, EXCLUDING prev — prev always shares an axis with the
    // new corner trivially (that's just "this segment is horizontal/
    // vertical"), so it can't count as an "earlier, unrelated match".
    const earlier = corners.slice(0, -1)
    if (Math.abs(dx) >= Math.abs(dy)) {
      // horizontal segment: y is fixed (= prev.y), x is the free end —
      // snap it to an earlier corner's x if one is already this close, so
      // two verticals meant to line up on the same column actually do.
      corners.push({ x: snapToEarlier(pt.x, earlier.map((c) => c.x), alignSnap), y: prev.y })
    } else {
      // vertical segment: x is fixed, y is the free end — same idea, but
      // for height: this is what makes both legs of a hand-drawn U come
      // out at the exact same height instead of a few px apart.
      corners.push({ x: prev.x, y: snapToEarlier(pt.y, earlier.map((c) => c.y), alignSnap) })
    }
  }
  // make sure the actual end of the stroke is represented, even if it
  // didn't clear minSegment from the last accepted corner — otherwise a
  // short final flourish just silently vanishes instead of extending the
  // last segment out to where the user actually stopped.
  const trueEnd = points[points.length - 1]
  const lastCorner = corners[corners.length - 1]
  const endDx = trueEnd.x - lastCorner.x
  const endDy = trueEnd.y - lastCorner.y
  // same minSegment bar as every other corner in the main loop above — NOT
  // the old flat ">2px" check. That flat check was too eager: a stray few
  // px of the real path can be left over right where a much bigger,
  // dominant-axis move already got folded into the previous corner (the
  // move was correctly read as "mostly vertical", so any smaller
  // horizontal remainder was correctly ignored THERE) — resurrecting that
  // same leftover afterwards as a mandatory final segment produced a
  // bogus extra dogleg instead of a clean corner. Anything under
  // minSegment is, by this function's own rule everywhere else, not a
  // deliberate segment — so it shouldn't become the one exception here.
  if (Math.max(Math.abs(endDx), Math.abs(endDy)) >= minSegment) {
    const dx = endDx
    const dy = endDy
    const earlier = corners.slice(0, -1)
    const candidate =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: snapToEarlier(trueEnd.x, earlier.map((c) => c.x), alignSnap), y: lastCorner.y }
        : { x: lastCorner.x, y: snapToEarlier(trueEnd.y, earlier.map((c) => c.y), alignSnap) }
    // the align-snap above can pull this candidate back onto lastCorner
    // itself (e.g. the stroke's raw tail was 11px off, which is enough to
    // trip the >2px check above, but also close enough to snap flush with
    // an earlier corner) — pushing it anyway would add a zero-length
    // "segment" with no real direction, which confuses mergeCollinear
    // into treating it as an unmergeable extra turn. If the snap already
    // put us back at lastCorner, there's nothing left to add.
    if (Math.abs(candidate.x - lastCorner.x) > 0.01 || Math.abs(candidate.y - lastCorner.y) > 0.01) {
      corners.push(candidate)
    }
  }
  return corners
}

// For the live preview while the user is still drawing: does the LAST
// corner of this (partial) orthogonalized stroke sit exactly on an earlier
// corner's x or y — i.e. did orthogonalize() just auto-level this segment
// against one drawn earlier in the same stroke? Returns a guide line to
// show ({ axis: 'x'|'y', value }) or null. Exact-equality check is
// intentional: after orthogonalize's snapping, an aligned pair is
// bit-identical, not just "close".
export function findAlignmentGuide(corners) {
  if (corners.length < 3) return null
  const last = corners[corners.length - 1]
  const prev = corners[corners.length - 2]
  const earlier = corners.slice(0, -2)
  if (last.x === prev.x) {
    // vertical segment — a matching y from an earlier corner means this
    // leg's height just locked to that one's.
    const hit = earlier.find((c) => c.y === last.y)
    if (hit) return { axis: 'y', value: last.y }
  } else if (last.y === prev.y) {
    const hit = earlier.find((c) => c.x === last.x)
    if (hit) return { axis: 'x', value: last.x }
  }
  return null
}

// Drops corners that aren't real turns — three consecutive points that
// keep the same compass direction are one straight run, not two.
export function mergeCollinear(corners) {
  // drop any (near-)duplicate consecutive point first — a zero-length
  // "segment" has no real direction (compassDir would arbitrarily call it
  // east), which would otherwise dodge the collinearity check below and
  // survive as a bogus extra turn.
  const pts = corners.filter((c, i) => i === 0 || dist(c, corners[i - 1]) > 0.5)
  let changed = true
  while (changed && pts.length > 2) {
    changed = false
    for (let i = 1; i < pts.length - 1; i++) {
      if (compassDir(pts[i - 1], pts[i]) === compassDir(pts[i], pts[i + 1])) {
        pts.splice(i, 1)
        changed = true
        break
      }
    }
  }
  return pts
}

// Walks an orthogonal corner list and chains real pipe-straight/pipe-elbow
// widgets along it, using placeAttached at every joint (the same function
// the "+" menu uses) so nothing needs its own gap-closing logic — a piece
// placed here is, by construction, exactly as connected as one placed by
// hand through "+".
//
// `startAnchor` — { port: {x,y,dir}, scale } — when the stroke's first
// point landed near an existing open port, the whole run starts from THAT
// port (so it welds on) and is sized to match it; otherwise the run starts
// free-floating at 1:1 scale from the stroke's own first point.
//
// `endAnchor` — same shape, when the stroke's LAST point landed near a
// different open port: "llevando de una tubería a otra... va a quedar
// desfasada". Before this, only the STROKE's own first/last corners were
// ever compared to each other (see alignedAxes below) — an actual target
// port elsewhere on the canvas was never consulted, so a hand-drawn run
// could land within CONNECT_THRESHOLD (close enough to visually merge)
// while still sitting a handful of px off on one axis, reading as "un
// poco desfasada" right at the join. When there's a real endAnchor, both
// axes are corrected to its EXACT position instead of just whatever the
// raw sketch's own corners happened to agree on.
export function buildPieces(corners, registry, startAnchor = null, endAnchor = null) {
  if (corners.length < 2) return []
  const straightDef = registry['pipe-straight']
  const elbowDef = registry['pipe-elbow']
  if (!straightDef || !elbowDef) return []

  const scale = startAnchor?.scale ?? 1
  const segDirs = []
  for (let i = 0; i < corners.length - 1; i++) segDirs.push(compassDir(corners[i], corners[i + 1]))

  const pieces = []
  // A port's `dir` is always its OWN outward-facing direction (the way
  // a piece attached there would extend) — for a real port that's just
  // whatever getPortWorld says; for a virtual "start drawing here in
  // free space" anchor, that outward direction IS the first segment's
  // own travel direction.
  let sourcePort = startAnchor?.port ?? { x: corners[0].x, y: corners[0].y, dir: segDirs[0] }

  for (let i = 0; i < segDirs.length; i++) {
    const rawLength = Math.round(dist(corners[i], corners[i + 1]))
    const w = Math.max(Math.round(straightDef.minW * scale), rawLength)
    const h = Math.round(straightDef.defaultSize.h * scale)
    const straightTransform = placeAttached(sourcePort, { w, h }, straightDef.ports[0])
    pieces.push({ type: 'pipe-straight', ...straightTransform })
    sourcePort = getPortWorld(straightTransform, straightDef.ports[1])

    const isInteriorCorner = i < segDirs.length - 1
    if (!isInteriorCorner) continue

    const desiredExitDir = segDirs[i + 1]
    const elbowSize = { w: Math.round(elbowDef.defaultSize.w * scale), h: Math.round(elbowDef.defaultSize.h * scale) }
    // The elbow's two ports are only 90° apart (not opposite, like a
    // straight pipe's), so which one has to be the "entry" depends on
    // which way the path actually turns — try ports[0] as entry first,
    // and fall back to ports[1] when that yields the wrong exit direction.
    let transform = placeAttached(sourcePort, elbowSize, elbowDef.ports[0])
    let exitPort = getPortWorld(transform, elbowDef.ports[1])
    if (exitPort.dir !== desiredExitDir) {
      transform = placeAttached(sourcePort, elbowSize, elbowDef.ports[1])
      exitPort = getPortWorld(transform, elbowDef.ports[0])
    }
    pieces.push({ type: 'pipe-elbow', ...transform })
    sourcePort = exitPort
  }

  // Enforce endpoint alignment on the REAL built geometry. orthogonalize()
  // can deliberately snap the first and last sketch corners to the same x
  // or y, but every elbow also contributes its own physical displacement.
  // Consequently, using the raw sketch length for every straight can move
  // the final rendered endpoint away from the orange alignment guide (or,
  // with a real endAnchor, off the port it's supposed to land on).
  //
  // Resizes the LAST straight segment that travels along `axis`, then
  // translates the entire connected suffix after it by the same amount —
  // not just the last straight overall, so this still works for an S/step
  // whose final leg runs the OTHER axis. All joints stay coincident and
  // the real endpoint finishes at exactly `targetValue` on `axis`.
  const correctAxis = (axis, targetValue) => {
    const lastPiece = pieces[pieces.length - 1]
    const lastFreePort = getPortWorld(lastPiece, straightDef.ports[1])
    const delta = targetValue - lastFreePort[axis]
    if (Math.abs(delta) < 0.01) return

    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i]
      if (piece.type !== 'pipe-straight') continue

      const oldExit = getPortWorld(piece, straightDef.ports[1])
      const travelAxis = oldExit.dir === 0 || oldExit.dir === 180 ? 'x' : 'y'
      if (travelAxis !== axis) continue

      const travelSign = oldExit.dir === 0 || oldExit.dir === 90 ? 1 : -1
      const newLength = piece.w + delta * travelSign
      const pieceScale = piece.h / straightDef.defaultSize.h
      if (newLength < straightDef.minW * pieceScale) continue

      const entryWorld = getPortWorld(piece, straightDef.ports[0])
      const entrySource = { x: entryWorld.x, y: entryWorld.y, dir: (entryWorld.dir + 180) % 360 }
      const resized = placeAttached(entrySource, { w: newLength, h: piece.h }, straightDef.ports[0])
      const newExit = getPortWorld(resized, straightDef.ports[1])
      const shiftX = newExit.x - oldExit.x
      const shiftY = newExit.y - oldExit.y

      pieces[i] = { type: 'pipe-straight', ...resized }
      for (let j = i + 1; j < pieces.length; j++) {
        pieces[j] = { ...pieces[j], x: pieces[j].x + shiftX, y: pieces[j].y + shiftY }
      }
      return
    }
  }

  if (endAnchor) {
    // a real target port: land on it exactly, on BOTH axes, regardless of
    // what the raw hand-drawn corners happened to already agree on
    correctAxis('x', endAnchor.port.x)
    correctAxis('y', endAnchor.port.y)
  } else {
    // no target port — just keep the sketch internally consistent: only
    // correct an axis the drawing itself implied should line up (e.g. a
    // hand-drawn U whose two legs were meant to end at the same height)
    const firstCorner = corners[0]
    const lastCorner = corners[corners.length - 1]
    const firstFreePort = getPortWorld(pieces[0], straightDef.ports[0])
    if (Math.abs(firstCorner.x - lastCorner.x) < 0.01) correctAxis('x', firstFreePort.x)
    if (Math.abs(firstCorner.y - lastCorner.y) < 0.01) correctAxis('y', firstFreePort.y)
  }

  return pieces
}

// Convenience: raw stroke points in → ready-to-place piece list out.
export function sketchToPieces(rawPoints, registry, startAnchor = null, endAnchor = null) {
  const simplified = simplify(rawPoints)
  const corners = mergeCollinear(orthogonalize(simplified))
  return buildPieces(corners, registry, startAnchor, endAnchor)
}
