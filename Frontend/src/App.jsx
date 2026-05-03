import { useMemo, useState } from 'react'
import Home from './pages/Home/Home'
import BioFeedbackJournal from './pages/Journal/BioFeedbackJournal'
import PredictiveTrends from './pages/PredictionTrends/PredictiveTrends'
import Intervention from './pages/Intervention/Intervention'
import DataVault from './pages/DataVault/DataVault'
import AssistantPage from './pages/Assistant/AssistantPage'
import VoiceAssistant from './components/VoiceAssistant'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

const TABS = ['pulse', 'journal', 'trends', 'intervention', 'vault', 'assistant']

const App = () => {
  const [activeTab, setActiveTab] = useState('pulse')

  const page = useMemo(() => {
    if (activeTab === 'journal') return <BioFeedbackJournal key="journal" onNavigate={setActiveTab} />
    if (activeTab === 'trends') return <PredictiveTrends key="trends" onNavigate={setActiveTab} />
    if (activeTab === 'intervention') return <Intervention key="intervention" onNavigate={setActiveTab} />
    if (activeTab === 'vault') return <DataVault key="vault" onNavigate={setActiveTab} />
    if (activeTab === 'assistant') return <AssistantPage key="assistant" onNavigate={setActiveTab} />
    return <Home key="home" onNavigate={setActiveTab} />
  }, [activeTab])

  const activeIndex = TABS.indexOf(activeTab)

  return (
    <div className="sama-app" data-tab={activeTab}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
          transition={{
            duration: 0.45,
            ease: [0.23, 1, 0.32, 1],
          }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {page}
        </motion.div>
      </AnimatePresence>

      <VoiceAssistant activeTab={activeTab} />
      <button type="button" className="sama-voice-fab" onClick={() => setActiveTab('assistant')} aria-label="Open Sama assistant page">
        <span className="material-symbols-outlined">graphic_eq</span>
      </button>

      <div className="sama-tab-strip" role="tablist" aria-label="Sama pages" style={{ '--active-index': activeIndex }}>
        <div className="sama-tab-bg" aria-hidden="true">
          <div className="sama-tab-blob" />
        </div>
        <div className="sama-tab-list">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`sama-tab-chip ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0">
        <filter id="sama-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
    </div>
  )
}

export default App
