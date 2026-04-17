import AuraLayout from '../../components/AuraLayout'
import './Home.css'

const Home = ({ onNavigate }) => (
  <AuraLayout active="pulse" title="Aura" onNavigate={onNavigate}>
    <section className="pulse-grid">
      <article className="soft-card insight-card">
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--tertiary)' }}>
          auto_awesome
        </span>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Heads up: your sleep-to-work ratio suggests a high anxiety spike by Thursday.
          </h2>
          <p style={{ margin: '8px 0 0', color: 'var(--on-surface-variant)' }}>Recommended: 15 min deep focus breathing.</p>
        </div>
        <button type="button" className="aura-tab-chip is-active">
          Start Guide
        </button>
      </article>

      <article className="soft-card" style={{ padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}>
          <div>
            <p style={{ margin: 0, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>Current state</p>
            <h2 style={{ margin: '8px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}>Pulse.</h2>
          </div>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>"Deep breaths, clear minds."</p>
        </div>
        <div className="orb-wrap">
          <div className="orb-core">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.2rem, 5vw, 4.4rem)', fontWeight: 800 }}>64</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Stress index</div>
            </div>
          </div>
        </div>
      </article>

      <div className="rituals">
        <article className="soft-card" style={{ padding: 26 }}>
          <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Daily Rituals</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14 }}>
            {[
              ['sentiment_satisfied', 'Mood'],
              ['water_drop', 'Water'],
              ['coffee', 'Caffeine'],
            ].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="soft-card" style={{ width: 66, height: 66, borderRadius: 999, display: 'grid', placeItems: 'center' }}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <p style={{ marginBottom: 0, color: 'var(--on-surface-variant)', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="soft-card" style={{ padding: 26, background: 'color-mix(in srgb, var(--secondary-container) 40%, var(--surface-low))' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Focus Time</h3>
          <p style={{ fontSize: 46, margin: '8px 0', color: 'var(--secondary)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800 }}>4.2h</p>
          <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>12% more than yesterday</p>
        </article>
      </div>
    </section>
  </AuraLayout>
)

export default Home