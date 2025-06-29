import React from 'react'
import './PlacementPreview.css'

const PlacementPreview = ({ placement, showDetails = true }) => {
  const getSlotIcon = (slotType) => {
    const icons = {
      top: '📰',
      sidebar: '📋',
      catfish: '🐟',
      logo: '🏷️'
    }
    return icons[slotType] || '📍'
  }

  const getSlotDimensions = (slotType) => {
    const dimensions = {
      top: { width: 800, height: 150 },
      sidebar: { width: 150, height: 800 },
      catfish: { width: 800, height: 150 },
      logo: { width: 150, height: 150 }
    }
    return dimensions[slotType] || { width: 300, height: 250 }
  }

  const slotType = placement.slot_type || placement.slotType || 'custom'
  const dimensions = getSlotDimensions(slotType)
  const isCustom = slotType === 'custom'

  // Calculate preview dimensions (scaled down)
  let previewWidth, previewHeight

  if (slotType === 'top') {
    previewWidth = 240
    previewHeight = 45  // 800x150 ratio
  } else if (slotType === 'sidebar') {
    previewWidth = 40
    previewHeight = 200  // 150x800 ratio
  } else if (slotType === 'catfish') {
    previewWidth = 240
    previewHeight = 45  // 800x150 ratio (same as top)
  } else if (slotType === 'logo') {
    previewWidth = 100
    previewHeight = 100  // 150x150 ratio (square)
  } else {
    // For custom slots
    const maxPreviewWidth = 140
    const maxPreviewHeight = 70
    const scale = Math.min(maxPreviewWidth / dimensions.width, maxPreviewHeight / dimensions.height)
    previewWidth = dimensions.width * scale
    previewHeight = dimensions.height * scale
  }

  return (
    <div className="placement-preview">
      {showDetails && (
        <div className="placement-preview-header">
          <div className="placement-info">
            <span className="slot-icon">{getSlotIcon(slotType)}</span>
            <div className="placement-details">
              <code className="placement-selector">{placement.selector}</code>
              <span className="placement-description">{placement.description}</span>
            </div>
          </div>
          <div className="placement-meta">
            <span className="slot-type-badge">{slotType}</span>
            <span className="dimensions-text">{dimensions.width}×{dimensions.height}px</span>
          </div>
        </div>
      )}
      
      <div className="placement-preview-container">
        <div
          className={`placement-preview-box ${slotType}`}
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            aspectRatio: `${dimensions.width} / ${dimensions.height}`
          }}
        >
          <div className="preview-content">
            <span className="preview-label">
              {isCustom ? 'Custom Ad' : `${slotType.charAt(0).toUpperCase() + slotType.slice(1)} Ad`}
            </span>
            {slotType === 'catfish' && (
              <div className="catfish-dismiss-preview">×</div>
            )}
          </div>
          
          {slotType === 'catfish' && (
            <div className="catfish-position-label">Fixed Bottom</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlacementPreview
