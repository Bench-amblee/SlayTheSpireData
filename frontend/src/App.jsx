import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AllRuns from './pages/AllRuns'
import Dashboard from './pages/Dashboard'
import Advanced from './pages/Advanced'
import Cards from './pages/Cards'
import Enemies from './pages/Enemies'
import Relics from './pages/Relics'
import Upload from './pages/Upload'
import logoImage from './assets/ghost.png'

function App() {
  return (
    <Router>
      <div className="app">
        <nav>
          <Link to="/" className="nav-logo">
            <img src={logoImage} alt="Crimps Logo" className="logo-image" />
            <span className="logo-text">Crimps</span>
          </Link>
          <ul>
            <li>
              <Link to="/">All Runs</Link>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/cards">Cards</Link>
            </li>
            <li>
              <Link to="/enemies">Enemies</Link>
            </li>
            <li>
              <Link to="/relics">Relics</Link>
            </li>
            <li>
              <Link to="/advanced">Advanced Analytics</Link>
            </li>
            <li>
              <Link to="/upload">Upload Runs</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<AllRuns />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/enemies" element={<Enemies />} />
          <Route path="/relics" element={<Relics />} />
          <Route path="/advanced" element={<Advanced />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
