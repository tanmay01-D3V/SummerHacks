import { useEffect, useState } from 'react'
import SmartAlert from './SmartAlert'
import {
  clearStoredAuthSession,
  fetchCurrentUser,
  getStoredAuthSession,
  loginUser,
  registerUser,
  setStoredAuthSession,
} from '../lib/samaApi'

const NAV_ITEMS = [
  { id: 'pulse', label: 'Pulse', icon: 'radio_button_checked' },
  { id: 'journal', label: 'Journal', icon: 'graphic_eq' },
  { id: 'trends', label: 'Predictive Trends', icon: 'trending_up' },
  { id: 'intervention', label: 'Intervention', icon: 'emergency_home' },
  { id: 'vault', label: 'Data Vault', icon: 'security' },
]

const SamaLayout = ({ active, title, onNavigate, children }) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authUser, setAuthUser] = useState(() => {
    const session = getStoredAuthSession()
    return session?.user || null
  })
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    const session = getStoredAuthSession()
    if (!session?.token) return

    fetchCurrentUser(session.token)
      .then(({ user }) => {
        setAuthUser(user)
        setStoredAuthSession({ token: session.token, user })
      })
      .catch(() => {
        clearStoredAuthSession()
        setAuthUser(null)
      })
  }, [])

  const closeAuth = () => {
    setAuthOpen(false)
    setAuthError('')
    setAuthMode('login')
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    const email = authForm.email.trim()
    const password = authForm.password
    const name = authForm.name.trim()

    setAuthLoading(true)
    setAuthError('')

    try {
      const payload = authMode === 'register' ? { name, email, password } : { email, password }
      const session = authMode === 'register' ? await registerUser(payload) : await loginUser(payload)
      setStoredAuthSession(session)
      setAuthUser(session.user)
      setAuthForm({ name: '', email: '', password: '' })
      closeAuth()
    } catch (error) {
      setAuthError(error.message || 'Unable to authenticate right now.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    clearStoredAuthSession()
    setAuthUser(null)
    setAuthForm({ name: '', email: '', password: '' })
    setAuthError('')
  }

  return (
    <div className="sama-shell">
      <div className="sama-sidebar-trigger" aria-hidden="true" />
      <aside className="sama-sidebar">
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 30, fontWeight: 800, color: 'var(--primary)' }}>
            Sama
          </div>
          <div style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>Stay Centered</div>
        </div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sama-nav-item ${active === item.id ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <header className="sama-header">
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0, fontSize: 36, lineHeight: 1, color: 'var(--primary)' }}>
          {title}
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {authUser ? (
            <button type="button" className="sama-header-pill" onClick={() => setAuthOpen(true)} aria-label="Account details">
              <span className="material-symbols-outlined">verified_user</span>
              <span>{authUser.name}</span>
            </button>
          ) : null}
          <button type="button" className="sama-header-icon" onClick={() => setSettingsOpen((v) => !v)} aria-label="Open settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            type="button"
            className="sama-header-icon"
            onClick={() => setAuthOpen((v) => !v)}
            aria-label={authUser ? 'Open account' : 'Open login'}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <main className="sama-main">{children}</main>

      {settingsOpen && (
        <section className="sama-overlay" role="dialog" aria-modal="true">
          <article className="sama-modal soft-card">
            <div className="sama-modal-header">
              <h3>Settings</h3>
              <button type="button" className="sama-tab-chip" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>
            <label className="sama-setting-row">
              <span>Daily intervention reminders</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="sama-setting-row">
              <span>Enable calm voice responses</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="sama-setting-row">
              <span>Low-energy workload suggestions</span>
              <input type="checkbox" defaultChecked />
            </label>
          </article>
        </section>
      )}

      {authOpen && (
        <section className="sama-overlay" role="dialog" aria-modal="true">
          <article className="sama-modal soft-card">
            <div className="sama-modal-header">
              <h3>{authUser ? 'Your account' : authMode === 'register' ? 'Create account' : 'Login to Sama'}</h3>
              <button type="button" className="sama-tab-chip" onClick={closeAuth}>
                Close
              </button>
            </div>
            {authUser ? (
              <div className="sama-account-card">
                <p className="sama-account-label">Signed in</p>
                <h4>{authUser.name}</h4>
                <p>{authUser.email}</p>
                <div className="sama-account-actions">
                  <button type="button" className="sama-tab-chip is-active" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="sama-auth-tabs">
                  <button
                    type="button"
                    className={`sama-tab-chip ${authMode === 'login' ? 'is-active' : ''}`}
                    onClick={() => setAuthMode('login')}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`sama-tab-chip ${authMode === 'register' ? 'is-active' : ''}`}
                    onClick={() => setAuthMode('register')}
                  >
                    Create account
                  </button>
                </div>
                <form className="sama-form-grid" onSubmit={handleAuthSubmit}>
                  {authMode === 'register' ? (
                    <input
                      className="sama-voice-input"
                      type="text"
                      placeholder="Full name"
                      value={authForm.name}
                      onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  ) : null}
                  <input
                    className="sama-voice-input"
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                  <input
                    className="sama-voice-input"
                    type="password"
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                    minLength={8}
                  />
                  {authError ? <p className="sama-auth-error">{authError}</p> : null}
                  <button type="submit" className="sama-tab-chip is-active" disabled={authLoading}>
                    {authLoading ? 'Working...' : authMode === 'register' ? 'Create account' : 'Continue'}
                  </button>
                </form>
              </>
            )}
          </article>
        </section>
      )}
      
      <SmartAlert onNavigate={onNavigate} />
    </div>
  )
}

export default SamaLayout
