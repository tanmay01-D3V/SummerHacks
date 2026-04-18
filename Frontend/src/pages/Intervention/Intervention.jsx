import { useEffect, useRef, useState } from 'react'
import AuraLayout from '../../components/AuraLayout'
import audioFile from '../../assets/audio.mp3'
import { createRecord, deleteRecord, fetchRecords, getStoredAuthSession, updateRecord } from '../../lib/auraApi'
import './intervention.css'

const Intervention = ({ onNavigate }) => {
  const [isActive, setIsActive] = useState(false)
  const [habits, setHabits] = useState([])
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(audioFile)
    audioRef.current.loop = true

    // Fetch habits
    const session = getStoredAuthSession()
    if (session?.token) {
      fetchRecords(session.token, { type: 'habit' })
        .then((data) => {
          if (data.records?.length) {
            setHabits(data.records)
          } else {
            // Default habits if none exist
            setHabits([
              { title: '10-minute walk', sub: 'Scheduled for 3:00 PM', status: 'active', isDefault: true },
              { title: 'Blue light filter', sub: 'Automatic ON at 8:00 PM', status: 'completed', isDefault: true },
              { title: 'Hydration check', sub: 'Goal: 250ml every hour', status: 'active', isDefault: true },
            ])
          }
        })
        .catch((err) => console.error('Failed to fetch habits:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const toggleOverride = () => {
    const nextActive = !isActive
    setIsActive(nextActive)

    if (audioRef.current) {
      if (nextActive) {
        audioRef.current.currentTime = 15
        audioRef.current.play().catch((err) => console.error('Audio playback failed:', err))
      } else {
        audioRef.current.pause()
        audioRef.current.currentTime = 15
      }
    }
  }

  const handleAddHabit = async (e) => {
    if (e.key !== 'Enter' || !newHabitTitle.trim()) return

    const session = getStoredAuthSession()
    if (!session?.token) return

    try {
      const record = await createRecord(session.token, {
        type: 'habit',
        title: newHabitTitle.trim(),
        status: 'active',
        source: 'manual',
      })
      setHabits((prev) => [record.record, ...prev.filter((h) => !h.isDefault)])
      setNewHabitTitle('')
    } catch (err) {
      console.error('Failed to add habit:', err)
    }
  }

  const handleToggleHabit = async (habit) => {
    if (habit.isDefault) {
      // For default habits, just toggle local state as they are not in DB
      setHabits((prev) => prev.map((h) => (h.title === habit.title ? { ...h, status: h.status === 'completed' ? 'active' : 'completed' } : h)))
      return
    }

    const session = getStoredAuthSession()
    if (!session?.token) return

    const newStatus = habit.status === 'completed' ? 'active' : 'completed'
    try {
      await updateRecord(session.token, habit.id, { status: newStatus })
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, status: newStatus } : h)))
    } catch (err) {
      console.error('Failed to toggle habit:', err)
    }
  }

  const handleDeleteHabit = async (habit) => {
    if (habit.isDefault) {
      setHabits((prev) => prev.filter((h) => h.title !== habit.title))
      return
    }

    const session = getStoredAuthSession()
    if (!session?.token) return

    try {
      await deleteRecord(session.token, habit.id)
      setHabits((prev) => prev.filter((h) => h.id !== habit.id))
    } catch (err) {
      console.error('Failed to delete habit:', err)
    }
  }

  const orbSubtext = isActive ? 'Inhale... Exhale...' : 'Reset Cortisol Levels Now'

  return (
    <AuraLayout active="intervention" title="Intervention" onNavigate={onNavigate}>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', lineHeight: 1.02 }}>
          Deep breath. <br />
          <span style={{ color: 'var(--primary)' }}>You're in control.</span>
        </h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Your personalized intervention plan is ready to guide you back to center.</p>
      </section>

      <section style={{ marginBottom: 30 }}>
        <div className={`override-orb ${isActive ? 'is-active' : ''}`} onClick={toggleOverride}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                margin: '0 auto 20px',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, var(--primary), var(--primary-container))',
                display: 'grid',
                placeItems: 'center',
                transition: 'transform 0.4s ease',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 52, color: '#fff' }}>
                {isActive ? 'spa' : 'bolt'}
              </span>
            </div>
            <h3 style={{ margin: 0, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 2.2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {isActive ? 'Aura Breath' : 'System Override'}
            </h3>
            <p style={{ marginBottom: 0, color: 'var(--on-surface-variant)' }}>{orbSubtext}</p>
          </div>
        </div>
      </section>

      <section className="intervention-grid">
        <article className="soft-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Micro-Habits</h3>
            <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>{habits.filter((h) => h.status === 'completed').length}/{habits.length} Done</span>
          </div>

          <div className="habit-input-wrap">
            <span className="material-symbols-outlined">add</span>
            <input
              type="text"
              placeholder="Press Enter to add a new habit..."
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              onKeyDown={handleAddHabit}
            />
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {loading ? (
              <p style={{ textAlign: 'center', opacity: 0.5 }}>Syncing habits...</p>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id || habit.title}
                  className={`soft-card habit-item ${habit.status === 'completed' ? 'is-done' : ''}`}
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => handleToggleHabit(habit)}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ opacity: 0.7 }}>
                      {habit.status === 'completed' ? 'check_circle' : 'circle'}
                    </span>
                    <div>
                      <strong style={{ display: 'block', textDecoration: habit.status === 'completed' ? 'line-through' : 'none', opacity: habit.status === 'completed' ? 0.6 : 1 }}>
                        {habit.title}
                      </strong>
                      {(habit.sub || habit.isDefault) && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--on-surface-variant)', opacity: 0.7 }}>{habit.sub || 'Priority Habit'}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="habit-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteHabit(habit)
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              ))
            )}
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
}

export default Intervention