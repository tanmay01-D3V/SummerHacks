import AuraLayout from '../../components/AuraLayout'
import './Intervention.css'

const Intervention = ({ onNavigate }) => (
  <AuraLayout active="intervention" title="Intervention" onNavigate={onNavigate}>
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', lineHeight: 1.02 }}>
        Deep breath. <br />
        <span style={{ color: 'var(--primary)' }}>You're in control.</span>
      </h2>
      <p style={{ color: 'var(--on-surface-variant)' }}>Your personalized intervention plan is ready to guide you back to center.</p>
    </section>

    <section style={{ marginBottom: 30 }}>
      <div className="override-orb">
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 20px', width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(145deg, var(--primary), var(--primary-container))', display: 'grid', placeItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 52, color: '#fff' }}>
              bolt
            </span>
          </div>
          <h3 style={{ margin: 0, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 2.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>System Override</h3>
          <p style={{ marginBottom: 0, color: 'var(--on-surface-variant)' }}>Reset Cortisol Levels Now</p>
        </div>
      </div>
    </section>

    <section className="intervention-grid">
      <article className="soft-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Micro-Habits</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['directions_walk', '10-minute walk', 'Scheduled for 3:00 PM', false],
            ['night_sight_auto', 'Blue light filter', 'Automatic ON at 8:00 PM', true],
            ['water_drop', 'Hydration check', 'Goal: 250ml every hour', false],
          ].map(([icon, title, sub, done]) => (
            <div key={title} className="soft-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="material-symbols-outlined">{icon}</span>
                <div>
                  <strong>{title}</strong>
                  <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{sub}</p>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ color: done ? 'var(--primary)' : 'var(--outline)' }}>
                check_circle
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="soft-card" style={{ padding: 24, background: 'var(--primary)', color: '#fff' }}>
        <span className="material-symbols-outlined">psychology</span>
        <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 30, lineHeight: 1.15 }}>"Tranquility is a choice, not a circumstance."</h3>
        <p>Your current stress markers are trending down 14% since your last intervention.</p>
        <button type="button" className="aura-tab-chip" style={{ background: '#fff', color: 'var(--primary)' }}>
          View Report
        </button>
      </article>
    </section>
  </AuraLayout>
)

export default Intervention