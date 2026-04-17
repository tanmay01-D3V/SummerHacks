import { useEffect, useState } from 'react'
import AuraLayout from '../../components/AuraLayout'
import { Input } from '../../components/ui/input'
import { Slider } from '../../components/ui/slider'
import { createRecord, fetchHomeSummary, getStoredAuthSession } from '../../lib/auraApi'
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

  useEffect(() => {
    const syncSession = () => setSession(getStoredAuthSession())
    window.addEventListener('storage', syncSession)
    window.addEventListener('aura-auth-changed', syncSession)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('aura-auth-changed', syncSession)
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

        setSummary({
          ...emptySummary,
          ...nextSummary,
        })
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
    setSummary({
      ...emptySummary,
      ...nextSummary,
    })
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
    <AuraLayout active="pulse" title="Aura" onNavigate={onNavigate}>
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
            className="aura-tab-chip is-active"
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
            <div className="home-status-meta">
              <span className={`home-sync-pill is-${syncState}`}>{loading ? 'Loading...' : syncState}</span>
              <span>{summary.totalRecords} records</span>
              <span>Updated {formatTime(summary.lastUpdatedAt)}</span>
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
                      className="aura-tab-chip is-active home-target-save"
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
                      className="aura-tab-chip is-active home-target-save"
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
              <h3>Focus Time</h3>
              <p className="home-focus-hours">{summary.focusHours}h</p>
              <p className="home-focus-note">This is the live value the Home page needs, not the raw record list.</p>
              <button
                type="button"
                className="aura-tab-chip is-active"
                onClick={() =>
                  handleQuickLog('focus_session', {
                    title: 'Focus session',
                    value: { minutes: 25, hours: 0.4, note: '25 minute focus sprint captured from the dashboard.' },
                    payload: { minutes: 25, hours: 0.4, note: '25 minute focus sprint captured from the dashboard.' },
                    tags: ['home', 'focus'],
                  })
                }
                disabled={savingType === 'focus_session' || !session?.token}
              >
                {savingType === 'focus_session' ? 'Saving...' : 'Add focus sprint'}
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
            className="aura-tab-chip"
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
    </AuraLayout>
  )
}

export default Home
