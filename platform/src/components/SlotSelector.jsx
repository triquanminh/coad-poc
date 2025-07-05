import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './SlotSelector.css'

const SlotSelector = ({ onSlotsSelected, selectedSlots = [], website, onPlacementsCreated }) => {
  const [availableSlots, setAvailableSlots] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectorAssignments, setSelectorAssignments] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:8080/api/slots')
      setAvailableSlots(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch available slots:', err)
      setError('Failed to load slot configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleSlotToggle = (slotType) => {
    console.log('Slot clicked:', slotType)
    const newSelectedSlots = selectedSlots.includes(slotType)
      ? selectedSlots.filter(slot => slot !== slotType)
      : [...selectedSlots, slotType]

    console.log('New selected slots:', newSelectedSlots)
    onSlotsSelected(newSelectedSlots)
  }

  const handleSelectorChange = (slotType, selector) => {
    setSelectorAssignments(prev => ({
      ...prev,
      [slotType]: selector
    }))
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

  const handleCreatePlacements = async () => {
    if (!website || selectedSlots.length === 0) return

    // Validate that all non-catfish slots have selectors
    const missingSelectors = selectedSlots.filter(slotType =>
      slotType !== 'catfish' && !selectorAssignments[slotType]?.trim()
    )
    if (missingSelectors.length > 0) {
      const missingSlotNames = missingSelectors.map(slot => availableSlots[slot]?.name).join(', ')
      alert(`Please provide CSS selectors for: ${missingSlotNames}`)
      return
    }

    try {
      setSaving(true)

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

      if (onPlacementsCreated) {
        onPlacementsCreated(createdPlacements)
      }

      // Reset state
      setSelectorAssignments({})
      onSlotsSelected([])

    } catch (err) {
      console.error('Failed to create placements:', err)
      alert('Failed to create ad placements. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="slot-selector-loading">Loading slot configurations...</div>
  }

  if (error) {
    return <div className="slot-selector-error">{error}</div>
  }

  return (
    <div className="slot-selector">
      <div className="slot-selector-header">
        <h3>Select Ad Slot Types</h3>
        <p>Choose the types of ad placements you want to add to your website</p>
      </div>

      <div className="slots-grid">
        {Object.entries(availableSlots).map(([slotType, slot]) => (
          <div
            key={slotType}
            className={`slot-card ${selectedSlots.includes(slotType) ? 'selected' : ''}`}
            onClick={() => handleSlotToggle(slotType)}
          >
            <div className="slot-card-content">
              <div className="slot-card-header">
                <div className="slot-info">
                  <h4 className="slot-name">{slot.name}</h4>
                  <div className="slot-dimensions">
                    {slot.width} × {slot.height}px
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
            </div>

            {selectedSlots.includes(slotType) && slotType !== 'catfish' && (
              <div className="css-selector-input">
                <label htmlFor={`selector-${slotType}`}>CSS Selector</label>
                <input
                  id={`selector-${slotType}`}
                  type="text"
                  value={selectorAssignments[slotType] || ''}
                  onChange={(e) => handleSelectorChange(slotType, e.target.value)}
                  placeholder={`e.g., ${getSampleSelectors(slotType)[0]}`}
                  className="selector-input"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="selector-suggestions">
                  <span className="suggestions-label">Suggestions:</span>
                  {getSampleSelectors(slotType).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="suggestion-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectorChange(slotType, suggestion)
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSlots.includes(slotType) && slotType === 'catfish' && (
              <div className="catfish-info">
                <div className="catfish-info-content">
                  <h4>🐟 Catfish Ad - No Selector Needed</h4>
                  <p>Catfish ads automatically appear as a fixed overlay at the bottom of the page.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedSlots.length > 0 && (
        <div className="slot-actions">
          <button
            onClick={handleCreatePlacements}
            disabled={saving}
            className="btn btn-primary btn-highlighted create-placements-btn"
          >
            {saving ? 'Creating Placements...' : `Create ${selectedSlots.length} Ad Placements`}
          </button>
        </div>
      )}
    </div>
  )
}

export default SlotSelector
