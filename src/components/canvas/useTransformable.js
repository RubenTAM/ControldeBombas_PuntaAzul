import { useCallback, useEffect, useRef } from 'react'

// Free-form move/resize/rotate using Pointer Events. One path now handles
// mouse, touch and Apple Pencil instead of relying on mouse-only events.
// Snaps to a grid / to 90° by default; hold Alt for fine mouse adjustment.
const GRID = 20
const ANGLE_SNAP = 90

const snap = (v, step) => Math.round(v / step) * step

export function useTransformable({ x, y, w, h, rotation = 0, minW = 60, minH = 40, onChange, onFront }) {
  const cleanup = useRef(null)

  const listen = useCallback((pointerId, onMove, onUp) => {
    cleanup.current?.()
    const move = (event) => {
      if (event.pointerId === pointerId) onMove(event)
    }
    const finish = (event) => {
      if (event.pointerId !== pointerId) return
      onUp(event)
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    cleanup.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  }, [])

  useEffect(() => () => cleanup.current?.(), [])

  const startMove = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      onFront?.()
      const origX = x
      const origY = y
      const startX = e.clientX
      const startY = e.clientY

      const onMove = (ev) => {
        ev.preventDefault()
        let nx = origX + (ev.clientX - startX)
        let ny = origY + (ev.clientY - startY)
        if (!ev.altKey) {
          nx = snap(nx, GRID)
          ny = snap(ny, GRID)
        }
        onChange({ x: Math.max(0, nx), y: Math.max(0, ny) })
      }
      const onUp = () => cleanup.current?.()
      listen(e.pointerId, onMove, onUp)
    },
    [x, y, onChange, onFront, listen],
  )

  const startResize = useCallback(
    (e, axis = 'both') => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      onFront?.()
      const origW = w
      const origH = h
      const startX = e.clientX
      const startY = e.clientY
      // undo the widget's own rotation on the raw screen-space mouse delta
      // so "drag the handle" always grows the piece along its own local
      // width/height — without this, a rotated widget (e.g. a straight
      // pipe turned to point up/down) would have screen dx/dy bleeding
      // into the WRONG local axis, quietly changing its thickness instead
      // of its length with no way to tell just from the numbers.
      const rad = (-rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)

      const onMove = (ev) => {
        ev.preventDefault()
        const dxScreen = ev.clientX - startX
        const dyScreen = ev.clientY - startY
        const dxLocal = dxScreen * cos - dyScreen * sin
        const dyLocal = dxScreen * sin + dyScreen * cos

        let nw = axis === 'height' ? origW : origW + dxLocal
        let nh = axis === 'width' ? origH : origH + dyLocal
        if (!ev.altKey) {
          nw = snap(nw, GRID)
          nh = snap(nh, GRID)
        }
        onChange({ w: Math.max(minW, nw), h: Math.max(minH, nh) })
      }
      const onUp = () => cleanup.current?.()
      listen(e.pointerId, onMove, onUp)
    },
    [w, h, rotation, minW, minH, onChange, onFront, listen],
  )

  const startRotate = useCallback(
    (e, elRef) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      onFront?.()

      const onMove = (ev) => {
        ev.preventDefault()
        const rect = elRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        let angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
        angle = (angle + 360) % 360
        if (!ev.altKey) angle = snap(angle, ANGLE_SNAP) % 360
        onChange({ rotation: angle })
      }
      const onUp = () => cleanup.current?.()
      listen(e.pointerId, onMove, onUp)
    },
    [onChange, onFront, listen],
  )

  return { startMove, startResize, startRotate }
}
