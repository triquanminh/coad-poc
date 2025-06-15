import './AdvertiserDashboard.css'

function AdvertiserDashboard() {
  return (
    <div className="advertiser-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Advertiser Dashboard</h1>
          <p>Manage your advertising campaigns and reach your target audience</p>
        </div>

        <div className="coming-soon">
          <div className="coming-soon-content">
            <div className="icon">🚧</div>
            <h2>Coming Soon</h2>
            <p>
              The Advertiser Dashboard is currently under development. 
              This will include campaign management, audience targeting, 
              and performance analytics.
            </p>
            <div className="features-preview">
              <h3>Planned Features:</h3>
              <ul>
                <li>Campaign Creation & Management</li>
                <li>Audience Targeting</li>
                <li>Real-time Analytics</li>
                <li>Budget Management</li>
                <li>Creative Asset Management</li>
                <li>Performance Reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvertiserDashboard
