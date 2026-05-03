import { useEffect, useMemo, useState } from 'react'
import SamaLayout from '../../components/SamaLayout'
import { ChartContainer, ChartTooltip } from '../../components/ui/line-charts-6'
import { fetchCorrelationAnalytics, fetchHomeSummary, getStoredAuthSession } from '../../lib/samaApi'
import { Line, LineChart, XAxis, YAxis } from 'recharts'
import './PredictiveTrends.css'

const outlookData = [
  { day: 'Mon', stress: 45, mood: 75 },
  { day: 'Tue', stress: 52, mood: 68 },
  { day: 'Wed', stress: 38, mood: 82 },
  { day: 'Thu', stress: 61, mood: 55 },
  { day: 'Fri', stress: 49, mood: 71 },
  { day: 'Sat', stress: 33, mood: 88 },
  { day: 'Sun', stress: 41, mood: 79 },
]

const chartConfig = {
  stress: {
    label: 'Stress Level',
    color: 'var(--color-teal-500)',
  },
  mood: {
    label: 'Mood Score',
    color: 'var(--color-lime-500)',
  },
}

const emptyTrendsSummary = {
  stressCulprits: [
    {
      icon: 'bolt',
      title: 'Waiting for live input',
      text: 'Log meals and hydration so this section can update from MongoDB in real time.',
    },
  ],
  lastUpdatedAt: null,
}

const emptyCorrelation = {
  grid: Array.from({ length: 28 }, (_, index) => ({
    id: `empty-${index}`,
    dateLabel: '',
    screenTimeHours: 0,
    nextDayMoodScore: null,
    densityWeight: 0.06,
    insight: 'Add screen-time and mood logs to reveal the correlation map.',
  })),
  summaryText: 'Add screen-time and mood logs to reveal the correlation map.',
  bestAverageScreen: 0,
  weightedAverageScreen: 0,
}

const formatTime = (value) => {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const mixHex = (start, end, weight) => {
  const clampWeight = Math.max(0, Math.min(1, weight))
  const parse = (hex) => {
    const normalized = hex.replace('#', '')
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    }
  }

  const s = parse(start)
  const e = parse(end)
  const channel = (from, to) => Math.round(from + (to - from) * clampWeight)

  return `rgb(${channel(s.r, e.r)} ${channel(s.g, e.g)} ${channel(s.b, e.b)})`
}

