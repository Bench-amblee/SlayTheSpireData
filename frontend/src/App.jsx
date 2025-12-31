import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <Router>
      <div className="app">
        <nav>
          <div className="nav-content">
            <Link to="/" className="nav-logo" onClick={closeMenu}>
              <img src={logoImage} alt="Crimps Logo" className="logo-image" />
              <span className="logo-text">Crimps</span>
            </Link>
            <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
              <span className={menuOpen ? 'open' : ''}></span>
              <span className={menuOpen ? 'open' : ''}></span>
              <span className={menuOpen ? 'open' : ''}></span>
            </button>
          </div>
          <ul className={menuOpen ? 'open' : ''}>
            <li>
              <Link to="/" onClick={closeMenu}>All Runs</Link>
            </li>
            <li>
              <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            </li>
            <li>
              <Link to="/cards" onClick={closeMenu}>Cards</Link>
            </li>
            <li>
              <Link to="/enemies" onClick={closeMenu}>Enemies</Link>
            </li>
            <li>
              <Link to="/relics" onClick={closeMenu}>Relics</Link>
            </li>
            <li>
              <Link to="/advanced" onClick={closeMenu}>Advanced Analytics</Link>
            </li>
            <li>
              <Link to="/upload" onClick={closeMenu}>Upload Runs</Link>
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
