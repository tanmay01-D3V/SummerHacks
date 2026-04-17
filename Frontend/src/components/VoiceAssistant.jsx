import { useMemo, useState, useEffect } from 'react'
import { buildWellnessContext, getAssistantReply } from '../utils/auraAssistant'

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition

// Get browser info
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  return 'Unknown'
}

// Supported languages for speech recognition and synthesis
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', voiceName: 'en-US' },
  { code: 'en-GB', name: 'English (UK)', voiceName: 'en-GB' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', voiceName: 'hi-IN' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', voiceName: 'mr-IN' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)', voiceName: 'gu-IN' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', voiceName: 'ta-IN' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', voiceName: 'te-IN' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', voiceName: 'kn-IN' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)', voiceName: 'bn-IN' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)', voiceName: 'pa-IN' },
  { code: 'es-ES', name: 'Español (Spanish)', voiceName: 'es-ES' },
  { code: 'fr-FR', name: 'Français (French)', voiceName: 'fr-FR' },
  { code: 'de-DE', name: 'Deutsch (German)', voiceName: 'de-DE' },
  { code: 'it-IT', name: 'Italiano (Italian)', voiceName: 'it-IT' },
  { code: 'pt-BR', name: 'Português (Portuguese)', voiceName: 'pt-BR' },
  { code: 'ar-SA', name: 'العربية (Arabic)', voiceName: 'ar-SA' },
  { code: 'zh-CN', name: '中文 (Chinese)', voiceName: 'zh-CN' },
  { code: 'ja-JP', name: '日本語 (Japanese)', voiceName: 'ja-JP' },
  { code: 'ko-KR', name: '한국어 (Korean)', voiceName: 'ko-KR' },
]