const PredictiveTrends = ({ onNavigate }) => {
  const [summary, setSummary] = useState(emptyTrendsSummary)
  const [syncState, setSyncState] = useState('idle')
  const [correlation, setCorrelation] = useState(emptyCorrelation)
  const [correlationState, setCorrelationState] = useState('idle')
  const [hoveredCell, setHoveredCell] = useState(null)

  useEffect(() => {
    const sync = async () => {
      const session = getStoredAuthSession()
      if (!session?.token) {
        setSummary(emptyTrendsSummary)
        setSyncState('signed-out')
        return
      }

      try {
        setSyncState('syncing')
        const { summary: nextSummary } = await fetchHomeSummary(session.token)
        setSummary({
          ...emptyTrendsSummary,
          ...nextSummary,
        })
        setSyncState('live')
      } catch {
        setSyncState('error')
      }
    }

    let cancelled = false
    let pollId

    const run = async () => {
      if (cancelled) return
      await sync()
    }

    run()
    pollId = window.setInterval(run, 8000)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
    }
  }, [])

  useEffect(() => {
    const syncCorrelation = async () => {
      const session = getStoredAuthSession()
      if (!session?.token) {
        setCorrelation(emptyCorrelation)
        setCorrelationState('signed-out')
        return
      }

      try {
        setCorrelationState('syncing')
        const { correlation: nextCorrelation } = await fetchCorrelationAnalytics(session.token)
        setCorrelation({
          ...emptyCorrelation,
          ...nextCorrelation,
        })
        setHoveredCell((prev) => {
          if (!nextCorrelation?.grid?.length) return null
          if (!prev) return nextCorrelation.grid[0] || null
          return nextCorrelation.grid.find((cell) => cell.id === prev.id) || nextCorrelation.grid[0] || null
        })
        setCorrelationState('live')
      } catch {
        setCorrelationState('error')
      }
    }

    let cancelled = false
    let pollId

    const run = async () => {
      if (cancelled) return
      await syncCorrelation()
    }

    run()
    pollId = window.setInterval(run, 8000)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
    }
  }, [])

  const culprits = summary.stressCulprits?.length ? summary.stressCulprits : emptyTrendsSummary.stressCulprits

  const grid = useMemo(
    () => (Array.isArray(correlation.grid) && correlation.grid.length ? correlation.grid : emptyCorrelation.grid),
    [correlation.grid],
  )

  const selectedCell = hoveredCell && grid.find((cell) => cell.id === hoveredCell.id)
    ? grid.find((cell) => cell.id === hoveredCell.id)
    : grid[0]

  return (
    <SamaLayout active="trends" title="Predictive Trends" onNavigate={onNavigate}>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.4rem, 7vw, 4.8rem)', lineHeight: 1 }}>Your calm is foreseen.</h2>
        <p style={{ color: 'var(--on-surface-variant)', maxWidth: 700 }}>Using biometrics and historical context, Sama visualizes your upcoming emotional terrain.</p>
      </section>

      <section className="trends-grid">
        <article className="soft-card" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>7-Day Outlook</h3>
          <ChartContainer config={chartConfig} className="flex-1 w-full h-[420px] aspect-auto!">
            <LineChart data={outlookData} margin={{ top: 20, right: 20, left: 5, bottom: 20 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <ChartTooltip />
              <Line type="monotone" dataKey="stress" stroke="var(--color-teal-500)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mood" stroke="var(--color-lime-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </article>

        <article className="soft-card correlation-shell soft-neomorph-outset" style={{ padding: 24 }}>
          <div className="correlation-head">
            <div>
              <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Correlation Map</h3>
              <p style={{ color: 'var(--on-surface-variant)', marginTop: 0 }}>
                {correlationState === 'live'
                  ? 'Screen time vs. next-day mood'
                  : correlationState === 'signed-out'
                    ? 'Sign in to see the live 28-day grid.'
                    : 'Syncing live correlation data...'}
              </p>
            </div>
          </div>

          <div className="correlation-grid" aria-label="Correlation map">
            {grid.map((cell, index) => (
              <button
                key={cell.id}
                type="button"
                className="correlation-square"
                style={{
                  background: mixHex('#f4f6d2', '#526a58', cell.densityWeight),
                  animationDelay: `${index * 28}ms`,
                }}
                onMouseEnter={() => setHoveredCell(cell)}
                onFocus={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                onBlur={() => setHoveredCell(null)}
                aria-label={`${cell.dateLabel}. ${cell.insight}`}
              >
                <span className="correlation-square-value">
                  {cell.screenTimeHours > 0 ? `${cell.screenTimeHours.toFixed(1)}h` : '—'}
                </span>
              </button>
            ))}
          </div>

          <div className="correlation-tooltip">
            <p className="correlation-tooltip-label">Supportive Insight</p>
            <p className="correlation-tooltip-text">{selectedCell?.insight || correlation.summaryText}</p>
          </div>

          <p className="correlation-summary">{correlation.summaryText}</p>
        </article>
      </section>

      <section className="soft-card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Stress Culprits</h3>
            <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
              {syncState === 'live'
                ? `Live from MongoDB${summary.lastUpdatedAt ? ` · Updated ${formatTime(summary.lastUpdatedAt)}` : ''}`
                : syncState === 'signed-out'
                  ? 'Sign in to see live stress cues.'
                  : 'Syncing live stress cues...'}
            </p>
          </div>
        </div>
        <div className="trigger-list">
          {culprits.map((culprit) => (
            <article key={`${culprit.title}-${culprit.icon}`} className="soft-card" style={{ padding: 20 }}>
              <span className="material-symbols-outlined">{culprit.icon}</span>
              <h4 style={{ margin: '10px 0 6px' }}>{culprit.title}</h4>
              <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{culprit.text}</p>
            </article>
          ))}
        </div>
      </section>
    </SamaLayout>
  )
}

export default PredictiveTrends
