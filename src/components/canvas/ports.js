// Geometry for the pipe-chain "+" builder: where a widget's connection
// points land on the canvas once its position/size/rotation are known, and
// how to place a brand-new piece so it latches cleanly onto one of them.

export function rotatePoint(px, py, cx, cy, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

// canvas-space position + outward-facing direction (deg) for one port of a
// placed widget (widget = {x,y,w,h,rotation}).
export function getPortWorld(widget, portDef) {
  const cx = widget.w / 2
  const cy = widget.h / 2
  const rotated = rotatePoint(portDef.fx * widget.w, portDef.fy * widget.h, cx, cy, widget.rotation || 0)
  return {
    x: widget.x + rotated.x,
    y: widget.y + rotated.y,
    dir: (((portDef.dir + (widget.rotation || 0)) % 360) + 360) % 360,
  }
}

// {x, y, w, h, rotation} for a NEW widget of `size`, whose ports[0] should
// latch onto `sourcePort` ({x,y,dir}) and extend away from it.
export function placeAttached(sourcePort, size, entryPort) {
  const rotation = (((sourcePort.dir + 180 - entryPort.dir) % 360) + 360) % 360
  const cx = size.w / 2
  const cy = size.h / 2
  const rotated = rotatePoint(entryPort.fx * size.w, entryPort.fy * size.h, cx, cy, rotation)
  return {
    x: sourcePort.x - rotated.x,
    y: sourcePort.y - rotated.y,
    w: size.w,
    h: size.h,
    rotation,
  }
}
