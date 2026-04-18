import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AuraLayout from '../../components/AuraLayout'
import { createChatMessage, fetchChatHistory, getStoredAuthSession } from '../../lib/auraApi'
import { buildWellnessContext, getAssistantReply } from '../../utils/auraAssistant'
import './assistant.css'

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition

const AssistantPage = ({ onNavigate }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  
  const historyEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const textareaRef = useRef(null)

  useEffect(() => {
    const session = getStoredAuthSession()
    if (!session?.token) {
      setLoading(false)
      return
    }

    fetchChatHistory(session.token)
      .then((data) => {
        if (data.messages?.length) {
          setHistory(data.messages.map((m) => ({ role: m.role, text: m.content })))
        } else {
          setHistory([
            {
              role: 'assistant',
              text: 'Welcome to Aura Assistant. Share your stress, sleep, or body discomfort and I will give grounded calming steps.',
            },
          ])
        }
      })
      .catch((err) => console.error('Failed to load chat history:', err))
      .finally(() => setLoading(false))

    return () => {
      if (synthRef.current) synthRef.current.cancel()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputText])

  const onSend = async () => {
    const text = inputText.trim()
    if (!text || loading) return

    setInputText('')
    setHistory((prev) => [...prev, { role: 'user', text }])
    setLoading(true)

    const session = getStoredAuthSession()
    const context = buildWellnessContext('assistant')

    try {
      const reply = await getAssistantReply({ message: text, context })
      setHistory((prev) => [...prev, { role: 'assistant', text: reply }])
      
      // Persist to backend
      if (session?.token) {
        await createChatMessage(session.token, { role: 'user', content: text })
        await createChatMessage(session.token, { role: 'assistant', content: reply })
      }
    } catch (err) {
      console.error('Chat Error:', err)
      setHistory((prev) => [...prev, { role: 'assistant', text: "I'm having trouble responding. Please check your connection." }])
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const Recognition = getSpeechRecognition()
    if (!Recognition) return

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex][0].transcript
      setInputText(result)
    }
    recognition.onend = () => setIsListening(true) // Stay listening for the finish? No, toggle off.
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <AuraLayout active="pulse" title="Aura Assistant" onNavigate={onNavigate}>
      <div className="assistant-container">
        
        {/* Messages Feed */}
        <section className="aura-chat-history">
          <AnimatePresence initial={false}>
            {history.map((msg, idx) => (
              <motion.div 
                key={`${msg.role}-${idx}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`chat-message-group ${msg.role}`}
              >
                <div className="chat-bubble">
                  {msg.text}
                </div>
                <span className="chat-sender-label">{msg.role === 'user' ? 'You' : 'Aura'}</span>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="chat-message-group assistant"
              >
                <div className="chat-bubble" style={{ opacity: 0.6 }}>
                  Aura is thinking...
                </div>
              </motion.div>
            )}
            <div ref={historyEndRef} />
          </AnimatePresence>
        </section>

        {/* Bespoke Input Bar */}
        <footer className="aura-chat-input-wrap">
          <div className="aura-chat-input-inner">
            
            <button 
              className={`chat-icon-btn ${isListening ? 'active' : ''}`}
              onClick={toggleVoice}
              title="Speak to Aura"
            >
              <span className="material-symbols-outlined">
                {isListening ? 'stop_circle' : 'mic'}
              </span>
            </button>

            <textarea 
              ref={textareaRef}
              className="aura-chat-textarea"
              placeholder="Tell Aura how you feel..."
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
            />

            <div className="chat-action-btns">
              {isListening && <div className="mini-voice-orb" />}
              <button 
                className="chat-send-btn"
                onClick={onSend}
                disabled={!inputText.trim() || loading}
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </div>
        </footer>

      </div>
    </AuraLayout>
  )
}

export default AssistantPage
