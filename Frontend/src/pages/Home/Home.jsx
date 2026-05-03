import { useEffect, useState } from 'react'
import SamaLayout from '../../components/SamaLayout'
import { Input } from '../../components/ui/input'
import { Slider } from '../../components/ui/slider'
import { createRecord, fetchHomeSummary, getStoredAuthSession } from '../../lib/samaApi'
import './home.css'

const POLL_INTERVAL_MS = 8000

const formatTime = (value) => {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const emptySummary = {
  headline: 'Sign in to load your live home summary.',
  headlineDetail: 'Once you add records, this page will pull the real dashboard data from MongoDB.',
  stressIndex: 64,
  restingHeartRate: 72,
  oxygenLevel: 98,
  focusHours: 0,
  focusMinutes: 0,
  moodLabel: 'Steady',
  moodNote: 'No mood data yet.',
  mealCount: 0,
  mealTarget: 4,
  mealTargetReached: false,
  mealNote: '4 meal(s) left today.',
  hydrationCount: 0,
  hydrationTarget: 8,
  hydrationTargetReached: false,
  hydrationNote: '8 litre(s) left today.',
  totalRecords: 0,
  todayRecords: 0,
  lastUpdatedAt: null,
}

const Home = ({ onNavigate }) => {
  const [session, setSession] = useState(() => getStoredAuthSession())
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [savingType, setSavingType] = useState('')
  const [error, setError] = useState('')
  const [syncState, setSyncState] = useState('idle')
  const [mealNote, setMealNote] = useState('')
  const [hydrationNote, setHydrationNote] = useState('')
  const savingTypeRef = { current: savingType }
  useEffect(() => { savingTypeRef.current = savingType }, [savingType])

  // Focus Timer State
  const [isFocusing, setIsFocusing] = useState(false)
  const [focusStartTime, setFocusStartTime] = useState(null)
  const [elapsedSessionTime, setElapsedSessionTime] = useState(0)

  useEffect(() => {
    const savedStart = localStorage.getItem('sama-focus-start')
    if (savedStart) {
      const startTime = new Date(savedStart)
      setFocusStartTime(startTime)
      setIsFocusing(true)
    }
  }, [])

  useEffect(() => {
    let interval
    if (isFocusing && focusStartTime) {
      const update = () => {
        const diff = Math.floor((new Date() - focusStartTime) / 1000)
        setElapsedSessionTime(Math.max(0, diff))
      }
      update()
      interval = setInterval(update, 1000)
    } else {
      setElapsedSessionTime(0)
    }
    return () => clearInterval(interval)
  }, [isFocusing, focusStartTime])

  const formatElapsed = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? hrs + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleStartFocus = () => {
    const now = new Date()
    setFocusStartTime(now)
    setIsFocusing(true)
    localStorage.setItem('sama-focus-start', now.toISOString())
  }

  const handleStopFocus = async () => {
    if (!focusStartTime) return
    const now = new Date()
    const durationMs = now - focusStartTime
    const durationHours = durationMs / 3600000
    const durationMinutes = Math.floor(durationMs / 60000)
    
    // Minimum 5 seconds to record
    if (durationMs > 5000) {
      await handleQuickLog('focus_session', {
        title: 'Focus session',
        value: { 
          hours: Number(durationHours.toFixed(4)), 
          minutes: durationMinutes,
          note: 'Timed focus session completed.' 
        },
        payload: { 
          hours: Number(durationHours.toFixed(4)), 
          minutes: durationMinutes,
          note: 'Timed focus session completed.' 
        },
        tags: ['home', 'focus', 'timed'],
      })
    }

    setIsFocusing(false)
    setFocusStartTime(null)
    localStorage.removeItem('sama-focus-start')
  }

  useEffect(() => {
    const syncSession = () => setSession(getStoredAuthSession())
    window.addEventListener('storage', syncSession)
    window.addEventListener('sama-auth-changed', syncSession)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('sama-auth-changed', syncSession)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let pollId

    const loadSummary = async () => {
      const currentSession = getStoredAuthSession()
      if (!currentSession?.token) {
        if (!cancelled) {
          setSummary(emptySummary)
          setLoading(false)
          setSyncState('signed-out')
          setError('')
        }
        return
      }

      try {
        if (!cancelled) {
          setSyncState('syncing')
          setError('')
        }

        const { summary: nextSummary } = await fetchHomeSummary(currentSession.token)
        if (cancelled) return

        setSummary(prev => ({
          ...prev,
          ...nextSummary,
          focusMinutes: savingTypeRef.current === 'focus_session' ? prev.focusMinutes : (nextSummary.focusMinutes ?? prev.focusMinutes),
          focusHours: savingTypeRef.current === 'focus_session' ? prev.focusHours : (nextSummary.focusHours ?? prev.focusHours),
          mealCount: savingTypeRef.current === 'meal_log' ? prev.mealCount : (nextSummary.mealCount ?? prev.mealCount),
          hydrationCount: savingTypeRef.current === 'hydration_log' ? prev.hydrationCount : (nextSummary.hydrationCount ?? prev.hydrationCount),
        }))
        setSession(currentSession)
        setSyncState('live')
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError.message || 'Unable to load live dashboard data.')
        setSyncState('error')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSummary()
    pollId = window.setInterval(loadSummary, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
    }
  }, [])

  const reloadSummary = async () => {
    const currentSession = getStoredAuthSession()
    if (!currentSession?.token) return
    const { summary: nextSummary } = await fetchHomeSummary(currentSession.token)
    setSummary(prev => ({
      ...prev,
      ...nextSummary,
      focusMinutes: savingTypeRef.current === 'focus_session' ? prev.focusMinutes : (nextSummary.focusMinutes ?? prev.focusMinutes),
      focusHours: savingTypeRef.current === 'focus_session' ? prev.focusHours : (nextSummary.focusHours ?? prev.focusHours),
      mealCount: savingTypeRef.current === 'meal_log' ? prev.mealCount : (nextSummary.mealCount ?? prev.mealCount),
      hydrationCount: savingTypeRef.current === 'hydration_log' ? prev.hydrationCount : (nextSummary.hydrationCount ?? prev.hydrationCount),
    }))
    setSyncState('live')
  }

  const handleQuickLog = async (type, payload) => {
    const currentSession = getStoredAuthSession()
    if (!currentSession?.token) {
      setError('Sign in to write live wellness records.')
      return
    }

    let previousSummary = null
    try {
      setSavingType(type)
      setError('')
      const amount = Number(payload?.value?.amount ?? payload?.payload?.amount ?? 1) || 1
      previousSummary = summary
      setSummary((prev) => {
        if (type === 'meal_log') {
          const nextMealCount = Math.min((prev.mealCount || 0) + amount, prev.mealTarget || 4)
          return {
            ...prev,
            mealCount: nextMealCount,
            mealTargetReached: nextMealCount >= (prev.mealTarget || 4),
            mealNote: nextMealCount >= (prev.mealTarget || 4)
              ? 'Meal target reached for today.'
              : `${Math.max((prev.mealTarget || 4) - nextMealCount, 0)} meal(s) left today.`,
          }
        }

        if (type === 'hydration_log') {
          const nextHydrationCount = Math.min((prev.hydrationCount || 0) + amount, prev.hydrationTarget || 8)
          return {
            ...prev,
            hydrationCount: nextHydrationCount,
            hydrationTargetReached: nextHydrationCount >= (prev.hydrationTarget || 8),
            hydrationNote: nextHydrationCount >= (prev.hydrationTarget || 8)
              ? 'Hydration target reached for today.'
              : `${Math.max((prev.hydrationTarget || 8) - nextHydrationCount, 0)} litre(s) left today.`,
          }
        }

        if (type === 'focus_session') {
          const addedMins = Number(payload?.value?.minutes ?? 0)
          const addedHours = Number(payload?.value?.hours ?? 0)
          return {
            ...prev,
            focusMinutes: (prev.focusMinutes || 0) + addedMins,
            focusHours: (prev.focusHours || 0) + addedHours,
          }
        }

        return prev
      })

      const { record } = await createRecord(currentSession.token, {
        type,
        source: 'home-dashboard',
        ...payload,
      })

      if (type === 'meal_log' || type === 'hydration_log') {
        const savedAmount = Number(record?.value?.amount ?? record?.payload?.amount ?? amount) || amount
        setSummary((prev) => {
          if (type === 'meal_log') {
            const nextMealCount = Math.min((prev.mealCount || 0) + Math.max(savedAmount, 1), prev.mealTarget || 4)
            return {
              ...prev,
              mealCount: nextMealCount,
              mealTargetReached: nextMealCount >= (prev.mealTarget || 4),
              mealNote: nextMealCount >= (prev.mealTarget || 4)
                ? 'Meal target reached for today.'
                : `${Math.max((prev.mealTarget || 4) - nextMealCount, 0)} meal(s) left today.`,
            }
          }

          if (type === 'hydration_log') {
            const nextHydrationCount = Math.min((prev.hydrationCount || 0) + Math.max(savedAmount, 1), prev.hydrationTarget || 8)
            return {
              ...prev,
              hydrationCount: nextHydrationCount,
              hydrationTargetReached: nextHydrationCount >= (prev.hydrationTarget || 8),
              hydrationNote: nextHydrationCount >= (prev.hydrationTarget || 8)
                ? 'Hydration target reached for today.'
                : `${Math.max((prev.hydrationTarget || 8) - nextHydrationCount, 0)} litre(s) left today.`,
            }
          }

          return prev
        })
        return
      }

      await reloadSummary()
    } catch (saveError) {
      if (previousSummary) {
        setSummary(previousSummary)
      }
      setError(saveError.message || 'Failed to save record.')
    } finally {
      setSavingType('')
    }
  }

  return (
    <SamaLayout active="pulse" title="Sama" onNavigate={onNavigate}>
      <section className="home-dashboard-shell">
        <article className="soft-card home-hero-card">
          <span className="material-symbols-outlined home-hero-icon">auto_awesome</span>
          <div className="home-hero-copy">
            <p className="home-kicker">Live insight</p>
            <h2>{summary.headline}</h2>
            <p>{summary.headlineDetail}</p>
          </div>
          <button
            type="button"
            className="sama-btn is-mood"
            onClick={() =>
              handleQuickLog('mood_checkin', {
                title: 'Mood check-in',
                value: { label: 'Calm', note: 'Manual mood update from the home dashboard.' },
                payload: { label: 'Calm', note: 'Manual mood update from the home dashboard.' },
                tags: ['home', 'mood'],
              })
            }
            disabled={savingType === 'mood_checkin' || !session?.token}
          >
            {savingType === 'mood_checkin' ? 'Saving...' : 'Log mood'}
          </button>
        </article>

        <div className="home-summary-grid">
          <article className="soft-card home-pulse-card">
            <div className="home-section-head">
              <div>
                <p className="home-kicker">Current state</p>
                <h3>Pulse</h3>
              </div>
              <p className="home-quote">"Deep breaths, clear minds."</p>
            </div>
            <div className="home-pulse-orb">
              <div className="home-pulse-ring home-pulse-ring-outer" />
              <div className="home-pulse-ring home-pulse-ring-inner" />
              <div className="home-pulse-core">
                <div className="home-pulse-number">{summary.stressIndex}</div>
                <div className="home-pulse-label">Stress index</div>
              </div>
              <div className="home-status-chip home-status-chip-heart">
                <span className="material-symbols-outlined">monitor_heart</span>
                {summary.restingHeartRate} bpm
              </div>
              <div className="home-status-chip home-status-chip-oxygen">
                <span className="material-symbols-outlined">air</span>
                {summary.oxygenLevel}% O2
              </div>
            </div>
            {error ? <p className="home-error-banner">{error}</p> : null}
          </article>

          <div className="home-stack">
            <article className="soft-card home-notes-card">
              <h3>What you need</h3>
              <div className="home-target-stack">
                <div className="home-target-row">
                  <div className="home-target-head">
                    <div>
                      <p className="home-note-label">Meal target</p>
                      <strong>
                        {summary.mealCount} / {summary.mealTarget} meals
                      </strong>
                    </div>
                    <span className={`home-target-badge ${summary.mealTargetReached ? 'is-complete' : ''}`}>
                      {summary.mealTargetReached ? 'Reached' : 'Pending'}
                    </span>
                  </div>
                  <Slider
                    value={[summary.mealCount]}
                    min={0}
                    max={4}
                    step={1}
                    disabled
                    aria-label="Meal amount"
                    className="home-target-slider"
                  />
                  <div className="home-target-inline">
                    <Input
                      className="home-target-input"
                      type="text"
                      placeholder="Meal note"
                      value={mealNote}
                      onChange={(event) => setMealNote(event.target.value)}
                    />
                    <button
                      type="button"
                      className="sama-btn is-meal home-target-save"
                      onClick={() => {
                        handleQuickLog('meal_log', {
                          title: mealNote.trim() || 'Meal logged',
                          value: {
                            note: mealNote.trim() || 'Meal logged from the home dashboard.',
                            amount: 1,
                          },
                          payload: {
                            note: mealNote.trim() || 'Meal logged from the home dashboard.',
                            amount: 1,
                          },
                          tags: ['home', 'meal'],
                        })
                        setMealNote('')
                      }}
                      disabled={savingType === 'meal_log' || !session?.token}
                    >
                      {savingType === 'meal_log' ? 'Saving...' : 'Save meal'}
                    </button>
                  </div>
                </div>

                <div className="home-target-row">
                  <div className="home-target-head">
                    <div>
                      <p className="home-note-label">Hydration target</p>
                      <strong>
                        {summary.hydrationCount} / {summary.hydrationTarget} litres
                      </strong>
                    </div>
                    <span className={`home-target-badge ${summary.hydrationTargetReached ? 'is-complete' : ''}`}>
                      {summary.hydrationTargetReached ? 'Reached' : 'Pending'}
                    </span>
                  </div>
                  <Slider
                    value={[summary.hydrationCount]}
                    min={0}
                    max={8}
                    step={1}
                    disabled
                    aria-label="Hydration amount"
                    className="home-target-slider home-target-slider-hydration"
                  />
                  <div className="home-target-inline">
                    <Input
                      className="home-target-input"
                      type="text"
                      placeholder="Water note"
                      value={hydrationNote}
                      onChange={(event) => setHydrationNote(event.target.value)}
                    />
                    <button
                      type="button"
                      className="sama-btn is-water home-target-save"
                      onClick={() => {
                        handleQuickLog('hydration_log', {
                          title: hydrationNote.trim() || 'Hydration logged',
                          value: {
                            note: hydrationNote.trim() || 'Water logged from the home dashboard.',
                            amount: 1,
                          },
                          payload: {
                            note: hydrationNote.trim() || 'Water logged from the home dashboard.',
                            amount: 1,
                          },
                          tags: ['home', 'hydration'],
                        })
                        setHydrationNote('')
                      }}
                      disabled={savingType === 'hydration_log' || !session?.token}
                    >
                      {savingType === 'hydration_log' ? 'Saving...' : 'Save water'}
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <article className="soft-card home-focus-card">
              <div className="home-focus-header">
                <h3>Focus Time</h3>
                {isFocusing && <div className="home-focus-badge"><span className="home-focus-dot"></span> Rec</div>}
              </div>
              
              <div className="home-focus-display">
                <div className="home-focus-main">
                  {(summary.focusMinutes || 0) < 60 ? (
                    <p className="home-focus-hours">{summary.focusMinutes || 0}<span>m</span></p>
                  ) : (
                    <p className="home-focus-hours">{Math.floor(summary.focusHours || 0)}<span>h</span> {Math.round((summary.focusMinutes || 0) % 60)}<span>m</span></p>
                  )}
                  <p className="home-focus-label">Today's total</p>
                </div>
                {isFocusing && (
                  <div className="home-focus-session">
                    <p className="home-focus-timer">{formatElapsed(elapsedSessionTime)}</p>
                    <p className="home-focus-label">Current session</p>
                  </div>
                )}
              </div>

              <p className="home-focus-note">Focus resets at midnight. Timed sessions are added to your daily total upon stopping.</p>
              
              <button
                type="button"
                className={`sama-btn ${isFocusing ? 'is-stop' : 'is-focus'}`}
                onClick={isFocusing ? handleStopFocus : handleStartFocus}
                disabled={savingType === 'focus_session' || !session?.token}
              >
                {savingType === 'focus_session' ? 'Saving...' : isFocusing ? 'Stop Focus' : 'Start Focus'}
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="soft-card home-quick-actions">
        <div className="home-section-head">
          <div>
            <p className="home-kicker">Quick log</p>
            <h3>Save live data</h3>
          </div>
          <button
            type="button"
            className="sama-btn is-water"
            onClick={() =>
              handleQuickLog('hydration_log', {
                title: 'Hydration log',
                value: { glasses: 1, note: 'Water logged from the home page.' },
                payload: { glasses: 1, note: 'Water logged from the home page.' },
                tags: ['home', 'hydration'],
              })
            }
            disabled={savingType === 'hydration_log' || !session?.token}
          >
            {savingType === 'hydration_log' ? 'Saving...' : 'Log water'}
          </button>
        </div>
        <p className="home-quick-copy">
          The page now uses a summary endpoint at `/api/home/summary` and only pulls the data the home screen needs.
        </p>
      </section>
    </SamaLayout>
  )
}

export default Home
