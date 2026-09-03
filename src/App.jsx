import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import BrokerPage from './components/BrokerPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import UsersPage from './components/UsersPage.jsx'
import WidgetPalette from './components/canvas/WidgetPalette.jsx'
import DashboardCanvas from './components/canvas/DashboardCanvas.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'
import { useCanvas } from './hooks/useCanvas.js'
import { useBrokerConnections } from './hooks/useBrokerConnections.js'
import { useAuth } from './hooks/useAuth.js'
import { IconSliders, IconCheck, IconX, IconAlign } from './icons.jsx'

export default function App() {
  const auth = useAuth()
  const telemetry = useTelemetry()
  const canvas = useCanvas(auth.user ? auth.token : '', auth.user?.role === 'admin')
  const broker = useBrokerConnections()
  const [active, setActive] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const isAdmin = auth.user?.role === 'admin'

  useEffect(() => {
    const topics = canvas.widgets.flatMap((widget) => [
      widget.config?.readTag,
      widget.config?.runningTag,
      widget.config?.modeTag,
      widget.config?.writeTag,
    ])
    broker.setSubscriptions(topics)
  }, [canvas.widgets, broker.setSubscriptions])

  useEffect(() => {
    if (!isAdmin && canvas.editMode) canvas.setEditMode(false)
    if (!isAdmin && active !== 'dashboard') setActive('dashboard')
  }, [isAdmin, active, canvas.editMode, canvas.setEditMode])

  if (auth.checking) {
    return <div className="flex h-screen items-center justify-center bg-navy-950 text-sm font-semibold text-navy-200">Validando sesión…</div>
  }

  if (!auth.user) return <LoginPage onLogin={auth.login} />

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      <Sidebar
        active={active}
        onNavigate={setActive}
        alarmCount={telemetry.activeAlarms.length}
        user={auth.user}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          alarmCount={telemetry.activeAlarms.length}
          onMenu={() => setNavOpen(true)}
          user={auth.user}
          onLogout={() => {
            broker.disconnect()
            setActive('dashboard')
            auth.logout()
          }}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:gap-5 lg:p-6">
          {active === 'dashboard' ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Lienzo del dashboard</h2>
                  <p className="text-xs text-ink-400">
                    {isAdmin ? 'Arrastra widgets desde la paleta para armar tu vista' : 'Vista compartida del dashboard'}
                    {canvas.syncStatus === 'saving' && <span className="ml-2 text-live-600">· Guardando…</span>}
                    {canvas.syncStatus === 'synced' && <span className="ml-2 text-status-good">· Sincronizado</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && canvas.editMode && canvas.widgets.length > 0 && (
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
                  {isAdmin && canvas.editMode && canvas.widgets.length > 0 && (
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
                  {isAdmin && <button
                    onClick={() => canvas.setEditMode((v) => !v)}
                    disabled={canvas.syncStatus === 'loading'}
                    className={[
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-50',
                      canvas.editMode
                        ? 'bg-navy-600 text-white'
                        : 'bg-white text-navy-600 ring-1 ring-ink-100 hover:bg-navy-50',
                    ].join(' ')}
                  >
                    {canvas.editMode ? <IconCheck className="h-3.5 w-3.5" /> : <IconSliders className="h-3.5 w-3.5" />}
                    {canvas.editMode ? 'Terminar edición' : 'Editar lienzo'}
                  </button>}
                </div>
              </div>

              {isAdmin && canvas.editMode && <WidgetPalette canvas={canvas} />}

              {canvas.syncStatus === 'error' && (
                <div className="shrink-0 rounded-xl bg-status-warningBg px-4 py-2 text-xs font-semibold text-status-warning">No se pudo sincronizar el lienzo con el servidor.</div>
              )}

              {canvas.syncStatus === 'loading' ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-ink-400 shadow-card">Cargando lienzo compartido…</div>
              ) : (
                <DashboardCanvas telemetry={telemetry} canvas={canvas} broker={broker} />
              )}
            </>
          ) : active === 'broker' && isAdmin ? (
            <BrokerPage broker={broker} />
          ) : active === 'usuarios' && isAdmin ? (
            <UsersPage token={auth.token} currentUser={auth.user} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-400">Sección en preparación</div>
          )}
        </main>
      </div>
    </div>
  )
}
