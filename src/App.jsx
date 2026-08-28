import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import SystemDiagram from './components/SystemDiagram.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import LevelHistoryChart from './components/LevelHistoryChart.jsx'
import AlarmsPanel from './components/AlarmsPanel.jsx'
import { useTelemetry } from './hooks/useTelemetry.js'

export default function App() {
  const telemetry = useTelemetry()
  const [active, setActive] = useState('dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      <Sidebar active={active} onNavigate={setActive} alarmCount={telemetry.activeAlarms.length} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header alarmCount={telemetry.activeAlarms.length} onMenu={() => {}} />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:gap-5 lg:p-6">
          <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 lg:gap-5 xl:grid-cols-3">
            <div className="min-h-0 xl:col-span-2">
              <SystemDiagram telemetry={telemetry} />
            </div>
            <ControlPanel telemetry={telemetry} />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 lg:gap-5 xl:grid-cols-3">
            <div className="min-h-0 xl:col-span-2">
              <LevelHistoryChart telemetry={telemetry} />
            </div>
            <AlarmsPanel telemetry={telemetry} />
          </div>
        </main>
      </div>
    </div>
  )
}
