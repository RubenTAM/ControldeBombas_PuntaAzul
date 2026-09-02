import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import BrokerPage from './components/BrokerPage.jsx'
import WidgetPalette from './components/canvas/WidgetPalette.jsx'
import DashboardCanvas from './components/canvas/DashboardCanvas.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'
import { useCanvas } from './hooks/useCanvas.js'
import { useBrokerConnections } from './hooks/useBrokerConnections.js'
import { IconSliders, IconCheck, IconX, IconAlign } from './icons.jsx'

export default function App() {
  const telemetry = useTelemetry()
  const canvas = useCanvas()
  const broker = useBrokerConnections()
  const [active, setActive] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      <Sidebar
        active={active}
        onNavigate={setActive}
        alarmCount={telemetry.activeAlarms.length}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header alarmCount={telemetry.activeAlarms.length} onMenu={() => setNavOpen(true)} />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:gap-5 lg:p-6">
          {active === 'dashboard' ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Lienzo del dashboard</h2>
                  <p className="text-xs text-ink-400">Arrastra widgets desde la paleta para armar tu vista</p>
                </div>
                <div className="flex items-center gap-2">
                  {canvas.editMode && canvas.widgets.length > 0 && (
                    <button
                      onClick={() => {
                        const n = canvas.alignConnections()
                        window.alert(n > 0 ? `Se alinearon ${n} conexión${n === 1 ? '' : 'es'}.` : 'Ya estaba todo alineado — ninguna conexión necesitaba ajuste.')
                      }}
                      title="Ajusta cada pieza ya conectada para que su brida/tubo quede exactamente a la misma altura que la pieza a la que está pegada, sin mover nada que no esté conectado"
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink-400 ring-1 ring-ink-100 transition-colors hover:bg-navy-50 hover:text-navy-600"
                    >
                      <IconAlign className="h-3.5 w-3.5" />
                      Alinear conexiones
                    </button>
                  )}
                  {canvas.editMode && canvas.widgets.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Vaciar todo el lienzo? Se eliminan todos los widgets, no se puede deshacer.')) {
                          canvas.clearAll()
                        }
                      }}
                      title="Quita todos los widgets del lienzo — úsalo si alguna pieza quedó atorada o mal posicionada"
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink-400 ring-1 ring-ink-100 transition-colors hover:bg-status-criticalBg hover:text-status-critical"
                    >
                      <IconX className="h-3.5 w-3.5" />
                      Vaciar lienzo
                    </button>
                  )}
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
              </div>

              {canvas.editMode && <WidgetPalette canvas={canvas} />}

              <DashboardCanvas telemetry={telemetry} canvas={canvas} />
            </>
          ) : active === 'broker' ? (
            <BrokerPage broker={broker} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-400">Sección en preparación</div>
          )}
        </main>
      </div>
    </div>
  )
}
