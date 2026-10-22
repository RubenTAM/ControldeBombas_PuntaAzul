import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import LoginPage from './components/LoginPage.jsx'
import UsersPage from './components/UsersPage.jsx'
import { DashboardOverview, HistoryPage } from './components/OperationalDashboard.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'
import { useBrokerConnections } from './hooks/useBrokerConnections.js'
import { useAuth } from './hooks/useAuth.js'
import { buildTelemetryModel, TELEMETRY_TOPICS } from './lib/telemetryModel.js'

export default function App() {
  const auth = useAuth()
  const telemetry = useTelemetry()
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
  const model = useMemo(() => buildTelemetryModel(liveTelemetry, broker), [liveTelemetry, broker])
  const disconnectedPlcs = model.plcs.filter((plc) => !plc.connected)
  const connectedPlcCount = model.plcs.length - disconnectedPlcs.length
  const plcStatusText = disconnectedPlcs.length === 0
    ? 'Conectado a 2/2 PLCs'
    : `Conectado a ${connectedPlcCount}/2 PLCs · Sin comunicación: ${disconnectedPlcs.map((plc) => plc.label).join(' y ')}`

  useEffect(() => {
    broker.setSubscriptions(TELEMETRY_TOPICS)
  }, [broker.setSubscriptions])

  useEffect(() => {
    if (!isAdmin && !['dashboard', 'historicos'].includes(active)) setActive('dashboard')
  }, [isAdmin, active])

  if (auth.checking) {
    return <div className="flex h-screen items-center justify-center bg-navy-950 text-sm font-semibold text-navy-200">Validando sesión…</div>
  }

  if (!auth.user) return <LoginPage onLogin={auth.login} />

  return (
    <div className="flex h-screen overflow-hidden bg-[#edf1f8]">
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
          active={active}
          onLogout={() => {
            setActive('dashboard')
            auth.logout()
          }}
        />

        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(125,220,236,.16),transparent_28%),linear-gradient(180deg,#f3f6fc_0%,#edf1f8_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {active === 'dashboard' ? (
            <>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-live-600">Centro de control</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-navy-900 sm:text-3xl">Operación en tiempo real</h1>
                </div>
                <span className={disconnectedPlcs.length === 0 ? 'inline-flex items-center gap-2 rounded-full bg-status-goodBg px-3 py-2 text-xs font-bold text-status-good' : 'inline-flex items-center gap-2 rounded-full bg-status-criticalBg px-3 py-2 text-xs font-bold text-status-critical'}><span className="h-2 w-2 rounded-full bg-current" />{plcStatusText}</span>
              </div>
              <DashboardOverview model={model} broker={broker} alarmCount={liveTelemetry.activeAlarms.length} />
            </>
          ) : active === 'historicos' ? (
            <HistoryPage model={model} />
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
