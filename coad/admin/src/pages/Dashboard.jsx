import { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:8080/api/admin/stats')
      setStats(response.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
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
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">{error}</div>
        <button onClick={fetchStats} className="retry-btn">Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={fetchStats} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Publishers</h3>
            <div className="stat-number">{stats?.totalPublishers || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Ad Placements</h3>
            <div className="stat-number">{stats?.totalPlacements || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Avg Response Time</h3>
            <div className="stat-number">{stats?.averageResponseTime || 0}ms</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Health Status</h2>
          <div className="health-stats">
            <div className="health-item healthy">
              <span className="health-icon">✅</span>
              <span>Healthy: {stats?.healthyWebsites || 0}</span>
            </div>
            <div className="health-item unhealthy">
              <span className="health-icon">❌</span>
              <span>Unhealthy: {stats?.unhealthyWebsites || 0}</span>
            </div>
            <div className="health-item active">
              <span className="health-icon">🟢</span>
              <span>Active: {stats?.activeWebsites || 0}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Recent Publishers</h2>
          <div className="recent-websites">
            {stats?.recentWebsites?.length > 0 ? (
              stats.recentWebsites.map((website) => (
                <div key={website.id} className="website-item">
                  <div className="website-info">
                    <div className="website-url">{website.url}</div>
                    <div className="website-meta">
                      Publisher: {website.publisherId} • {formatDate(website.createdAt)}
                    </div>
                  </div>
                  <div className="website-status">
                    <span className={`status-badge ${website.status}`}>
                      {website.status}
                    </span>
                    <span className={`health-badge ${website.healthStatus}`}>
                      {website.healthStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No publishers registered yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
