import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './SlotSelector.css'

const SlotSelector = ({ onSlotsSelected, selectedSlots = [] }) => {
  const [availableSlots, setAvailableSlots] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const getSlotIcon = (slotType) => {
    const icons = {
      top: '📰',
      sidebar: '📋',
      catfish: '🐟',
      logo: '🏷️'
    }
    return icons[slotType] || '📍'
  }

  const getPositionBadge = (slot) => {
    if (slot.positionType === 'fixed') {
      return <span className="position-badge fixed">Fixed Position</span>
    }
    return <span className="position-badge relative">Relative</span>
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
            <div className="slot-card-header">
              <div className="slot-icon">{getSlotIcon(slotType)}</div>
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

            <div className="slot-features">
              {getPositionBadge(slot)}
              {slot.isDismissible && (
                <span className="feature-badge dismissible">Dismissible</span>
              )}
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
        ))}
      </div>

      {selectedSlots.length > 0 && (
        <div className="selected-slots-summary">
          <h4>Selected Slots ({selectedSlots.length})</h4>
          <div className="selected-slots-list">
            {selectedSlots.map(slotType => (
              <span key={slotType} className="selected-slot-tag">
                {getSlotIcon(slotType)} {availableSlots[slotType]?.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SlotSelector
