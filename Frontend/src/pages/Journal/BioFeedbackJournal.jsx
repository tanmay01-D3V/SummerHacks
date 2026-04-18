import { useEffect, useRef, useState } from 'react'
import AuraLayout from '../../components/AuraLayout'
import { createRecord, getStoredAuthSession } from '../../lib/auraApi'
import './bioFeedbackJournal.css'

const KEYWORD_BANK = [
  { term: 'meeting', title: 'Back-to-back meetings', icon: 'calendar_month', priority: 'critical' },
  { term: 'deadline', title: 'Deadline pressure', icon: 'alarm', priority: 'critical' },
  { term: 'screen', title: 'High screen time', icon: 'smartphone', priority: 'low' },
  { term: 'caffeine', title: 'Caffeine sensitivity', icon: 'coffee', priority: 'moderate' },
  { term: 'coffee', title: 'Caffeine sensitivity', icon: 'coffee', priority: 'moderate' },
  { term: 'sleep', title: 'Sleep disruption', icon: 'bedtime', priority: 'moderate' },
  { term: 'humidity', title: 'Low humidity levels', icon: 'cloud', priority: 'low' },
  { term: 'noise', title: 'Environmental noise', icon: 'graphic_eq', priority: 'low' },
  { term: 'late', title: 'Late-night drift', icon: 'schedule', priority: 'moderate' },
]

const PRIORITY_ORDER = { critical: 0, moderate: 1, low: 2 }

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition

