import { Outlet, Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout() {
  const location = useLocation()

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <h1>COAD Platform</h1>
          </Link>
          <nav className="nav">
            <Link 
              to="/publisher" 
              className={`nav-link ${location.pathname.startsWith('/publisher') ? 'active' : ''}`}
            >
              Publisher Portal
            </Link>
            <Link 
              to="/advertiser" 
              className={`nav-link ${location.pathname.startsWith('/advertiser') ? 'active' : ''}`}
            >
              Advertiser Portal
            </Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 COAD Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
