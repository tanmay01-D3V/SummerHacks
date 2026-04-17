import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'pulse', label: 'Pulse', icon: 'radio_button_checked' },
  { id: 'trends', label: 'Predictive Trends', icon: 'trending_up' },
  { id: 'intervention', label: 'Intervention', icon: 'emergency_home' },
  { id: 'vault', label: 'Data Vault', icon: 'security' },
]

const AuraLayout = ({ active, title, onNavigate, children }) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="aura-shell">
      <div className="aura-sidebar-trigger" aria-hidden="true" />
      <aside className="aura-sidebar">
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 30, fontWeight: 800, color: 'var(--primary)' }}>
            Aura
          </div>
          <div style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>Stay Centered</div>
        </div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`aura-nav-item ${active === item.id ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <header className="aura-header">
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0, fontSize: 36, lineHeight: 1, color: 'var(--primary)' }}>
          {title}
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="aura-header-icon" onClick={() => setSettingsOpen((v) => !v)} aria-label="Open settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button type="button" className="aura-header-icon" onClick={() => setAuthOpen((v) => !v)} aria-label="Open login">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <main className="aura-main">{children}</main>

      {settingsOpen && (
        <section className="aura-overlay" role="dialog" aria-modal="true">
          <article className="aura-modal soft-card">
            <div className="aura-modal-header">
              <h3>Settings</h3>
              <button type="button" className="aura-tab-chip" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>
            <label className="aura-setting-row">
              <span>Daily intervention reminders</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="aura-setting-row">
              <span>Enable calm voice responses</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="aura-setting-row">
              <span>Low-energy workload suggestions</span>
              <input type="checkbox" defaultChecked />
            </label>
          </article>
        </section>
      )}

      {authOpen && (
        <section className="aura-overlay" role="dialog" aria-modal="true">
          <article className="aura-modal soft-card">
            <div className="aura-modal-header">
              <h3>Login to Aura</h3>
              <button type="button" className="aura-tab-chip" onClick={() => setAuthOpen(false)}>
                Close
              </button>
            </div>
            <div className="aura-form-grid">
              <input className="aura-voice-input" type="email" placeholder="Email" />
              <input className="aura-voice-input" type="password" placeholder="Password" />
              <button type="button" className="aura-tab-chip is-active">
                Continue
              </button>
            </div>
          </article>
        </section>
      )}
    </div>
  )
}

export default AuraLayout
