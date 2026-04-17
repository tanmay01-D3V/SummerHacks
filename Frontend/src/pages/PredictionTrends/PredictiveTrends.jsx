import AuraLayout from '../../components/AuraLayout'
import { ChartConfig, ChartContainer, ChartTooltip } from '../../components/ui/line-charts-6'
import { Line, LineChart, XAxis, YAxis } from 'recharts'
import './PredictiveTrends.css'

const heat = [0.1, 0.2, 0.4, 0.6, 0.8, 1, 0.9, 0.05, 0.1, 0.2, 0.3, 0.5, 0.4, 0.2, 0.1, 0.05, 0.1, 0.15, 0.1, 0.05, 0.05, 0.4, 0.6, 0.8, 0.9, 1, 0.95, 0.8]

// 7-Day Outlook data
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

const PredictiveTrends = ({ onNavigate }) => (
  <AuraLayout active="trends" title="Predictive Trends" onNavigate={onNavigate}>
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.4rem, 7vw, 4.8rem)', lineHeight: 1 }}>Your calm is foreseen.</h2>
      <p style={{ color: 'var(--on-surface-variant)', maxWidth: 700 }}>Using biometrics and historical context, Aura visualizes your upcoming emotional terrain.</p>
    </section>

    <section className="trends-grid">
      <article className="soft-card" style={{ padding: 26 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>7-Day Outlook</h3>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={outlookData} margin={{ top: 20, right: 20, left: 5, bottom: 20 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <ChartTooltip />
            <Line type="monotone" dataKey="stress" stroke="var(--color-teal-500)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mood" stroke="var(--color-lime-500)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </article>
      <article className="soft-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Correlation Map</h3>
        <p style={{ color: 'var(--on-surface-variant)', marginTop: 0 }}>Screen Time vs. Next-Day Mood</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {heat.map((v, i) => (
            <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: 4, background: `rgba(82, 106, 88, ${v})` }} />
          ))}
        </div>
      </article>
    </section>

    <section className="soft-card" style={{ padding: 24, marginTop: 24 }}>
      <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Stress Culprits</h3>
      <div className="trigger-list">
        {[
          ['calendar_month', 'Back-to-back meetings', 'Causes 24% spike in HRV between 2 PM and 4 PM.'],
          ['smartphone', 'Late-night screen time', 'Blue light exposure after 11 PM delays deep sleep by 45 mins.'],
          ['coffee', 'Caffeine sensitivity', 'Post-4 PM coffee correlates with Restless Brain alerts.'],
          ['cloud', 'Low humidity levels', 'Dry office air contributes to subtle physical irritation.'],
        ].map(([icon, title, text]) => (
          <article key={title} className="soft-card" style={{ padding: 20 }}>
            <span className="material-symbols-outlined">{icon}</span>
            <h4 style={{ margin: '10px 0 6px' }}>{title}</h4>
            <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{text}</p>
          </article>
        ))}
      </div>
    </section>
  </AuraLayout>
)

export default PredictiveTrends