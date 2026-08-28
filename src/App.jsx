import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import SystemDiagram from './components/SystemDiagram.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import StatTiles from './components/StatTiles.jsx'
import LevelHistoryChart from './components/LevelHistoryChart.jsx'
import AlarmsPanel from './components/AlarmsPanel.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'

export default function App() {
  const telemetry = useTelemetry()
  const [active, setActive] = useState('dashboard')

  return (
    <div className="flex min-h-screen bg-navy-50">
      <Sidebar active={active} onNavigate={setActive} alarmCount={telemetry.activeAlarms.length} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header connected={telemetry.connected} now={telemetry.now} alarmCount={telemetry.activeAlarms.length} onMenu={() => {}} />

        <main className="flex-1 space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SystemDiagram telemetry={telemetry} />
            </div>
            <ControlPanel telemetry={telemetry} />
          </div>

          <StatTiles telemetry={telemetry} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LevelHistoryChart telemetry={telemetry} />
            </div>
            <AlarmsPanel telemetry={telemetry} />
          </div>
        </main>
      </div>
    </div>
  )
}
