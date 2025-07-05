import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './SlotSelectorAssignment.css'

const SlotSelectorAssignment = ({ website, selectedSlots, onPlacementsCreated }) => {
  const [availableSlots, setAvailableSlots] = useState({})
  const [selectorAssignments, setSelectorAssignments] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  useEffect(() => {
    // Initialize selector assignments for selected slots (catfish doesn't need selectors)
    const initialAssignments = {}
    selectedSlots.forEach(slotType => {
      initialAssignments[slotType] = slotType === 'catfish' ? 'catfish-overlay' : ''
    })
    setSelectorAssignments(initialAssignments)
  }, [selectedSlots])

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true)
      // Add cache-busting parameter to ensure fresh data
      const response = await axios.get(`http://localhost:8080/api/slots?t=${Date.now()}`)
      setAvailableSlots(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch available slots:', err)
      setError('Failed to load slot configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectorChange = (slotType, selector) => {
    setSelectorAssignments(prev => ({
      ...prev,
      [slotType]: selector
    }))
  }

  const handleSavePlacements = async () => {
    // Validate that all non-catfish slots have selectors (catfish doesn't need selectors)
    const missingSelectors = selectedSlots.filter(slotType =>
      slotType !== 'catfish' && !selectorAssignments[slotType]?.trim()
    )
    if (missingSelectors.length > 0) {
      setError(`Please provide CSS selectors for: ${missingSelectors.map(slot => availableSlots[slot]?.name).join(', ')}`)
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const publisherId = website.publisherId || website.publisher_id
      const createdPlacements = []

      // Create placements for each selected slot
      for (const slotType of selectedSlots) {
        const selector = slotType === 'catfish' ? 'catfish-overlay' : selectorAssignments[slotType].trim()
        const slotConfig = availableSlots[slotType]

        const response = await axios.post(`http://localhost:8080/api/publisher/${publisherId}/placements`, {
          selector,
          slotType,
          description: `${slotConfig.name} - ${slotConfig.description}`,
          priority: 'medium'
        })

        createdPlacements.push(response.data)
      }

      setSuccess(`Successfully created ${createdPlacements.length} ad placements!`)
      
      // Notify parent component
      if (onPlacementsCreated) {
        onPlacementsCreated(createdPlacements)
      }

      // Clear form after success
      setTimeout(() => {
        setSuccess('')
      }, 3000)

    } catch (err) {
      console.error('Failed to create placements:', err)
      setError(`Failed to create placements: ${err.response?.data?.error || err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getSampleSelectors = (slotType) => {
    const samples = {
      top: ['header', '.header-banner', '#top-ad', '.navbar + div'],
      sidebar: ['.sidebar', '.widget-area', '#sidebar-ad', '.content aside'],
      catfish: ['body', '.main-content', '#page-wrapper', '.container'],
      logo: ['.logo', '.brand', '#logo-area', '.header-logo']
    }
    return samples[slotType] || ['.ad-container']
  }

  if (loading) {
    return <div className="slot-assignment-loading">Loading slot configurations...</div>
  }

  if (error && !availableSlots) {
    return <div className="slot-assignment-error">{error}</div>
  }

  return (
    <div className="slot-selector-assignment">
      <div className="assignment-header">
        <h3>Assign CSS Selectors to Slots</h3>
        <p>Specify where each selected ad slot should be placed on your website: <strong>{website?.url}</strong></p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="slot-assignments">
        {selectedSlots.map(slotType => {
          const slot = availableSlots[slotType]
          if (!slot) return null

          return (
            <div key={slotType} className="slot-assignment-card">
              <div className="slot-assignment-header">
                <div className="slot-info">
                  <div>
                    <h4 className="slot-name">{slot.name}</h4>
                    <div className="slot-details">
                      {slot.width} × {slot.height}px
                      {slot.positionType === 'fixed' && <span className="fixed-badge">Fixed Position</span>}
                      {slot.isDismissible && <span className="dismissible-badge">Dismissible</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="slot-description">
                {slot.description}
              </div>

              <div className="slot-preview-assignment">
                <div
                  className={`slot-preview-box ${slotType}`}
                  style={{
                    width: slotType === 'top' ? '160px' :
                          slotType === 'sidebar' ? '30px' :
                          slotType === 'catfish' ? '160px' :
                          slotType === 'logo' ? '60px' :
                          Math.min(slot.width / 6, 80),
                    height: slotType === 'top' ? '30px' :
                           slotType === 'sidebar' ? '120px' :
                           slotType === 'catfish' ? '30px' :
                           slotType === 'logo' ? '60px' :
                           Math.min(slot.height / 6, 40),
                    aspectRatio: slotType === 'logo' ? '1 / 1' : `${slot.width} / ${slot.height}`
                  }}
                >
                  <span className="preview-label">{slot.name}</span>
                  {slotType === 'catfish' && slot.isDismissible && (
                    <div className="catfish-dismiss-btn">×</div>
                  )}
                </div>
              </div>

              {slotType !== 'catfish' ? (
                <div className="selector-input-group">
                  <label htmlFor={`selector-${slotType}`}>CSS Selector</label>
                  <input
                    id={`selector-${slotType}`}
                    type="text"
                    value={selectorAssignments[slotType] || ''}
                    onChange={(e) => handleSelectorChange(slotType, e.target.value)}
                    placeholder={`e.g., ${getSampleSelectors(slotType)[0]}`}
                    className="selector-input"
                  />
                  <div className="selector-suggestions">
                    <span className="suggestions-label">Suggestions:</span>
                    {getSampleSelectors(slotType).map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="suggestion-btn"
                        onClick={() => handleSelectorChange(slotType, suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="catfish-info">
                  <div className="catfish-info-content">
                    <h4>🐟 Catfish Ad - No Selector Needed</h4>
                    <p>Catfish ads automatically appear as a fixed overlay at the bottom of the page. No CSS selector is required!</p>
                    <div className="catfish-features">
                      <span className="feature">✓ Fixed bottom position</span>
                      <span className="feature">✓ Always visible</span>
                      <span className="feature">✓ Dismissible</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="assignment-actions">
        <button
          onClick={handleSavePlacements}
          disabled={saving || selectedSlots.length === 0}
          className="btn btn-primary save-placements-btn"
        >
          {saving ? 'Creating Placements...' : `Create ${selectedSlots.length} Ad Placements`}
        </button>
      </div>
    </div>
  )
}

export default SlotSelectorAssignment
