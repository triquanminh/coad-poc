import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './PublisherDashboard.css'

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

  const sdkScript = publisherData ? `<!-- COAD AdSDK Integration -->
  <script>
    window.COADConfig = {
      publisherId: '${publisherData.publisherId}',
      debug: false // Set to true for development
    };
  </script>
  <script src="http://localhost:4001/adsdk.js" async></script>
<!-- COAD AdSDK Integration -->
`
: '// Loading...'

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

      <div className="integration-info">
        <div className="info-item">
          <span className="label">Publisher ID:</span>
          <code className="publisher-id">{publisherData.publisherId}</code>
        </div>
        <div className="info-item">
          <span className="label">Website:</span>
          <span>{publisherData.url}</span>
        </div>
        <div className="info-item">
          <span className="label">Ad Placements:</span>
          <span>{publisherData.placementDetails?.length || 0} locations</span>
        </div>
        <div className="info-item">
          <span className="label">Status:</span>
          <span className={`status ${publisherData.healthStatus}`}>
            {publisherData.healthStatus || 'Unknown'}
          </span>
        </div>
      </div>

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
          <li>Copy the code above</li>
          <li>Paste it in your website's HTML head section</li>
          <li>Deploy your website</li>
          <li>Ads will automatically appear in your selected locations</li>
          <li><strong>Add new placements anytime</strong> - no code updates needed!</li>
        </ol>
      </div>

      <div className="sdk-info">
        <h3>AdSDK Features</h3>
        <p><strong>🔄 Dynamic Configuration:</strong> Automatically fetches latest ad placements from API</p>
        <p><strong>📱 Responsive:</strong> Works on all devices and screen sizes</p>
        <p><strong>⚡ Fast Loading:</strong> Asynchronous, non-blocking (~15KB gzipped)</p>
        <p><strong>🎯 Smart Placement:</strong> Automatically finds and fills your selected elements</p>
        <p><strong>🔧 No Maintenance:</strong> Add/remove placements without updating code</p>
      </div>
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
            Website Registration
          </Link>
          <Link 
            to="/publisher/placements" 
            className={`nav-tab ${location.pathname === '/publisher/placements' ? 'active' : ''}`}
            style={{ opacity: registeredWebsite ? 1 : 0.5, pointerEvents: registeredWebsite ? 'auto' : 'none' }}
          >
            Ad Placements
          </Link>
          <Link 
            to="/publisher/integration" 
            className={`nav-tab ${location.pathname === '/publisher/integration' ? 'active' : ''}`}
            style={{ opacity: registeredWebsite ? 1 : 0.5, pointerEvents: registeredWebsite ? 'auto' : 'none' }}
          >
            SDK Integration
          </Link>
        </div>

        <div className="dashboard-content">
          <Routes>
            <Route
              index
              element={<WebsiteRegistration
                onWebsiteAdded={handleWebsiteAdded}
                onNavigateToNext={handleNavigateToNext}
              />}
            />
            <Route
              path="placements"
              element={<AdPlacementSelector
                website={registeredWebsite}
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
