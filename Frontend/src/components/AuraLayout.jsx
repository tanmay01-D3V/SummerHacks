const NAV_ITEMS = [
  { id: 'pulse', label: 'Pulse', icon: 'radio_button_checked' },
  { id: 'trends', label: 'Predictive Trends', icon: 'trending_up' },
  { id: 'intervention', label: 'Intervention', icon: 'emergency_home' },
  { id: 'vault', label: 'Data Vault', icon: 'security' },
]

const AuraLayout = ({ active, title, onNavigate, children }) => (
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
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
          settings
        </span>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
          account_circle
        </span>
      </div>
    </header>

    <main className="aura-main">{children}</main>
  </div>
)

export default AuraLayout
