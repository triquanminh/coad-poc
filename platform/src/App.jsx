import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import PublisherDashboard from './pages/PublisherDashboard'
import AdvertiserDashboard from './pages/AdvertiserDashboard'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="publisher/*" element={<PublisherDashboard />} />
            <Route path="advertiser/*" element={<AdvertiserDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
