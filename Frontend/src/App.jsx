import { useMemo, useState } from 'react'
import Home from './pages/Home/Home'
import PredictiveTrends from './pages/PredictionTrends/PredictiveTrends'
import Intervention from './pages/Intervention/Intervention'
import DataVault from './pages/DataVault/DataVault'
import AssistantPage from './pages/Assistant/AssistantPage'
import VoiceAssistant from './components/VoiceAssistant'
import './index.css'

const TABS = ['pulse', 'trends', 'intervention', 'vault', 'assistant']

const App = () => {
  const [activeTab, setActiveTab] = useState('pulse')

  const page = useMemo(() => {
    if (activeTab === 'trends') return <PredictiveTrends onNavigate={setActiveTab} />
    if (activeTab === 'intervention') return <Intervention onNavigate={setActiveTab} />
    if (activeTab === 'vault') return <DataVault onNavigate={setActiveTab} />
    if (activeTab === 'assistant') return <AssistantPage onNavigate={setActiveTab} />
    return <Home onNavigate={setActiveTab} />
  }, [activeTab])

  return (
    <div className="aura-app" data-tab={activeTab}>
      {page}
      <VoiceAssistant activeTab={activeTab} />
      <button type="button" className="aura-voice-fab" onClick={() => setActiveTab('assistant')} aria-label="Open Aura assistant page">
        <span className="material-symbols-outlined">graphic_eq</span>
      </button>
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