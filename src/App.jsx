import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import WidgetPalette from './components/canvas/WidgetPalette.jsx'
import DashboardCanvas from './components/canvas/DashboardCanvas.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'
import { useCanvas } from './hooks/useCanvas.js'
import { IconSliders, IconCheck } from './icons.jsx'

export default function App() {
  const telemetry = useTelemetry()
  const canvas = useCanvas()
  const [active, setActive] = useState('dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      <Sidebar active={active} onNavigate={setActive} alarmCount={telemetry.activeAlarms.length} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header alarmCount={telemetry.activeAlarms.length} onMenu={() => {}} />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:gap-5 lg:p-6">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Lienzo del dashboard</h2>
              <p className="text-xs text-ink-400">Arrastra widgets desde la paleta para armar tu vista</p>
            </div>
            <button
              onClick={() => canvas.setEditMode((v) => !v)}
              className={[
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
                canvas.editMode
                  ? 'bg-navy-600 text-white'
                  : 'bg-white text-navy-600 ring-1 ring-ink-100 hover:bg-navy-50',
              ].join(' ')}
            >
              {canvas.editMode ? <IconCheck className="h-3.5 w-3.5" /> : <IconSliders className="h-3.5 w-3.5" />}
              {canvas.editMode ? 'Terminar edición' : 'Editar lienzo'}
            </button>
          </div>

          {canvas.editMode && <WidgetPalette />}

          <DashboardCanvas telemetry={telemetry} canvas={canvas} />
        </main>
      </div>
    </div>
  )
}
