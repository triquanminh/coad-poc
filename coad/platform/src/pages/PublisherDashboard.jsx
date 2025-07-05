import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import SlotSelector from '../components/SlotSelector'

import PlacementPreview from '../components/PlacementPreview'
import './PublisherDashboard.css'

// SDK Health Check Component
function SDKHealthCheck({ website, onHealthUpdate }) {
  const [isChecking, setIsChecking] = useState(false)
  const [healthStatus, setHealthStatus] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const checkSDKHealth = async () => {
    setIsChecking(true)
    try {
      // Check if the website has the SDK installed by looking for COAD config
      const response = await axios.post('http://localhost:8080/api/health-check', {
        url: website.url,
        checkSDK: true
      })

      // Additional check: try to fetch the website and look for COAD script
      // Note: CORS will prevent direct content checking, but we can check response status

      const healthData = {
        sdkInstalled: response.data.sdkDetected || false,
        websiteAccessible: response.data.status === 'healthy',
        responseTime: response.data.responseTime,
        lastChecked: new Date().toISOString()
      }

      setHealthStatus(healthData)
      setLastChecked(new Date())
      onHealthUpdate && onHealthUpdate(website.publisherId, healthData)

    } catch (error) {
      console.error('SDK health check failed:', error)
      setHealthStatus({
        sdkInstalled: false,
        websiteAccessible: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      })
    }
    setIsChecking(false)
  }

  useEffect(() => {
    // Auto-check on mount
    checkSDKHealth()
  }, [website.url])

  const getStatusIcon = () => {
    if (isChecking) return '🔄'
    if (!healthStatus) return '❓'
    if (healthStatus.sdkInstalled && healthStatus.websiteAccessible) return '✅'
    if (healthStatus.websiteAccessible && !healthStatus.sdkInstalled) return '⚠️'
    return '❌'
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    if (!healthStatus) return 'Unknown'
    if (healthStatus.sdkInstalled && healthStatus.websiteAccessible) return 'SDK Active'
    if (healthStatus.websiteAccessible && !healthStatus.sdkInstalled) return 'SDK Missing'
    if (!healthStatus.websiteAccessible) return 'Website Unreachable'
    return 'Error'
  }

  return (
    <div className="sdk-health-check">
      <div className="health-status">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      <button
        onClick={checkSDKHealth}
        disabled={isChecking}
        className="health-check-btn"
        title="Check SDK Installation"
      >
        {isChecking ? '🔄' : '🔍'}
      </button>
      {lastChecked && (
        <div className="last-checked">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// Website Card Component
function WebsiteCard({ website, onEdit, onDelete, onHealthUpdate }) {
  const [placements, setPlacements] = useState([])
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(true)
  const [showPlacements, setShowPlacements] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadPlacements()
  }, [website.publisherId])

  const loadPlacements = async () => {
    try {
      setIsLoadingPlacements(true)
      const response = await axios.get(`http://localhost:8080/api/publisher/${website.publisherId}/placements`)
      setPlacements(response.data)
    } catch (error) {
      console.error('Failed to load placements:', error)
      setPlacements([])
    } finally {
      setIsLoadingPlacements(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyPublisherId = () => {
    navigator.clipboard.writeText(website.publisherId)
    alert('Publisher ID copied to clipboard!')
  }

  const copySDKCode = () => {
    const publisherId = website?.publisher_id || website?.publisherId
    const sdkCode = `<script src="http://localhost:4001/src/index.js?publisherId=${publisherId}" type="module" async></script>`

    navigator.clipboard.writeText(sdkCode)
    alert('SDK code copied to clipboard!')
  }

  return (
    <div className="website-card">
      <div className="website-header">
        <div className="website-main-info">
          <div className="website-title">
            <a href={website.url} target="_blank" rel="noopener noreferrer" className="website-url">
              {website.url}
            </a>
            <span className="website-title-text">{website.title || 'No title'}</span>
          </div>
          <div className="website-meta">
            <span className="publisher-id" onClick={copyPublisherId} title="Click to copy">
              📋 {website.publisherId}
            </span>
            <span className="created-date">
              📅 {formatDate(website.createdAt)}
            </span>
          </div>
        </div>

        <div className="website-status">
          <div className="status-badges">
            <span className={`status-badge ${website.status}`}>
              {website.status}
            </span>
            <span className={`health-badge ${website.healthStatus}`}>
              {website.healthStatus}
            </span>
          </div>
          <SDKHealthCheck website={website} onHealthUpdate={onHealthUpdate} />
        </div>
      </div>

      <div className="website-stats">
        <div className="stat-item">
          <span className="stat-label">Ad Placements</span>
          <span className="stat-value">{placements.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Response Time</span>
          <span className="stat-value">{website.responseTime || 0}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">DOM Elements</span>
          <span className="stat-value">{website.domElements || 0}</span>
        </div>
      </div>

      <div className="website-actions">
        <button
          onClick={() => setShowPlacements(!showPlacements)}
          className="btn btn-secondary"
          disabled={isLoadingPlacements}
        >
          {showPlacements ? '📋 Hide Placements' : '📋 Show Placements'} ({placements.length})
        </button>
        <button onClick={copySDKCode} className="btn btn-primary">
          📄 Copy SDK Code
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-secondary"
        >
          {isExpanded ? '📤 Collapse' : '📥 Expand'}
        </button>
      </div>

      {showPlacements && (
        <div className="placements-section">
          <h4>Ad Placements ({placements.length})</h4>
          {isLoadingPlacements ? (
            <div className="loading">Loading placements...</div>
          ) : placements.length > 0 ? (
            <div className="placements-list">
              {placements.map((placement) => (
                <div key={placement.id} className="placement-item">
                  <code className="placement-selector">{placement.selector}</code>
                  <span className="placement-description">{placement.description}</span>
                  <span className={`placement-priority priority-${placement.priority}`}>
                    {placement.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-placements">
              No ad placements configured yet.
              <Link to="/publisher/placements" className="add-placements-link">
                Add placements →
              </Link>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="website-details">
          <div className="detail-section">
            <h4>Website Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{website.description || 'No description'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Website ID:</span>
                <span className="detail-value">{website.websiteId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatDate(website.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-components for different publisher sections
function WebsiteRegistration({ onWebsiteAdded, onNavigateToNext }) {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [healthCheckResult, setHealthCheckResult] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleHealthCheck = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL')
      return
    }

    setIsChecking(true)
    setError('')
    setHealthCheckResult(null)

    try {
      // First, perform health check
      const healthResponse = await axios.post('http://localhost:8080/api/health-check', {
        url: websiteUrl
      })

      setHealthCheckResult(healthResponse.data)

      // If health check is successful, show registration option
      if (healthResponse.data.status === 'healthy') {
        // Don't automatically register - just show the health check results
        console.log('Health check successful. User can now register the website.')
      }
    } catch (err) {
      console.error('Health check failed:', err)
      setError(`Health check failed: ${err.response?.data?.error || err.message}`)
    }

    setIsChecking(false)
  }

  const handleRegisterWebsite = async () => {
    if (!healthCheckResult || healthCheckResult.status !== 'healthy') {
      setError('Please perform a successful health check first')
      return
    }

    setIsChecking(true)
    setError('')

    try {
      // Register the publisher with health check data
      const response = await axios.post('http://localhost:8080/api/publisher/register', {
        url: websiteUrl,
        healthCheckData: healthCheckResult
      })

      console.log('Publisher registered successfully:', response.data)
      const websiteData = {
        id: response.data.websiteId,
        publisherId: response.data.publisherId,
        url: response.data.url,
        title: response.data.title,
        suggestions: healthCheckResult.suggestions
      }
      onWebsiteAdded(websiteData)

      // Show success message
      setSuccessMessage(`Publisher registered successfully! Publisher ID: ${response.data.publisherId}`)

      // Clear form
      setWebsiteUrl('')
      setHealthCheckResult(null)

      // Navigate to ad placements step
      setTimeout(() => {
        setSuccessMessage('')
        onNavigateToNext('/publisher/placements')
      }, 2000)

    } catch (err) {
      console.error('Registration failed:', err)
      if (err.response?.status === 409) {
        setError('This publisher is already registered in the system')
      } else {
        setError(`Registration failed: ${err.response?.data?.error || err.message}`)
      }
    }

    setIsChecking(false)
  }

  return (
    <div className="website-registration">
      <h2>Register Your Website</h2>
      <div className="registration-form">
        <div className="form-group">
          <label htmlFor="website-url">Website URL</label>
          <input
            id="website-url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://localhost:3000"
            className="url-input"
          />
        </div>
        <button 
          onClick={handleHealthCheck}
          disabled={isChecking}
          className="btn btn-primary"
        >
          {isChecking ? 'Checking...' : 'Perform Health Check'}
        </button>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </div>

      {isChecking && (
        <div className="health-check-loading">
          <div className="spinner"></div>
          <p>Analyzing your website...</p>
        </div>
      )}

      {healthCheckResult && (
        <div className="health-check-result">
          <h3>Health Check Results</h3>
          <div className="result-grid">
            <div className="result-item">
              <span className="label">Status:</span>
              <span className={`status ${healthCheckResult.status}`}>
                {healthCheckResult.status}
              </span>
            </div>
            <div className="result-item">
              <span className="label">Response Time:</span>
              <span>{healthCheckResult.responseTime}ms</span>
            </div>
            <div className="result-item">
              <span className="label">DOM Elements:</span>
              <span>{healthCheckResult.domElements}</span>
            </div>
          </div>

          {healthCheckResult.status === 'healthy' && (
            <div className="registration-section">
              <h4>Website is healthy and ready for registration!</h4>
              <p>Click the button below to register this website and get your Publisher ID.</p>
              <button
                onClick={handleRegisterWebsite}
                disabled={isChecking}
                className="btn btn-primary register-btn"
              >
                {isChecking ? 'Registering...' : 'Register Website'}
              </button>
            </div>
          )}

          {healthCheckResult.suggestions && (
            <div className="placement-suggestions">
              <h4>Suggested Ad Placement Locations</h4>
              <div className="suggestions-list">
                {healthCheckResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <code className="selector">{suggestion.selector}</code>
                    <span className="description">{suggestion.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdPlacementSelector({ website, selectedPlacements, setSelectedPlacements }) {
  const [customSelector, setCustomSelector] = useState('')
  const [savedPlacements, setSavedPlacements] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load existing placements when website changes
  useEffect(() => {
    if (website?.id) {
      loadExistingPlacements()
    }
  }, [website?.id])

  const loadExistingPlacements = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/publisher/${website.publisherId}/placements`)
      setSavedPlacements(response.data)
      setSelectedPlacements(response.data.map(p => p.selector))
    } catch (error) {
      console.error('Failed to load existing placements:', error)
    }
  }

  const handlePlacementToggle = async (selector, description = '', priority = 'medium') => {
    if (!website?.id) return

    setIsLoading(true)

    try {
      if (selectedPlacements.includes(selector)) {
        // Remove placement
        const placement = savedPlacements.find(p => p.selector === selector)
        if (placement) {
          await axios.delete(`http://localhost:8080/api/placement/${placement.id}`)
        }
        setSelectedPlacements(prev => prev.filter(s => s !== selector))
        setSavedPlacements(prev => prev.filter(p => p.selector !== selector))
      } else {
        // Add placement
        const response = await axios.post(`http://localhost:8080/api/publisher/${website.publisherId}/placements`, {
          selector,
          description,
          priority
        })
        setSelectedPlacements(prev => [...prev, selector])
        setSavedPlacements(prev => [...prev, response.data])
      }
    } catch (error) {
      console.error('Failed to update placement:', error)
      alert('Failed to update ad placement. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addCustomSelector = async () => {
    if (customSelector && !selectedPlacements.includes(customSelector)) {
      await handlePlacementToggle(customSelector, `Custom placement: ${customSelector}`, 'medium')
      setCustomSelector('')
    }
  }

  return (
    <div className="ad-placement-selector">
      <h2>Select Ad Placement Locations</h2>
      <p>Choose where you want ads to appear on your website: <strong>{website?.url}</strong></p>
      
      <div className="placement-options">
        <h3>Suggested Placements</h3>
        {website?.suggestions?.map((suggestion, index) => (
          <div key={index} className="placement-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedPlacements.includes(suggestion.selector)}
                onChange={() => handlePlacementToggle(
                  suggestion.selector,
                  suggestion.description,
                  suggestion.priority
                )}
                disabled={isLoading}
              />
              <code className="selector">{suggestion.selector}</code>
              <span className="description">{suggestion.description}</span>
            </label>
          </div>
        ))}
      </div>

      <div className="custom-selector">
        <h3>Add Custom DOM Selector</h3>
        <div className="custom-selector-form">
          <input
            type="text"
            value={customSelector}
            onChange={(e) => setCustomSelector(e.target.value)}
            placeholder="e.g., .my-custom-class, #header-banner"
            className="selector-input"
          />
          <button
            onClick={addCustomSelector}
            className="btn btn-secondary"
            disabled={isLoading || !customSelector}
          >
            {isLoading ? 'Adding...' : 'Add Selector'}
          </button>
        </div>
      </div>

      {selectedPlacements.length > 0 && (
        <div className="selected-placements">
          <h3>Selected Placements ({selectedPlacements.length})</h3>
          <div className="placements-list">
            {savedPlacements.map((placement, index) => (
              <div key={placement.id || index} className="selected-placement">
                <div className="placement-info">
                  <code>{placement.selector}</code>
                  <span className="placement-description">{placement.description}</span>
                  <span className={`placement-priority priority-${placement.priority}`}>
                    {placement.priority}
                  </span>
                </div>
                <button
                  onClick={() => handlePlacementToggle(placement.selector)}
                  className="remove-btn"
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {isLoading && <div className="loading-indicator">Updating placements...</div>}
        </div>
      )}
    </div>
  )
}

// Combined Website Management Component
function WebsiteManagement({ onWebsiteAdded, onNavigateToNext, selectedPlacements, setSelectedPlacements }) {
  const [websites, setWebsites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWebsite, setSelectedWebsite] = useState(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const websitesListRef = useRef(null)

  // Website Registration State
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [healthCheckResult, setHealthCheckResult] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationError, setRegistrationError] = useState('')

  useEffect(() => {
    loadWebsites()
  }, [])

  useEffect(() => {
    checkScrollable()
  }, [websites])

  const checkScrollable = () => {
    if (websitesListRef.current) {
      const container = websitesListRef.current
      const isScrollable = container.scrollHeight > container.clientHeight

      if (isScrollable) {
        container.parentElement.classList.add('has-scroll')
      } else {
        container.parentElement.classList.remove('has-scroll')
      }
    }
  }

  const loadWebsites = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('http://localhost:8080/api/publishers')
      setWebsites(response.data)
    } catch (err) {
      console.error('Failed to load websites:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebsiteSelect = (website) => {
    setSelectedWebsite(website)
    setShowRegistration(false)
  }

  const handleShowRegistration = () => {
    setShowRegistration(true)
    setSelectedWebsite(null)
    setHealthCheckResult(null)
    setWebsiteUrl('')
    setRegistrationError('')
  }

  const handleDeleteWebsite = async (website) => {
    try {
      const publisherId = website.publisherId || website.publisher_id
      if (!publisherId) {
        alert('Error: No publisher ID found')
        return
      }

      // Delete from API
      await axios.delete(`http://localhost:8080/api/publisher/${publisherId}`)

      // Update local state
      const updatedWebsites = websites.filter(w => w.publisherId !== publisherId)
      setWebsites(updatedWebsites)

      // Clear selection if deleted website was selected
      if (selectedWebsite?.publisherId === publisherId) {
        setSelectedWebsite(null)
      }

      alert('Website deleted successfully!')
    } catch (err) {
      console.error('Failed to delete website:', err)
      alert(`Failed to delete website: ${err.response?.data?.error || err.message}`)
    }
  }

  // Website Registration Functions
  const handleHealthCheck = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter a website URL')
      return
    }

    try {
      setIsChecking(true)
      setRegistrationError('')

      const response = await axios.post('http://localhost:8080/api/health-check', {
        url: websiteUrl.trim()
      })

      setHealthCheckResult(response.data)
    } catch (error) {
      console.error('Health check failed:', error)
      setRegistrationError('Health check failed. Please check the URL and try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleRegisterWebsite = async () => {
    if (!healthCheckResult) {
      alert('Please run a health check first')
      return
    }

    try {
      setIsRegistering(true)
      setRegistrationError('')

      const response = await axios.post('http://localhost:8080/api/publisher/register', {
        url: websiteUrl.trim(),
        healthCheckData: healthCheckResult
      })

      const newWebsite = response.data
      setWebsites(prev => [...prev, newWebsite])

      if (onWebsiteAdded) {
        onWebsiteAdded(newWebsite)
      }

      // Reset form
      setWebsiteUrl('')
      setHealthCheckResult(null)
      setShowRegistration(false)

      // Select the newly registered website
      setSelectedWebsite(newWebsite)

    } catch (error) {
      console.error('Registration failed:', error)
      if (error.response?.data?.error) {
        setRegistrationError(error.response.data.error)
      } else {
        setRegistrationError('Registration failed. Please try again.')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="website-management">
      <h2>Manage Websites & Ad Placements</h2>
      <p>Select a website to manage its ad placements</p>

      <div className="management-layout">
        {/* Left Column - Websites */}
        <div className="websites-column">
          <div className="column-header">
            <h3>Your Websites</h3>
            <button
              onClick={handleShowRegistration}
              className="btn btn-primary btn-sm"
            >
            Add Website
            </button>
          </div>

          <div className="websites-list">
            {isLoading ? (
              <div className="loading-indicator">Loading...</div>
            ) : websites.length === 0 ? (
              <div className="empty-state">
                <p>No websites registered yet.</p>
              </div>
            ) : (
              <div className="websites-items" ref={websitesListRef}>
                {websites.map((website) => (
                  <WebsiteListItem
                    key={website.publisherId}
                    website={website}
                    isSelected={selectedWebsite?.publisherId === website.publisherId}
                    onSelect={() => handleWebsiteSelect(website)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Ad Placements */}
        <div className="placements-column">
          {selectedWebsite ? (
            <AdPlacementManager
              website={selectedWebsite}
              selectedPlacements={selectedPlacements}
              setSelectedPlacements={setSelectedPlacements}
              onDeleteWebsite={handleDeleteWebsite}
            />
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <div className="no-selection-icon">📍</div>
                <h3>Select a Website</h3>
                <p>Choose a website from the left to manage its ad placements</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration Dialog/Modal */}
      {showRegistration && (
        <div className="modal-overlay" onClick={() => setShowRegistration(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Website</h3>
              <button
                className="modal-close"
                onClick={() => setShowRegistration(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="registration-form">
                <div className="form-group">
                  <label htmlFor="website-url">Website URL</label>
                  <input
                    id="website-url"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="url-input"
                    disabled={isChecking || isRegistering}
                  />
                </div>

                <button
                  onClick={handleHealthCheck}
                  disabled={isChecking || isRegistering || !websiteUrl.trim()}
                  className="btn btn-secondary"
                >
                  {isChecking ? 'Checking...' : '🔍 Check Website Health'}
                </button>

                {registrationError && (
                  <div className="error-message">{registrationError}</div>
                )}

                {healthCheckResult && (
                  <div className="health-check-result">
                    <h4>Health Check Results</h4>
                    <div className="result-grid">
                      <div className="result-item">
                        <span className="label">Status:</span>
                        <span className={`status ${healthCheckResult.status}`}>
                          {healthCheckResult.status}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="label">Response Time:</span>
                        <span>{healthCheckResult.responseTime}ms</span>
                      </div>
                      <div className="result-item">
                        <span className="label">Page Title:</span>
                        <span>{healthCheckResult.pageTitle || 'No title'}</span>
                      </div>
                      <div className="result-item">
                        <span className="label">DOM Elements:</span>
                        <span>{healthCheckResult.domElements}</span>
                      </div>
                    </div>

                    {healthCheckResult.suggestions && healthCheckResult.suggestions.length > 0 && (
                      <div className="placement-suggestions">
                        <h4>Suggested Ad Placements</h4>
                        <div className="suggestions-list">
                          {healthCheckResult.suggestions.map((suggestion, index) => (
                            <div key={index} className="suggestion-item">
                              <span className="selector">{suggestion.selector}</span>
                              <span className="description">{suggestion.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="registration-section">
                      <h4>Ready to Register</h4>
                      <p>Website health check passed. Click below to register this website.</p>
                      <button
                        onClick={handleRegisterWebsite}
                        disabled={isRegistering}
                        className="btn btn-primary"
                      >
                        {isRegistering ? 'Registering...' : '✅ Register Website'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Website List Item Component
function WebsiteListItem({ website, isSelected, onSelect }) {
  return (
    <div className={`website-list-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="website-info">
        <div className="website-url-title">
          <span className="website-url">{website.url}</span>
          <span className="website-title">{website.title || 'No title'}</span>
        </div>
        <div className="website-meta">
          <span className="placement-count">{website.placementCount || 0} placements</span>
          <span className="created-date">{new Date(website.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

// Ad Placement Manager Component
function AdPlacementManager({ website, selectedPlacements, setSelectedPlacements, onDeleteWebsite }) {
  const [placements, setPlacements] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSlotSelector, setShowSlotSelector] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState([])


  useEffect(() => {
    loadPlacements()
  }, [website.publisherId])

  const loadPlacements = async () => {
    try {
      setIsLoading(true)
      const publisherId = website.publisherId || website.publisher_id
      if (!publisherId) {
        throw new Error('No publisher ID found in website object')
      }

      const response = await axios.get(`http://localhost:8080/api/publisher/${publisherId}/placements`)
      setPlacements(response.data)
      setSelectedPlacements(response.data)
    } catch (err) {
      console.error('Failed to load placements:', err)
      setError('Failed to load existing placements')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWebsite = () => {
    if (window.confirm(`Are you sure you want to delete "${website.url}"?\n\nThis will remove the website and all its ad placements permanently.`)) {
      onDeleteWebsite(website)
    }
  }

  const handleAddSlots = () => {
    setShowSlotSelector(true)
    setSelectedSlots([])
  }

  const handleSlotsSelected = (slots) => {
    console.log('handleSlotsSelected called with:', slots)
    setSelectedSlots(slots)
  }

  const handleSlotPlacementsCreated = (newPlacements) => {
    setPlacements(prev => [...prev, ...newPlacements])
    setSelectedPlacements(prev => [...prev, ...newPlacements])
    setShowSlotSelector(false)
    setSelectedSlots([])
  }

  const handleCancelSlotSelection = () => {
    setShowSlotSelector(false)
    setSelectedSlots([])
  }

  const removePlacement = async (selector) => {
    try {
      // Get the correct publisher ID from the website object
      const publisherId = website.publisherId || website.publisher_id
      console.log('Removing placement:', { selector, publisherId, website })

      if (!publisherId) {
        throw new Error('No publisher ID found in website object')
      }

      // Remove from API
      await axios.delete(`http://localhost:8080/api/publisher/${publisherId}/placements/${encodeURIComponent(selector)}`)

      // Update local state
      const updatedPlacements = placements.filter(p => p.selector !== selector)
      setPlacements(updatedPlacements)
      setSelectedPlacements(updatedPlacements)
    } catch (err) {
      console.error('Failed to remove placement:', err)
      console.error('Error details:', err.response?.data || err.message)
      setError(`Failed to remove placement: ${err.response?.data?.error || err.message}`)
    }
  }



  return (
    <div className="ad-placement-manager">
      <div className="manager-header">
        <div className="header-content">
          <h3>Ad Placements</h3>
          <p>Manage ad placements for <strong>{website.url}</strong></p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddSlots}
            className="btn btn-primary slot-btn"
          >
            Add Ad Slot
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showSlotSelector && (
        <div className="slot-selection-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Ad Slots</h3>
              <button onClick={handleCancelSlotSelection} className="close-btn">×</button>
            </div>
            <SlotSelector
              onSlotsSelected={handleSlotsSelected}
              selectedSlots={selectedSlots}
              website={website}
              onPlacementsCreated={handleSlotPlacementsCreated}
            />
          </div>
        </div>
      )}

      <div className="placements-list-section">
        <h4>Current Placements ({placements.length})</h4>
        {isLoading ? (
          <div className="loading-indicator">Loading placements...</div>
        ) : placements.length === 0 ? (
          <div className="empty-placements">
            <p>No ad placements configured yet.</p>
            <p>Add CSS selectors above to specify where ads should appear on your website.</p>
          </div>
        ) : (
          <div className="placements-preview-list">
            {placements.map((placement, index) => (
              <div key={index} className="placement-preview-item">
                <PlacementPreview placement={placement} showDetails={true} />
                <button
                  onClick={() => removePlacement(placement.selector)}
                  className="remove-placement-btn"
                  title="Remove placement"
                >
                Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="delete-website-section">
        <button
          onClick={handleDeleteWebsite}
          className="btn btn-danger btn-sm"
        >
        Delete Website
        </button>
      </div>
    </div>
  )
}

function SDKIntegration({ website }) {
  const [publisherData, setPublisherData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Load publisher data when component mounts or website changes
  useEffect(() => {
    if (website?.publisher_id || website?.publisherId) {
      loadPublisherData()
    }
  }, [website])

  const loadPublisherData = async () => {
    const publisherId = website?.publisher_id || website?.publisherId
    if (!publisherId) {
      setError('No publisher ID available')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await axios.get(`http://localhost:8080/api/publisher/${publisherId}`)
      setPublisherData(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to load publisher data:', err)
      setError('Failed to load publisher configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const publisherId = website?.publisher_id || website?.publisherId
  const sdkScript = `<script src="http://localhost:4001/src/index.js?publisherId=${publisherId}" type="module" async></script>`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sdkScript)
    alert('SDK code copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="sdk-integration">
        <h2>AdSDK Integration</h2>
        <div className="loading-indicator">Loading publisher configuration...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sdk-integration">
        <h2>AdSDK Integration</h2>
        <div className="error-message">{error}</div>
        <button onClick={loadPublisherData} className="btn btn-secondary">
          Retry
        </button>
      </div>
    )
  }

  if (!publisherData) {
    return (
      <div className="sdk-integration">
        <h2>AdSDK Integration</h2>
        <div className="error-message">No publisher data available</div>
      </div>
    )
  }

  return (
    <div className="sdk-integration">
      <h2>AdSDK Integration</h2>
      <p>Add the following script to your website's HTML head section:</p>

      <div className="sdk-code">
        <div className="code-header">
          <span>Integration Code</span>
          <button onClick={copyToClipboard} className="copy-btn">
            Copy Code
          </button>
        </div>
        <pre className="code-block">
          <code>{sdkScript}</code>
        </pre>
      </div>

      <div className="integration-steps">
        <h3>Integration Steps</h3>
        <ol>
          <li>Copy the simple script tag above</li>
          <li>Paste it in your website's HTML head section</li>
          <li>Deploy your website</li>
          <li>The SDK will automatically detect your domain and load your ad configuration</li>
        </ol>
      </div>
    </div>
  )
}

// Simple Website Card Component
function SimpleWebsiteCard({ website }) {
  const copyPublisherId = () => {
    navigator.clipboard.writeText(website.publisherId)
    alert('Publisher ID copied to clipboard!')
  }

  return (
    <div className="website-card">
      <div className="website-header">
        <div className="website-main-info">
          <div className="website-title">
            <a href={website.url} target="_blank" rel="noopener noreferrer" className="website-url">
              {website.url}
            </a>
            <span className="website-title-text">{website.title || 'No title'}</span>
          </div>
          <div className="website-meta">
            <span
              className="publisher-id"
              onClick={copyPublisherId}
              title="Click to copy Publisher ID"
            >
              ID: {website.publisherId}
            </span>
            <span>Created: {new Date(website.createdAt).toLocaleDateString()}</span>
            <span>{website.placementCount || 0} placements</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Websites Overview Component
function WebsitesOverview() {
  const [websites, setWebsites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWebsites()
  }, [])

  const loadWebsites = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('http://localhost:8080/api/publishers')
      setWebsites(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to load websites:', err)
      setError('Failed to load your websites')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadWebsites()
  }

  if (isLoading) {
    return (
      <div className="dashboard-overview">
        <h2>Your Registered Websites</h2>
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading your websites...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <h2>Your Registered Websites</h2>
        <div className="error-state">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <div className="header-content">
          <h2>Your Registered Websites</h2>
          <p>Manage your websites and ad placements</p>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <Link to="/publisher/manage" className="btn btn-primary">
          Add Website
          </Link>
        </div>
      </div>

      <div className="websites-stats">
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-number">{websites.length}</div>
            <div className="stat-label">Total Websites</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-number">
              {websites.reduce((total, site) => total + (site.placementCount || 0), 0)}
            </div>
            <div className="stat-label">Ad Placements</div>
          </div>
        </div>
      </div>

      {websites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <h3>No websites registered yet</h3>
          <p>Get started by registering your first website to begin monetizing with ads.</p>
          <Link to="/publisher/manage" className="btn btn-primary">
            Register Your First Website
          </Link>
        </div>
      ) : (
        <div className="websites-grid">
          {websites.map((website) => (
            <SimpleWebsiteCard
              key={website.publisherId}
              website={website}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main Publisher Dashboard Component
function PublisherDashboard() {
  const [registeredWebsite, setRegisteredWebsite] = useState(null)
  const [selectedPlacements, setSelectedPlacements] = useState([])
  const location = useLocation()
  const navigate = useNavigate()

  // Load existing websites on component mount
  useEffect(() => {
    loadExistingWebsites()
  }, [])

  const loadExistingWebsites = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/publishers')
      if (response.data && response.data.length > 0) {
        // Use the first publisher for demo purposes
        const publisher = response.data[0]
        setRegisteredWebsite({
          id: publisher.websiteId,
          publisherId: publisher.publisherId,
          url: publisher.url,
          title: publisher.title,
          status: publisher.status,
          health_status: publisher.healthStatus
        })
      }
    } catch (error) {
      console.error('Failed to load existing publishers:', error)
    }
  }

  const handleWebsiteAdded = (websiteData) => {
    setRegisteredWebsite(websiteData)
  }

  const handleNavigateToNext = (path) => {
    navigate(path)
  }

  return (
    <div className="publisher-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Publisher Dashboard</h1>
          <p>Manage your website monetization and ad placements</p>
        </div>

        <div className="dashboard-nav">
          <Link
            to="/publisher"
            className={`nav-tab ${location.pathname === '/publisher' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/publisher/manage"
            className={`nav-tab ${location.pathname === '/publisher/manage' ? 'active' : ''}`}
          >
            🌐 Manage Websites
          </Link>
          <Link
            to="/publisher/integration"
            className={`nav-tab ${location.pathname === '/publisher/integration' ? 'active' : ''}`}
            style={{ opacity: registeredWebsite ? 1 : 0.5, pointerEvents: registeredWebsite ? 'auto' : 'none' }}
          >
            🔧 SDK Integration
          </Link>
        </div>

        <div className="dashboard-content">
          <Routes>
            <Route
              index
              element={<WebsitesOverview />}
            />
            <Route
              path="manage"
              element={<WebsiteManagement
                onWebsiteAdded={handleWebsiteAdded}
                onNavigateToNext={handleNavigateToNext}
                selectedPlacements={selectedPlacements}
                setSelectedPlacements={setSelectedPlacements}
              />}
            />
            <Route
              path="integration"
              element={<SDKIntegration website={registeredWebsite} />}
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default PublisherDashboard
