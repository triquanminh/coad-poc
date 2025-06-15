import { useState, useEffect } from 'react'
import axios from 'axios'
import './PublishersManager.css'

function PublishersManager() {
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)

  useEffect(() => {
    fetchPublishers()
  }, [])

  const fetchPublishers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:8080/api/admin/publishers')
      setPublishers(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch publishers:', err)
      setError('Failed to load publishers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePublisher = async (publisherId, url) => {
    if (!confirm(`Are you sure you want to delete publisher "${publisherId}" and their website "${url}"? This will also delete all associated ad placements and health check history.`)) {
      return
    }

    try {
      setDeleteLoading(publisherId)
      await axios.delete(`http://localhost:8080/api/admin/publishers/${publisherId}`)
      
      // Remove from local state
      setPublishers(publishers.filter(p => p.publisherId !== publisherId))
      
      alert('Publisher deleted successfully')
    } catch (err) {
      console.error('Failed to delete publisher:', err)
      alert('Failed to delete publisher: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeleteLoading(null)
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

  if (loading) {
    return (
      <div className="publishers-manager">
        <div className="loading">Loading publishers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="publishers-manager">
        <div className="error">{error}</div>
        <button onClick={fetchPublishers} className="retry-btn">Retry</button>
      </div>
    )
  }

  return (
    <div className="publishers-manager">
      <div className="manager-header">
        <h1>Publishers Manager</h1>
        <p>Manage all registered publishers and their websites</p>
        <div className="header-actions">
          <button onClick={fetchPublishers} className="refresh-btn">
            🔄 Refresh
          </button>
          <div className="count-badge">
            {publishers.length} publisher{publishers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {publishers.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">👥</div>
          <h3>No publishers registered</h3>
          <p>No publishers have been registered in the system yet.</p>
        </div>
      ) : (
        <div className="publishers-grid">
          {publishers.map((publisher) => (
            <div key={publisher.publisherId} className="publisher-card">
              <div className="publisher-header">
                <div className="publisher-id">
                  <strong>Publisher ID:</strong>
                  <code>{publisher.publisherId}</code>
                </div>
                <div className="publisher-badges">
                  <span className={`status-badge ${publisher.status}`}>
                    {publisher.status}
                  </span>
                  <span className={`health-badge ${publisher.healthStatus}`}>
                    {publisher.healthStatus}
                  </span>
                </div>
              </div>

              <div className="publisher-website">
                <div className="website-url">
                  <strong>Website:</strong>
                  <a href={publisher.url} target="_blank" rel="noopener noreferrer">
                    {publisher.url}
                  </a>
                </div>
              </div>

              <div className="publisher-info">
                <div className="info-row">
                  <strong>Title:</strong> {publisher.title || 'No title'}
                </div>
                <div className="info-row">
                  <strong>Website ID:</strong> 
                  <code>{publisher.websiteId}</code>
                </div>
                <div className="info-row">
                  <strong>Response Time:</strong> {publisher.responseTime || 0}ms
                </div>
                <div className="info-row">
                  <strong>DOM Elements:</strong> {publisher.domElements || 0}
                </div>
                <div className="info-row">
                  <strong>Ad Placements:</strong> {publisher.placementCount || 0}
                </div>
              </div>

              {publisher.description && (
                <div className="publisher-description">
                  <strong>Description:</strong> {publisher.description}
                </div>
              )}

              {publisher.placements && publisher.placements.length > 0 && (
                <div className="placements-section">
                  <strong>Ad Placements:</strong>
                  <div className="placements-list">
                    {publisher.placements.map((placement) => (
                      <div key={placement.id} className="placement-item">
                        <code>{placement.selector}</code>
                        <span className="placement-priority">{placement.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {publisher.recentHealthChecks && publisher.recentHealthChecks.length > 0 && (
                <div className="health-section">
                  <strong>Recent Health Checks:</strong>
                  <div className="health-list">
                    {publisher.recentHealthChecks.slice(0, 3).map((check) => (
                      <div key={check.id} className="health-item">
                        <span className={`health-status ${check.status}`}>
                          {check.status}
                        </span>
                        <span className="health-time">
                          {formatDate(check.checked_at)}
                        </span>
                        <span className="health-response">
                          {check.response_time}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="publisher-dates">
                <div className="date-item">
                  <strong>Created:</strong> {formatDate(publisher.createdAt)}
                </div>
                <div className="date-item">
                  <strong>Updated:</strong> {formatDate(publisher.updatedAt)}
                </div>
              </div>

              <div className="publisher-actions">
                <button
                  onClick={() => handleDeletePublisher(publisher.publisherId, publisher.url)}
                  disabled={deleteLoading === publisher.publisherId}
                  className="delete-btn"
                >
                  {deleteLoading === publisher.publisherId ? 'Deleting...' : '🗑️ Delete Publisher'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PublishersManager
