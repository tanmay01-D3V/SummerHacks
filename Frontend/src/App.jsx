import { useMemo, useState } from 'react'
import Home from './pages/Home/Home'
import PredictiveTrends from './pages/PredictionTrends/PredictiveTrends'
import Intervention from './pages/Intervention/Intervention'
import DataVault from './pages/DataVault/DataVault'
import './index.css'

const TABS = ['pulse', 'trends', 'intervention', 'vault']

const App = () => {
  const [activeTab, setActiveTab] = useState('pulse')

  const page = useMemo(() => {
    if (activeTab === 'trends') return <PredictiveTrends onNavigate={setActiveTab} />
    if (activeTab === 'intervention') return <Intervention onNavigate={setActiveTab} />
    if (activeTab === 'vault') return <DataVault onNavigate={setActiveTab} />
    return <Home onNavigate={setActiveTab} />
  }, [activeTab])

  return (
    <div className="aura-app" data-tab={activeTab}>
      {page}
      <div className="aura-tab-strip" role="tablist" aria-label="Aura pages">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`aura-tab-chip ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App