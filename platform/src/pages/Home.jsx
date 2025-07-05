import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="container">
        <div className="hero-section">
          <h1>Welcome to COAD Platform</h1>
          <p className="hero-subtitle">
            The comprehensive advertising platform connecting publishers and advertisers
          </p>
          <div className="hero-cards">
            <div className="hero-card">
              <div className="card-icon">📰</div>
              <h3>For Publishers</h3>
              <p>Monetize your website with our advanced ad placement system</p>
              <Link to="/publisher" className="btn btn-primary">
                Publisher Portal
              </Link>
            </div>
            <div className="hero-card">
              <div className="card-icon">📢</div>
              <h3>For Advertisers</h3>
              <p>Reach your target audience across our publisher network</p>
              <Link to="/advertiser" className="btn btn-secondary">
                Advertiser Portal
              </Link>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <h2>Platform Features</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🔍</div>
              <h4>Website Health Check</h4>
              <p>Automated analysis of publisher websites for optimal ad placement</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h4>Smart Ad Placement</h4>
              <p>DOM-based targeting for maximum engagement and revenue</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h4>Easy Integration</h4>
              <p>Simple SDK integration with minimal code changes</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h4>Real-time Analytics</h4>
              <p>Comprehensive reporting and performance tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
