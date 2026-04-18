import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchProactiveAlert, getStoredAuthSession } from '../lib/auraApi'

const SmartAlert = ({ onNavigate }) => {
  const [alert, setAlert] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkAlerts = async () => {
      const session = getStoredAuthSession()
      if (!session?.token) return

      try {
        const { alert: activeAlert } = await fetchProactiveAlert(session.token)
        if (activeAlert) {
          // Check if we've already seen or dismissed this alert in this session
          const dismissedId = sessionStorage.getItem('aura-dismissed-alert')
          if (dismissedId !== activeAlert.id) {
            setAlert(activeAlert)
            setIsVisible(true)
          }
        } else {
          setIsVisible(false)
        }
      } catch (err) {
        console.error('Failed to poll proactive alerts:', err)
      }
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    if (alert) {
      sessionStorage.setItem('aura-dismissed-alert', alert.id)
    }
  }

  const handleAction = () => {
    if (alert?.path) {
      onNavigate(alert.path.replace('/', ''))
      handleDismiss()
    }
  }

  return (
    <AnimatePresence>
      {isVisible && alert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            maxWidth: '360px',
            width: 'calc(100vw - 48px)',
          }}
        >
          <div 
            className="soft-card" 
            style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              borderRadius: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: 'var(--primary-container)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>
                  auto_awesome
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                  {alert.title}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.4 }}>
                  {alert.message}
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.4, cursor: 'pointer', padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {alert.metrics && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Workload: <strong>{alert.metrics.avgWorkload}h</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Sleep: <strong>{alert.metrics.avgSleep}h</strong>
                </div>
              </div>
            )}

            <button 
              className="aura-tab-chip is-active" 
              onClick={handleAction}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '14px' }}
            >
              {alert.cta}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SmartAlert
