import React from 'react'
import '../styles/heat.css'

// Simple screentime heatmap renderer using the Heat.js CSS classes available in intervention.css
// It creates a 30-day grid and maps hours to day-color-1..4 classes.
const ScreenTimeHeatmap = ({ data }) => {
  // data: array of numbers (hours) for the last N days; if not provided, generate sample data
  const days = data && data.length ? data : Array.from({ length: 30 }, () => Math.floor(Math.random() * 6))

  const bucket = (hours) => {
    if (hours <= 1) return 'day-color-1'
    if (hours <= 2) return 'day-color-2'
    if (hours <= 4) return 'day-color-3'
    return 'day-color-4'
  }

  return (
    <div>
      <h4 style={{ marginTop: 0, marginBottom: 12 }}>Screentime — last 30 days</h4>
      <div className="heat-js" style={{ width: '100%' }}>
        <div className="container-contents">
          <div className="map-contents-container">
            <div className="map-contents">
              <div className="map">
                <div className="days">
                  {days.map((h, i) => (
                    <div
                      key={i}
                      className={`day ${bucket(h)}`}
                      title={`Day ${i + 1}: ${h}h`}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <div className="count-date" style={{ fontSize: 10 }}>{h}h</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreenTimeHeatmap
