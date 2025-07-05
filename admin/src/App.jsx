import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PublishersManager from './pages/PublishersManager'
import './styles/App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/publishers" element={<PublishersManager />} />
      </Routes>
    </Layout>
  )
}

export default App
