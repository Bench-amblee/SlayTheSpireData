import { useState, useEffect } from 'react'
import axios from 'axios'
import './AllRuns.css'
import { API_URL } from '../config'

function AllRuns() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRun, setExpandedRun] = useState(null)
  const [filters, setFilters] = useState({
    character: '',
    startDate: '',
    endDate: '',
    isDaily: '',
    ignoreDownfall: 'true'
  })
  const [sortOrder, setSortOrder] = useState('oldest')

  const RUNS_PER_PAGE = 15

  // Character image imports - replace these with actual images
  const characterImages = {
    'IRONCLAD': '/characters/ironclad.png',
    'THE_SILENT': '/characters/silent.png',
    'DEFECT': '/characters/defect.png',
    'WATCHER': '/characters/watcher.png'
  }

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.character) params.character = filters.character
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.isDaily !== '') params.is_daily = filters.isDaily
      if (filters.ignoreDownfall !== '') params.ignore_downfall = filters.ignoreDownfall

      const response = await axios.get(`${API_URL}/api/runs`, { params })
      setRuns(response.data)
    } catch (error) {
      console.error('Error fetching runs:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRuns()
  }, [])

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPlaytime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getCharacterName = (character) => {
    const names = {
      'IRONCLAD': 'Ironclad',
      'THE_SILENT': 'The Silent',
      'DEFECT': 'Defect',
      'WATCHER': 'Watcher'
    }
    return names[character] || character
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    fetchRuns()
  }

  const handleClearFilters = () => {
    setFilters({
      character: '',
      startDate: '',
      endDate: '',
      isDaily: '',
      ignoreDownfall: 'true'
    })
    setCurrentPage(1)
    setTimeout(() => fetchRuns(), 0)
  }

  // Sort runs based on sortOrder
  const sortedRuns = [...runs].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.timestamp - a.timestamp
    } else {
      return a.timestamp - b.timestamp
    }
  })

  // Pagination calculations
  const totalPages = Math.ceil(sortedRuns.length / RUNS_PER_PAGE)
  const startIndex = (currentPage - 1) * RUNS_PER_PAGE
  const endIndex = startIndex + RUNS_PER_PAGE
  const currentRuns = sortedRuns.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const toggleRunExpanded = (index) => {
    setExpandedRun(expandedRun === index ? null : index)
  }

  const renderRunProgression = (run) => {
    // Build progression data from damage_taken with cumulative score
    const progressionData = []
    let cumulativeScore = 0

    // Helper to determine fight type from path_taken
    const getFightType = (floor) => {
      if (!run.path_taken || floor >= run.path_taken.length) return 'M'
      const pathType = run.path_taken[floor]
      if (pathType === 'BOSS' || pathType === 'B') return 'BOSS'
      if (pathType === 'E') return 'ELITE'
      if (pathType === 'M') return 'NORMAL'
      return pathType
    }

    // Add starting point
    progressionData.push({
      floor: 0,
      score: 0,
      enemy: 'Start',
      fightType: null
    })

    // Add each fight
    if (run.damage_taken) {
      run.damage_taken.forEach((fight, idx) => {
        const floor = fight.floor
        const fightType = getFightType(floor)

        // Estimate score gain for this fight (bosses give more, elites give medium, normal give less)
        // This is an approximation since we only have final score
        let scoreGain = 10
        if (fightType === 'BOSS') scoreGain = 50
        else if (fightType === 'ELITE') scoreGain = 25

        cumulativeScore += scoreGain

        progressionData.push({
          floor,
          score: cumulativeScore,
          enemy: fight.enemies,
          damage: fight.damage,
          turns: fight.turns,
          fightType
        })
      })
    }

    // Normalize scores to actual final score
    if (cumulativeScore > 0 && run.score) {
      const scaleFactor = run.score / cumulativeScore
      progressionData.forEach(point => {
        point.score = Math.round(point.score * scaleFactor)
      })
    }

    // Chart dimensions
    const width = 800
    const height = 300
    const padding = { top: 40, right: 40, bottom: 60, left: 70 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Scales
    const maxScore = Math.max(...progressionData.map(p => p.score), 100)
    const xScale = (floor) => padding.left + (floor / 55) * chartWidth
    const yScale = (score) => padding.top + chartHeight - (score / maxScore) * chartHeight

    // Line path
    const linePath = progressionData.map((point, i) => {
      const x = xScale(point.floor)
      const y = yScale(point.score)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')

    const lineColor = run.victory ? '#22c55e' : '#ef4444'
    const fillColor = run.victory ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'

    // Helper to get fight type styling
    const getFightStyle = (fightType) => {
      switch(fightType) {
        case 'BOSS': return { color: '#fbbf24', radius: 8, label: 'Boss' }
        case 'ELITE': return { color: '#a855f7', radius: 6, label: 'Elite' }
        case 'NORMAL': return { color: lineColor, radius: 4, label: 'Normal' }
        default: return { color: lineColor, radius: 4, label: '' }
      }
    }

    return (
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-primary)' }}>Run Progression - Cumulative Score</h3>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: lineColor }} />
              <span style={{ color: 'var(--text-secondary)' }}>Normal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#a855f7' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Elite</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fbbf24' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Boss</span>
            </div>
          </div>
        </div>

        <svg width={width} height={height} style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="url(#grid)" />

          {/* Area under line */}
          <path
            d={`${linePath} L ${xScale(progressionData[progressionData.length - 1].floor)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
            fill={fillColor}
            opacity="0.3"
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points with tooltips */}
          {progressionData.map((point, i) => {
            if (i === 0) return null // Skip start point
            const style = getFightStyle(point.fightType)
            return (
              <g key={i}>
                <circle
                  cx={xScale(point.floor)}
                  cy={yScale(point.score)}
                  r={style.radius}
                  fill={style.color}
                  stroke="#1a1a26"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>
                    Floor {point.floor}: {point.enemy}
{style.label && ` (${style.label})`}
Score: {point.score}
Damage: {point.damage} HP
Turns: {point.turns}
                  </title>
                </circle>
              </g>
            )
          })}

          {/* Y-axis */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="var(--text-secondary)" strokeWidth="2" />
          <text x={padding.left - 55} y={padding.top + chartHeight / 2} fill="var(--text-secondary)" fontSize="14" textAnchor="middle" transform={`rotate(-90, ${padding.left - 55}, ${padding.top + chartHeight / 2})`}>
            Score
          </text>

          {/* X-axis */}
          <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="var(--text-secondary)" strokeWidth="2" />
          <text x={padding.left + chartWidth / 2} y={height - 20} fill="var(--text-secondary)" fontSize="14" textAnchor="middle">
            Floor
          </text>

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(percent => {
            const score = Math.round((maxScore * percent) / 100)
            return (
              <text key={percent} x={padding.left - 10} y={yScale(score) + 5} fill="var(--text-secondary)" fontSize="12" textAnchor="end">
                {score}
              </text>
            )
          })}

          {/* X-axis labels */}
          {[0, 10, 20, 30, 40, 50].map(floor => (
            <text key={floor} x={xScale(floor)} y={padding.top + chartHeight + 20} fill="var(--text-secondary)" fontSize="12" textAnchor="middle">
              {floor}
            </text>
          ))}
        </svg>

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Hover over dots to see battle details
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading runs...</div>
  }

  return (
    <div className="runs-container">
      <div className="runs-header">
        <h1>Run History</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="runs-count">
            Showing {startIndex + 1}-{Math.min(endIndex, runs.length)} of {runs.length} runs
          </div>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--background)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      <div className="filters">
        <label>
          Character
          <select name="character" value={filters.character} onChange={handleFilterChange}>
            <option value="">All Characters</option>
            <option value="DEFECT">Defect</option>
            <option value="IRONCLAD">Ironclad</option>
            <option value="THE_SILENT">The Silent</option>
            <option value="WATCHER">Watcher</option>
          </select>
        </label>
        <label>
          Daily Runs
          <select name="isDaily" value={filters.isDaily} onChange={handleFilterChange}>
            <option value="">All Runs</option>
            <option value="false">Exclude Daily</option>
            <option value="true">Daily Only</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            name="ignoreDownfall"
            checked={filters.ignoreDownfall === 'true'}
            onChange={(e) => {
              setFilters({
                ...filters,
                ignoreDownfall: e.target.checked ? 'true' : 'false'
              })
            }}
            style={{ width: 'auto', marginRight: '8px' }}
          />
          Ignore Downfall Mod
        </label>
        <label>
          Start Date
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </label>
        <button onClick={handleApplyFilters}>Apply Filters</button>
        <button onClick={handleClearFilters}>Clear</button>
      </div>

      <div className="runs-grid">
        {currentRuns.map((run, index) => {
          const globalIndex = startIndex + index
          const isExpanded = expandedRun === globalIndex

          return (
            <div key={index} className={`run-card ${run.victory ? 'victory-card' : 'defeat-card'}`}>
              <div
                className="run-card-header"
                onClick={() => toggleRunExpanded(globalIndex)}
                style={{ cursor: 'pointer' }}
              >
                <div className="character-info">
                  <div className="character-image-container">
                    <img
                      src={characterImages[run.character]}
                      alt={getCharacterName(run.character)}
                      className="character-image"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className={`character-placeholder ${run.character.toLowerCase()}`} style={{display: 'none'}}>
                      {getCharacterName(run.character)[0]}
                    </div>
                  </div>
                  <div className="character-details">
                    <h2 className="run-title">
                      {getCharacterName(run.character)} - {run.victory ? 'Victory' : 'Defeat'}
                    </h2>
                    <div className="run-subtitle">{formatDate(run.timestamp)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className={`result-badge ${run.victory ? 'victory' : 'defeat'}`}>
                    {run.victory ? '✓ Victory' : '✗ Defeat'}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    color: 'var(--text-secondary)',
                    transition: 'transform 0.2s'
                  }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              <div
                className="run-card-body"
                onClick={() => toggleRunExpanded(globalIndex)}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-row">
                  <div className="stat">
                    <div className="stat-label">Score</div>
                    <div className="stat-value">{run.score?.toLocaleString() || 0}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Ascension</div>
                    <div className="stat-value">A{run.ascension_level}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Playtime</div>
                    <div className="stat-value">{formatPlaytime(run.playtime)}</div>
                  </div>
                </div>

                {!run.victory && run.killed_by && (
                  <div className="defeat-info">
                    <div className="defeat-label">Defeated by</div>
                    <div className="defeat-enemy">{run.killed_by}</div>
                    <div className="defeat-floor">Floor {run.floor_reached}</div>
                  </div>
                )}
              </div>

              {isExpanded && renderRunProgression(run)}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AllRuns