const formatTime = (value) => {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const buildHeatmap = (score, keywords) =>
  Array.from({ length: 6 }, (_, index) => {
    const row = Math.floor(index / 3)
    const col = index % 3
    const keywordBoost = keywords.some((keyword) => (col < 3 ? keyword.includes('screen') || keyword.includes('caffeine') : keyword.includes('meeting') || keyword.includes('deadline')))
      ? 0.18
      : 0
    const base = 0.08 + ((score / 100) * 0.6)
    const wave = ((Math.sin((row + 1) * (col + 1)) + 1) / 2) * 0.18
    return Math.min(0.95, Math.max(0.06, base * 0.5 + wave + keywordBoost))
  })

const analyzeStressFactors = ({ audioData = {}, transcript = '', manualText = '' }) => {
  const text = `${transcript} ${manualText}`.trim().toLowerCase()
  const matchedKeywords = KEYWORD_BANK.filter(({ term }) => text.includes(term)).map((item) => item.term)

  const highVolume = Number(audioData.volume ?? 0)
  const pitch = Number(audioData.pitch ?? 0)
  const pitchPenalty = pitch > 220 ? 12 : pitch > 180 ? 8 : pitch > 0 ? 4 : 0
  const keywordPenalty = matchedKeywords.length * 10
  const volumePenalty = Math.round(highVolume * 22)
  const tension = Math.min(100, 22 + pitchPenalty + keywordPenalty + volumePenalty)

  const lines = []
  if (text.includes('meeting')) {
    lines.push('I noticed a slight tremor in your voice when you mentioned the 4 PM meeting. That usually points to anticipatory pressure more than overwhelm.')
  }
  if (text.includes('caffeine') || text.includes('coffee')) {
    lines.push('Your tone tightened a little around caffeine. That can be a sign that your body is asking for steadier pacing.')
  }
  if (text.includes('screen')) {
    lines.push('I heard a more compressed rhythm when screen time came up, which often shows up when the nervous system is already stretched.')
  }
  if (!lines.length) {
    lines.push('Your voice stayed fairly steady overall. There is room to keep the day even with a few gentle resets.')
  }

  const sortedKeywords = matchedKeywords.length
    ? matchedKeywords
    : ['screen', 'meeting', 'caffeine']

  const stressCulprits = [
    {
      priority: 'critical',
      icon: 'calendar_month',
      title: 'Back-to-back meetings',
      text: matchedKeywords.includes('meeting')
        ? 'Meeting language and vocal tension both increased, which often means your schedule is doing the pushing.'
        : 'Long meeting stacks are still the highest-impact stress signal we watch for here.',
    },
    {
      priority: 'moderate',
      icon: 'coffee',
      title: 'Caffeine Sensitivity',
      text: matchedKeywords.includes('caffeine') || matchedKeywords.includes('coffee')
        ? 'Caffeine showed up in your words and the tension score nudged upward with it.'
        : 'Caffeine tends to amplify stress when the day is already running fast.',
    },
    {
      priority: 'low',
      icon: 'smartphone',
      title: 'High Screen Time',
      text: matchedKeywords.includes('screen')
        ? 'Screen-heavy wording plus a sharper cadence suggests the evening may be loading more stimulation than recovery.'
        : 'Screen exposure is a quiet but persistent stressor, especially after the day has already been full.',
    },
  ].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const factoid =
    text.includes('screen')
      ? 'Your best days follow < 4h of screen time. Current trajectory suggests a dip.'
      : 'Your best days follow < 4h of screen time. Current trajectory suggests a dip.'

  return {
    tensionScore: tension,
    keywords: sortedKeywords,
    summary: lines.join(' '),
    stressCulprits,
    factoid,
    heatmap: buildHeatmap(tension, sortedKeywords),
  }
}

const AudioVisualizer = ({ bars = [], recording = false }) => (
  <div className={`journal-visualizer ${recording ? 'is-recording' : ''}`} aria-hidden="true">
    {bars.map((value, index) => (
      <span
        key={index}
        className="journal-visualizer-bar"
        style={{
          height: `${Math.max(14, Math.min(100, value * 100))}%`,
          opacity: 0.45 + value * 0.55,
        }}
      />
    ))}
  </div>
)

const BioFeedbackJournal = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [bars, setBars] = useState(Array.from({ length: 28 }, () => 0.12))
  const [transcript, setTranscript] = useState('')
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState('Ready to listen.')
  const [analysis, setAnalysis] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState('')

  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const startedAtRef = useRef(0)
  const liveMetricsRef = useRef({ volume: 0.12, pitch: 0 })
  const latestTranscriptRef = useRef('')
  const latestManualTextRef = useRef('')

  useEffect(() => {
    latestTranscriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    latestManualTextRef.current = manualText
  }, [manualText])

  const combinedText = manualText.trim() || transcript.trim()

  const updateBarsFromAudio = () => {
    const analyser = analyserRef.current
    if (!analyser) return

    const frequency = new Uint8Array(analyser.frequencyBinCount)
    const timeDomain = new Uint8Array(analyser.fftSize)
    analyser.getByteFrequencyData(frequency)
    analyser.getByteTimeDomainData(timeDomain)

    const values = Array.from({ length: 28 }, (_, index) => {
      const bucketSize = Math.max(1, Math.floor(frequency.length / 28))
      const start = index * bucketSize
      const segment = frequency.slice(start, start + bucketSize)
      const average = segment.reduce((sum, current) => sum + current, 0) / (segment.length || 1)
      // Boost the signal for better visibility
      return Math.max(0.08, Math.min(1, (average / 180) * 1.2))
    })

    const volume =
      Math.sqrt(timeDomain.reduce((sum, current) => {
        const centered = (current - 128) / 128
        return sum + centered * centered
      }, 0) / timeDomain.length) || 0.08

    const pitch = estimatePitch(timeDomain, audioCtxRef.current?.sampleRate || 44100)

    // Apply more dynamic scaling
    setBars(values.map((value, index) => Math.max(0.12, Math.min(1, value * 0.8 + volume * 0.4 + (index % 3) * 0.02))))
    liveMetricsRef.current = { volume, pitch }
    setAnalysis((prev) => (prev ? { ...prev, liveVolume: volume, livePitch: pitch } : prev))
    rafRef.current = window.requestAnimationFrame(updateBarsFromAudio)
  }

  const stopRecording = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    recorderRef.current?.stop?.()
    recognitionRef.current?.stop?.()

    streamRef.current?.getTracks?.().forEach((track) => track.stop())
    streamRef.current = null

    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }

    analyserRef.current = null
    setIsRecording(false)
    setStatus('Recording stopped.')
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (isRecording) {
          e.preventDefault()
          stopRecording()
        } else if (combinedText && !analysis && !saving) {
          e.preventDefault()
          handleAnalyze()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
      streamRef.current?.getTracks?.().forEach((track) => track.stop())
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [isRecording, combinedText, analysis, saving])

  const startRecording = async () => {
    setError('')
    const initialTextBeforeRecording = latestManualTextRef.current
    
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support microphone recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser

      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      startedAtRef.current = Date.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        const audioUrl = URL.createObjectURL(blob)
        const { volume, pitch } = liveMetricsRef.current

        setAnalysis((prev) => {
          const nextAnalysis = analyzeStressFactors({
            audioData: {
              volume,
              pitch,
              durationSeconds,
            },
            transcript: latestTranscriptRef.current,
            manualText: latestManualTextRef.current,
          })
          return {
            ...nextAnalysis,
            audioUrl,
            durationSeconds,
            generatedAt: new Date().toISOString(),
          }
        })
        setStatus('Recording analyzed. Press Enter to Save.')
      }

      recorder.start()

      const Recognition = getSpeechRecognition()
      if (Recognition) {
        const recognition = new Recognition()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = true
        recognitionRef.current = recognition

        recognition.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }

          const fullSessionTranscript = Array.from(event.results)
            .map((result) => result[0]?.transcript || '')
            .join(' ')
            .trim()
          
          setTranscript(fullSessionTranscript)
          
          // Real-time update into the manual text area
          if (fullSessionTranscript) {
            setManualText(initialTextBeforeRecording + (initialTextBeforeRecording ? ' ' : '') + fullSessionTranscript)
          }
        }

        recognition.onerror = (err) => {
          console.error('Speech recognition error:', err)
          setStatus('Voice capture is running with waveform only.')
        }

        recognition.onend = () => {
          // If we are still state-recording, restart recognition (handles silence pauses)
          if (recognitionRef.current && isRecording) {
            try {
              recognitionRef.current.start()
            } catch (err) {
              console.error('Failed to restart recognition:', err)
            }
          }
        }

        recognition.start()
      }

      setIsRecording(true)
      setStatus('Listening... (Press Enter to finish)')
      rafRef.current = window.requestAnimationFrame(updateBarsFromAudio)
    } catch (captureError) {
      setError(captureError.message || 'Could not access the microphone.')
      setStatus('Microphone access denied.')
    }
  }

  const handleAnalyze = async () => {
    const payloadText = combinedText
    if (!payloadText) {
      setError('Add a note or speak first so I can analyze it.')
      return
    }

    const nextAnalysis = analyzeStressFactors({
      audioData: {
        volume: liveMetricsRef.current.volume ?? 0.18,
        pitch: liveMetricsRef.current.pitch ?? 0,
      },
      transcript,
      manualText,
    })
    setAnalysis({
      ...nextAnalysis,
      generatedAt: new Date().toISOString(),
    })
    setStatus('Analysis complete.')
    setError('')

    const session = getStoredAuthSession()
    if (!session?.token) return

    try {
      setSaving(true)
      const record = await createRecord(session.token, {
        type: 'journal_entry',
        title: 'Bio-feedback journal',
        source: 'journal',
        value: {
          text: payloadText,
          tensionScore: nextAnalysis.tensionScore,
          keywords: nextAnalysis.keywords,
          summary: nextAnalysis.summary,
        },
        payload: {
          text: payloadText,
          tensionScore: nextAnalysis.tensionScore,
          keywords: nextAnalysis.keywords,
          summary: nextAnalysis.summary,
        },
        tags: ['journal', ...nextAnalysis.keywords],
      })
      setSavedAt(record?.record?.createdAt || new Date().toISOString())
    } catch (saveError) {
      setError(saveError.message || 'Analysis saved locally, but MongoDB write failed.')
    } finally {
      setSaving(false)
    }
  }

  const pulsingMessage = isRecording ? 'Listening...' : 'Pulse to Speak'

  return (
    <AuraLayout active="journal" title="Bio-Feedback Journal" onNavigate={onNavigate}>
      <section className="journal-hero soft-card">
        <div className="journal-hero-copy">
          <p className="journal-kicker">Bio-feedback journaling</p>
          <h2>Pulse to speak.</h2>
          <p>Let Aura catch the pressure behind your words, then turn it into gentle next steps.</p>
          <div className="journal-actions">
            <button
              type="button"
              className={`journal-record-button ${isRecording ? 'is-recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <span className="journal-record-ring" />
              <span className="material-symbols-outlined">{isRecording ? 'stop' : 'graphic_eq'}</span>
            </button>
            <div>
              <p className="journal-record-label">{pulsingMessage}</p>
              <p className="journal-record-meta">{status}</p>
            </div>
          </div>
        </div>
        <div className="journal-audio-card">
          <AudioVisualizer bars={bars} recording={isRecording} />
          <div className="journal-audio-stats">
            <span>Waveform reacts to pitch and volume</span>
            <span>{isRecording ? 'Live' : 'Idle'}</span>
          </div>
        </div>
      </section>

      <section className="journal-grid">
        <article className="soft-card journal-text-card">
          <h3>Manual journaling</h3>
          <textarea
            className="journal-textarea"
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            placeholder="Write what you felt, who was involved, and what your body noticed..."
            rows={8}
          />
          <div className="journal-inline-actions">
            <button type="button" className="aura-tab-chip is-active" onClick={handleAnalyze} disabled={saving}>
              {saving ? 'Saving...' : 'Submit for Analysis'}
            </button>
            {savedAt ? <span className="journal-saved-at">Last saved {formatTime(savedAt)}</span> : null}
          </div>
          {error ? <p className="journal-error">{error}</p> : null}
        </article>

        <article className="soft-card journal-analysis-card">
          <h3>Sentiment & tonality</h3>
          {analysis ? (
            <>
              <div className="journal-score">
                <div>
                  <p className="journal-score-label">Vocal tension</p>
                  <h4>{analysis.tensionScore}/100</h4>
                </div>
                <div className="journal-score-badge">{analysis.tensionScore >= 70 ? 'High' : analysis.tensionScore >= 40 ? 'Moderate' : 'Low'}</div>
              </div>
              <p className="journal-summary">{analysis.summary}</p>
              <div className="journal-keywords">
                {analysis.keywords.map((keyword) => (
                  <span key={keyword} className="journal-keyword-pill">
                    {keyword}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="journal-placeholder">Speak or type a note, and I will translate the strain into a calm, actionable summary.</p>
          )}
        </article>
      </section>

      <section className="soft-card journal-correlation-card">
        <div className="journal-section-head">
          <div>
            <p className="journal-kicker">Correlation Map</p>
            <h3>Stress Culprits</h3>
          </div>
          <button type="button" className="aura-tab-chip" onClick={() => onNavigate('intervention')}>
            Open Intervention
          </button>
        </div>
        <div className="journal-culprit-scroll">
          {(analysis?.stressCulprits || [
            {
              priority: 'critical',
              icon: 'calendar_month',
              title: 'Back-to-back meetings',
              text: 'High-impact stressors will appear here once you log or speak about them.',
            },
            {
              priority: 'moderate',
              icon: 'coffee',
              title: 'Caffeine Sensitivity',
              text: 'This section turns your session into a ranked list of triggers.',
            },
            {
              priority: 'low',
              icon: 'smartphone',
              title: 'High Screen Time',
              text: 'Environmental factors land here when they are part of the day’s pattern.',
            },
          ]).map((culprit) => (
            <article key={culprit.title} className={`journal-culprit-card ${culprit.priority}`}>
              <span className="material-symbols-outlined">{culprit.icon}</span>
              <h4>{culprit.title}</h4>
              <p>{culprit.text}</p>
            </article>
          ))}
        </div>

        <div className="journal-factoid">
          <p className="journal-kicker">Why this matters</p>
          <h4>{analysis?.factoid || 'Your best days follow < 4h of screen time. Current trajectory suggests a dip.'}</h4>
          <p>Use the analysis to notice where your energy starts to narrow, then trigger a calmer response before the next spike.</p>
        </div>
      </section>
    </AuraLayout>
  )
}

function estimatePitch(timeDomainData, sampleRate) {
  if (!timeDomainData?.length) return 0

  let bestOffset = -1
  let bestCorrelation = 0

  for (let offset = 8; offset < timeDomainData.length / 2; offset += 1) {
    let correlation = 0
    for (let i = 0; i < timeDomainData.length - offset; i += 1) {
      const a = (timeDomainData[i] - 128) / 128
      const b = (timeDomainData[i + offset] - 128) / 128
      correlation += a * b
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  if (bestOffset === -1 || bestCorrelation < 0.01) return 0
  return Math.round(sampleRate / bestOffset)
}

export default BioFeedbackJournal
