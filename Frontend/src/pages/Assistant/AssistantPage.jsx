import { useState } from 'react'
import AuraLayout from '../../components/AuraLayout'
import { PromptInputBox } from '../../components/ui/ai-prompt-box'
import './assistant.css'

const AssistantPage = ({ onNavigate }) => {
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      text: 'Welcome to Aura Assistant. Share your stress, sleep, or body discomfort and I will give grounded calming steps.',
    },
  ])

  const onSend = (message, files = []) => {
    const attachment = files.length > 0 ? ` (with ${files.length} image attachment)` : ''
    setHistory((prev) => [
      ...prev,
      { role: 'user', text: `${message}${attachment}` },
      {
        role: 'assistant',
        text: 'Immediate: inhale 4s, exhale 6s for 90 seconds. Next hour: take a 10-minute walk and hydrate. Today: block one low-priority task and give yourself a recovery window tonight.',
      },
    ])
  }

  return (
    <AuraLayout active="pulse" title="Aura Assistant" onNavigate={onNavigate}>
      <section className="assistant-hero soft-card">
        <div>
          <p className="assistant-eyebrow">Voice and Prompt Care</p>
          <h2>Your calm co-pilot</h2>
          <p className="assistant-sub">Talk naturally about mental or physical strain. Aura responds with immediate, next-hour, and today-level support.</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&w=1200&q=80"
          alt="Calm gradient abstract visual"
          className="assistant-hero-image"
        />
      </section>

      <section className="assistant-grid">
        <article className="soft-card assistant-log">
          <h3>Conversation</h3>
          <div className="assistant-messages">
            {history.map((item, idx) => (
              <div key={`${item.role}-${idx}`} className={`assistant-message ${item.role}`}>
                {item.text}
              </div>
            ))}
          </div>
        </article>

        <article className="soft-card assistant-input-wrap">
          <h3>Ask Aura</h3>
          <PromptInputBox onSend={onSend} placeholder="Tell Aura how your body and mind feel..." />
        </article>
      </section>
    </AuraLayout>
  )
}

export default AssistantPage
