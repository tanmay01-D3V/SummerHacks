import { useMemo, useState } from 'react'
import { buildWellnessContext, getAssistantReply } from '../utils/auraAssistant'

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition

const VoiceAssistant = ({ activeTab }) => {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am your Aura voice assistant. Tell me how you are feeling mentally or physically, and I will suggest grounded next steps.',
    },
  ])

  const context = useMemo(() => buildWellnessContext(activeTab), [activeTab])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const askAssistant = async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || loading) return

    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: message }])

    try {
      const reply = await getAssistantReply({ message, context })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to contact assistant.')
    } finally {
      setLoading(false)
    }
  }

  const startVoiceCapture = () => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    setError('')
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setListening(true)
    recognition.onerror = () => {
      setListening(false)
      setError('Voice capture failed. Please try again.')
    }
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      setInput(transcript)
      askAssistant(transcript)
    }
    recognition.start()
  }

  return (
    <>
      <button
        type="button"
        className="aura-voice-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI voice assistant"
      >
        <span className="material-symbols-outlined">graphic_eq</span>
      </button>

      {open && (
        <section className="aura-voice-panel soft-card" aria-live="polite">
          <header className="aura-voice-header">
            <div>
              <h3>Aura Voice Care</h3>
              <p>Mental + physical wellness guidance based on your current state.</p>
            </div>
            <button type="button" className="aura-tab-chip" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>

          <div className="aura-voice-log">
            {messages.map((msg, idx) => (
              <article key={`${msg.role}-${idx}`} className={`aura-bubble ${msg.role}`}>
                {msg.content}
              </article>
            ))}
            {loading && <article className="aura-bubble assistant">Thinking...</article>}
          </div>

          {error && <p className="aura-voice-error">{error}</p>}

          <div className="aura-voice-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell Aura how you feel..."
              className="aura-voice-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') askAssistant(input)
              }}
            />
            <button type="button" className="aura-tab-chip is-active" onClick={() => askAssistant(input)} disabled={loading}>
              Send
            </button>
            <button type="button" className={`aura-tab-chip ${listening ? 'is-active' : ''}`} onClick={startVoiceCapture} disabled={loading}>
              {listening ? 'Listening...' : 'Voice'}
            </button>
          </div>
        </section>
      )}
    </>
  )
}

export default VoiceAssistant
