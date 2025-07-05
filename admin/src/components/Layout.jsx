import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-content">
          <h1>COAD Admin Dashboard</h1>
          <div className="header-info">
            <span className="api-status">API: localhost:8080</span>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <nav className="admin-sidebar">
          <ul className="nav-menu">
            <li>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/publishers"
                className={`nav-link ${isActive('/publishers') ? 'active' : ''}`}
              >
                👥 Publishers
              </Link>
            </li>
          </ul>
        </nav>

        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
