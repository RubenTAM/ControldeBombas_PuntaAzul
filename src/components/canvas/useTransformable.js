import { useCallback, useRef } from 'react'

// Free-form move/resize/rotate for canvas widgets, plain mouse events (no
// external drag library). Snaps to a grid / to 90° by default; hold Alt for
// pixel/degree-exact fine adjustment.
const GRID = 20
const ANGLE_SNAP = 90

const snap = (v, step) => Math.round(v / step) * step

export function useTransformable({ x, y, w, h, minW = 60, minH = 40, onChange, onFront }) {
  const cleanup = useRef(null)

  const listen = useCallback((onMove, onUp) => {
    cleanup.current?.()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    cleanup.current = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startMove = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      onFront?.()
      const origX = x
      const origY = y
      const startX = e.clientX
      const startY = e.clientY

      const onMove = (ev) => {
        let nx = origX + (ev.clientX - startX)
        let ny = origY + (ev.clientY - startY)
        if (!ev.altKey) {
          nx = snap(nx, GRID)
          ny = snap(ny, GRID)
        }
        onChange({ x: Math.max(0, nx), y: Math.max(0, ny) })
      }
      const onUp = () => cleanup.current?.()
      listen(onMove, onUp)
    },
    [x, y, onChange, onFront, listen],
  )

  const startResize = useCallback(
    (e, axis = 'both') => {
      e.preventDefault()
      e.stopPropagation()
      onFront?.()
      const origW = w
      const origH = h
      const startX = e.clientX
      const startY = e.clientY

      const onMove = (ev) => {
        let nw = axis === 'height' ? origW : origW + (ev.clientX - startX)
        let nh = axis === 'width' ? origH : origH + (ev.clientY - startY)
        if (!ev.altKey) {
          nw = snap(nw, GRID)
          nh = snap(nh, GRID)
        }
        onChange({ w: Math.max(minW, nw), h: Math.max(minH, nh) })
      }
      const onUp = () => cleanup.current?.()
      listen(onMove, onUp)
    },
    [w, h, minW, minH, onChange, onFront, listen],
  )

  const startRotate = useCallback(
    (e, elRef) => {
      e.preventDefault()
      e.stopPropagation()
      onFront?.()

      const onMove = (ev) => {
        const rect = elRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        let angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
        angle = (angle + 360) % 360
        if (!ev.altKey) angle = snap(angle, ANGLE_SNAP) % 360
        onChange({ rotation: angle })
      }
      const onUp = () => cleanup.current?.()
      listen(onMove, onUp)
    },
    [onChange, onFront, listen],
  )

  return { startMove, startResize, startRotate }
}
