import AuraLayout from '../../components/AuraLayout'
import './PredictiveTrends.css'

const heat = [0.1, 0.2, 0.4, 0.6, 0.8, 1, 0.9, 0.05, 0.1, 0.2, 0.3, 0.5, 0.4, 0.2, 0.1, 0.05, 0.1, 0.15, 0.1, 0.05, 0.05, 0.4, 0.6, 0.8, 0.9, 1, 0.95, 0.8]

const PredictiveTrends = ({ onNavigate }) => (
  <AuraLayout active="trends" title="Predictive Trends" onNavigate={onNavigate}>
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.4rem, 7vw, 4.8rem)', lineHeight: 1 }}>Your calm is foreseen.</h2>
      <p style={{ color: 'var(--on-surface-variant)', maxWidth: 700 }}>Using biometrics and historical context, Aura visualizes your upcoming emotional terrain.</p>
    </section>

    <section className="trends-grid">
      <article className="soft-card" style={{ padding: 26 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>7-Day Outlook</h3>
        <svg viewBox="0 0 800 200" style={{ width: '100%', height: 250 }}>
          <path d="M 0 150 Q 100 120 200 160 T 400 100 T 500 140" fill="none" stroke="#526a58" strokeWidth="4" />
          <path d="M 500 140 Q 600 160 700 80 T 800 110" fill="none" stroke="#b9bc94" strokeWidth="3" strokeDasharray="9 8" />
        </svg>
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