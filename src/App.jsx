import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import LoginPage from './components/LoginPage.jsx'
import UsersPage from './components/UsersPage.jsx'
import DashboardCanvas from './components/canvas/DashboardCanvas.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'
import { useCanvas } from './hooks/useCanvas.js'
import { useBrokerConnections } from './hooks/useBrokerConnections.js'
import { useAuth } from './hooks/useAuth.js'

function fixedDashboardWidgets(widgets) {
  const tanks = widgets.filter((widget) => widget.type === 'tank').sort((a, b) => a.x - b.x)
  const tankByKey = { carcamo: tanks[0], superior: tanks.at(-1) }
  const modeCards = widgets.filter((widget) => widget.type === 'modeselect').sort((a, b) => a.x - b.x)
  const existingSetpoints = widgets.filter((widget) => widget.type === 'setpoint').sort((a, b) => a.x - b.x)
  const histories = widgets.filter((widget) => widget.type === 'levelhistory').sort((a, b) => a.x - b.x)

  const assignments = new Map([
    [modeCards[0]?.id, { type: 'setpoint', config: { tankKey: 'superior', tankLabel: 'Tanque Superior', key: 'start', writeTag: 'Real_1', feedbackTag: 'PACarcamo_Real_1' } }],
    [modeCards[1]?.id, { type: 'setpoint', config: { tankKey: 'superior', tankLabel: 'Tanque Superior', key: 'stop', writeTag: 'Real_2', feedbackTag: 'PACarcamo_Real_2' } }],
    [existingSetpoints[0]?.id, { config: { tankKey: 'carcamo', tankLabel: 'Tanque Cárcamo', key: 'start', writeTag: 'Real_3', feedbackTag: 'PACarcamo_Real_3' } }],
    [existingSetpoints[1]?.id, { config: { tankKey: 'carcamo', tankLabel: 'Tanque Cárcamo', key: 'stop', writeTag: 'Real_4', feedbackTag: 'PACarcamo_Real_4' } }],
  ])

  return widgets.map((widget) => {
    const assigned = assignments.get(widget.id)
    let next = assigned ? { ...widget, ...assigned, config: { ...widget.config, ...assigned.config } } : widget
    if (widget.id === tankByKey.carcamo?.id) next = { ...next, config: { ...next.config, tankKey: 'carcamo', label: 'Tanque Cárcamo' } }
    if (widget.id === tankByKey.superior?.id) next = { ...next, config: { ...next.config, tankKey: 'superior', label: 'Tanque Superior' } }
    if (widget.type === 'pump') {
      const pumpId = widget.config?.pumpId === 'p2' ? 'p2' : 'p1'
      const offset = pumpId === 'p1' ? 0 : 5
      next = { ...next, config: {
        ...next.config, pumpId,
        autoTag: `PACarcamo_Bool_${offset + 1}`,
        manualTag: `PACarcamo_Bool_${offset + 2}`,
        offTag: `PACarcamo_Bool_${offset + 3}`,
        runningTag: `PACarcamo_Bool_${offset + 4}`,
        faultTag: `PACarcamo_Bool_${offset + 5}`,
      } }
    }
    const historyIndex = histories.findIndex((item) => item.id === widget.id)
    if (historyIndex >= 0) {
      const tank = historyIndex === 0 ? tankByKey.carcamo : tankByKey.superior
      const label = historyIndex === 0 ? 'Tanque Cárcamo' : 'Tanque Superior'
      next = { ...next, config: { ...next.config, sourceTankId: tank?.id, title: `Histórico de Nivel ${label}`, subtitle: `${label} · nivel recibido por MQTT` } }
    }
    if (widget.type === 'history-table' && !widget.config?.sourceTankId) {
      next = { ...next, config: { ...next.config, sourceTankId: tankByKey.carcamo?.id, eyebrow: 'Tanque Cárcamo' } }
    }
    if (widget.type === 'panel') next = { ...next, config: { ...next.config, title: 'Niveles de operación' } }
    return next
  })
}

export default function App() {
  const auth = useAuth()
  const telemetry = useTelemetry()
  const canvas = useCanvas(auth.user ? auth.token : '', auth.user?.role === 'admin')
  const broker = useBrokerConnections(auth.user ? auth.token : '')
  const [active, setActive] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const isAdmin = auth.user?.role === 'admin'
  const sensorAlarmRaw = broker.topicValues.PACarcamo_Bool_11?.value
  const sensorAlarmActive = sensorAlarmRaw === true || sensorAlarmRaw === 1 || ['1', 'true', 'on'].includes(String(sensorAlarmRaw).toLowerCase())
  const liveTelemetry = sensorAlarmActive ? {
    ...telemetry,
    alarms: [{ id: 'sensor', time: broker.topicValues.PACarcamo_Bool_11.receivedAt, severity: 'warning', tag: 'SENSOR', message: 'Alarma de sensor / ignorar activa', acknowledged: false }],
    activeAlarms: [{ id: 'sensor', time: broker.topicValues.PACarcamo_Bool_11.receivedAt, severity: 'warning', tag: 'SENSOR', message: 'Alarma de sensor / ignorar activa', acknowledged: false }],
  } : telemetry

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
        alarmCount={liveTelemetry.activeAlarms.length}
        user={auth.user}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          alarmCount={liveTelemetry.activeAlarms.length}
          onMenu={() => setNavOpen(true)}
          user={auth.user}
          onLogout={() => {
            setActive('dashboard')
            auth.logout()
          }}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:gap-5 lg:p-6">
          {active === 'dashboard' ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Dashboard de telemetría</h2>
                  <p className="text-xs text-ink-400">
                    Datos en tiempo real
                    <span className={broker.status === 'connected' ? 'ml-2 text-status-good' : 'ml-2 text-status-warning'}>· {broker.statusMessage}</span>
                  </p>
                </div>
              </div>

              {canvas.syncStatus === 'error' && (
                <div className="shrink-0 rounded-xl bg-status-warningBg px-4 py-2 text-xs font-semibold text-status-warning">No se pudo sincronizar el lienzo con el servidor.</div>
              )}

              {canvas.syncStatus === 'loading' ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-ink-400 shadow-card">Cargando lienzo compartido…</div>
              ) : (
                <DashboardCanvas telemetry={liveTelemetry} canvas={{ ...canvas, editMode: false, widgets: fixedDashboardWidgets(canvas.widgets) }} broker={broker} />
              )}
            </>
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
