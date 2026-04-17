import AuraLayout from '../../components/AuraLayout'
import './DataVault.css'

const DataVault = ({ onNavigate }) => (
  <AuraLayout active="vault" title="Data Vault" onNavigate={onNavigate}>
    <section className="vault-top">
      <article className="soft-card" style={{ padding: 24 }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 1.8, fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>System Sync</p>
        <h2 style={{ margin: '8px 0 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2rem, 6vw, 3.4rem)' }}>The Digital Twin</h2>
        <div style={{ margin: '26px auto', width: 190, aspectRatio: '1 / 1', borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--primary-container) 55%, transparent), transparent)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {['watch', 'calendar_today', 'smartphone', 'edit_note'].map((icon) => (
            <div key={icon} style={{ textAlign: 'center' }}>
              <span className="material-symbols-outlined">{icon}</span>
            </div>
          ))}
        </div>
      </article>

      <div style={{ display: 'grid', gap: 16 }}>
        <article className="soft-card" style={{ padding: 24, background: 'color-mix(in srgb, var(--secondary-container) 48%, var(--surface-low))' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1.5, color: 'var(--secondary)' }}>Vault health</p>
          <h3 style={{ marginBottom: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Immutable</h3>
          <p style={{ margin: '8px 0 0', color: 'var(--on-surface-variant)' }}>Blockchain verified logs are secured for 12 months.</p>
        </article>
        <article className="soft-card" style={{ padding: 24 }}>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Access Matrix</h3>
          <p style={{ margin: '8px 0 0', color: 'var(--on-surface-variant)' }}>Manage third-party API permissions and revocations.</p>
        </article>
      </div>
    </section>

    <section className="soft-card" style={{ marginTop: 24, padding: 24 }}>
      <h3 style={{ marginTop: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Privacy Guard</h3>
      <p style={{ color: 'var(--on-surface-variant)' }}>Enable Incognito Mode to temporarily halt all biometric and digital data ingestion.</p>
      <label htmlFor="incognito-toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <input id="incognito-toggle" type="checkbox" defaultChecked />
        <span>Incognito Mode</span>
      </label>
    </section>

    <section style={{ marginTop: 24 }}>
      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Data Sources</h3>
      <div className="sources-grid">
        {[
          ['watch', 'Apple Watch', 'Heart rate, SpO2, HRV sync'],
          ['calendar_month', 'Google Calendar', 'Social load, meeting density'],
          ['stay_current_portrait', 'Screen Time', 'App usage, digital fatigue'],
          ['add', 'Connect Journal', 'Notion, Day One, etc.'],
        ].map(([icon, title, text]) => (
          <article key={title} className="soft-card" style={{ padding: 18 }}>
            <span className="material-symbols-outlined">{icon}</span>
            <h4 style={{ margin: '8px 0 4px' }}>{title}</h4>
            <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{text}</p>
          </article>
        ))}
      </div>
    </section>
  </AuraLayout>
)

export default DataVault