const VoiceAssistant = ({ activeTab }) => {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [availableVoices, setAvailableVoices] = useState([])
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true)
  const [browserInfo] = useState(() => getBrowserInfo())
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am your Aura voice assistant. I can help in multiple languages including English, Hindi, Marathi, Gujarati, Tamil, Telugu, and more. Tell me how you are feeling mentally or physically, and I will suggest grounded next steps.',
    },
  ])

  const context = useMemo(() => buildWellnessContext(activeTab), [activeTab])

  useEffect(() => {
    const checkSpeechSupport = () => {
      const Recognition = getSpeechRecognition()
      setSpeechSupported(!!Recognition)
      if (!Recognition) {
        console.warn('Speech recognition not supported in this browser')
      }
    }

    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        console.log('Available voices:', voices.length)
      }
    }

    checkSpeechSupport()
    loadVoices()

    // Load voices when they become available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Try to find a voice for the selected language
    const selectedLangData = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage)
    if (selectedLangData && availableVoices.length > 0) {
      const preferredVoice = availableVoices.find(voice =>
        voice.lang.startsWith(selectedLangData.voiceName.split('-')[0]) ||
        voice.lang === selectedLangData.voiceName
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
        console.log('Using voice:', preferredVoice.name, 'for language:', selectedLanguage)
      }
    }

    utterance.lang = selectedLanguage
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => console.log('Speech started')
    utterance.onend = () => console.log('Speech ended')
    utterance.onerror = (e) => console.error('Speech error:', e)

    window.speechSynthesis.speak(utterance)
  }

  const askAssistant = async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || loading) return

    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: message }])

    try {
      const reply = await getAssistantReply({ message, context, language: selectedLanguage })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (textToSpeechEnabled) {
        speak(reply)
      }
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to contact assistant.')
    } finally {
      setLoading(false)
    }
  }

  const testVoiceCapture = async () => {
    if (!speechSupported) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError('Speech recognition API not available.')
      return
    }

    setError('')
    const recognition = new Recognition()
    recognition.lang = selectedLanguage
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Test speech recognition started')
      setListening(true)
    }

    recognition.onerror = (event) => {
      console.error('Test speech recognition error:', event.error)
      setListening(false)
      setError(`Test failed: ${event.error}`)
    }

    recognition.onend = () => {
      console.log('Test speech recognition ended')
      setListening(false)
    }

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      console.log('Test transcript:', transcript)
      setError(`Test successful! Heard: "${transcript}"`)
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start test speech recognition:', err)
      setError('Failed to start test voice capture.')
    }
  }

  const startVoiceCapture = async () => {
    console.log('🎤 startVoiceCapture called')
    console.log('Speech supported:', speechSupported)
    console.log('Selected language:', selectedLanguage)

    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      setError('Speech recognition is not supported in this browser. Please use text input or try a different browser like Chrome or Edge.')
      return
    }

    const Recognition = getSpeechRecognition()
    console.log('Recognition API:', Recognition)
    if (!Recognition) {
      alert('Speech recognition API not found. Please try Chrome, Edge, or Safari.')
      setError('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.')
      return
    }

    // Check for microphone permission
    try {
      console.log('Checking microphone permissions...')
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' })
      console.log('Permission status:', permissionStatus.state)
      if (permissionStatus.state === 'denied') {
        alert('Microphone permission is denied. Please click "Allow" when your browser asks for microphone access.')
        setError('Microphone permission is denied. Please enable microphone access in your browser settings.')
        return
      }
    } catch (err) {
      console.log('Permissions API not available:', err)
    }

    setError('')
    const recognition = new Recognition()

    // Configure recognition
    recognition.lang = selectedLanguage
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully')
      setListening(true)
    }

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error, event)
      setListening(false)

      let errorMessage = 'Voice capture failed. Please try again.'
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.'
          alert('Please click "Allow" when your browser asks for microphone access.')
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly into your microphone.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone connection.'
          break
        case 'network':
          errorMessage = 'Network error during speech recognition. Please check your connection.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }
      setError(errorMessage)
    }

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended')
      setListening(false)
    }

    recognition.onresult = (event) => {
      console.log('🎤 Speech recognition result:', event)
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      console.log('📝 Transcript:', transcript)

      if (transcript.trim()) {
        setInput(transcript)
        askAssistant(transcript)
      } else {
        setError('No speech detected. Please try speaking again.')
      }
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setError('Failed to start voice capture. Please try again.')
    }
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
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                Browser: {browserInfo} | Speech API: {speechSupported ? '✅ Supported' : '❌ Not Supported'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="aura-language-select"
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--outline)',
                  backgroundColor: 'var(--surface-container)',
                  color: 'var(--on-surface)',
                  fontSize: '12px'
                }}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`aura-tab-chip ${textToSpeechEnabled ? 'is-active' : ''}`}
                  onClick={() => setTextToSpeechEnabled(!textToSpeechEnabled)}
                  title={textToSpeechEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                  style={{ fontSize: '11px', padding: '4px 6px' }}
                >
                  🔊
                </button>
                <button type="button" className="aura-tab-chip" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </div>
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
            <button
              type="button"
              className="aura-tab-chip"
              onClick={() => {
                alert('To enable microphone:\n1. Click the lock/info icon in the address bar\n2. Find "Microphone" permission\n3. Set it to "Allow"\n4. Refresh the page and try again')
              }}
              title="Help with microphone permissions"
              style={{ fontSize: '11px', padding: '4px 6px' }}
            >
              🎙️ Help
            </button>
            <button type="button" className="aura-tab-chip" onClick={testVoiceCapture} disabled={loading || listening} title="Test voice recognition">
              Test Voice
            </button>
            <button
              type="button"
              className={`aura-tab-chip ${listening ? 'is-active' : ''}`}
              onClick={startVoiceCapture}
              disabled={loading || !speechSupported}
              title={!speechSupported ? 'Speech recognition not supported in this browser' : listening ? 'Listening... Click to stop' : 'Click to start voice input'}
            >
              {listening ? 'Listening...' : 'Voice'}
            </button>
            {!speechSupported && (
              <div style={{
                backgroundColor: 'var(--error-container)',
                color: 'var(--on-error-container)',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '12px',
                fontSize: '14px'
              }}>
                <strong>⚠️ Speech Recognition Not Supported</strong>
                <p>Your browser ({browserInfo}) doesn't support voice input. Please try:</p>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Google Chrome</li>
                  <li>Microsoft Edge</li>
                  <li>Apple Safari</li>
                </ul>
                <p>Or use the text input below instead.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export default VoiceAssistant
