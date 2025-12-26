import { useState, useEffect } from 'react'
import axios from 'axios'

function Enemies() {
  const [enemies, setEnemies] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('encounters')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filters, setFilters] = useState({
    character: '',
    startDate: '',
    endDate: '',
    ascensionLevel: '',
    victory: '',
    isDaily: '',
    ignoreDownfall: 'true'
  })

  const fetchEnemies = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.character) params.character = filters.character
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.ascensionLevel !== '') params.ascension_level = filters.ascensionLevel
      if (filters.victory !== '') params.victory = filters.victory
      if (filters.isDaily !== '') params.is_daily = filters.isDaily
      if (filters.ignoreDownfall !== '') params.ignore_downfall = filters.ignoreDownfall

      const response = await axios.get('http://localhost:5000/api/enemies', { params })
      setEnemies(response.data)
    } catch (error) {
      console.error('Error fetching enemies:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEnemies()
  }, [])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    fetchEnemies()
  }

  const handleClearFilters = () => {
    setFilters({
      character: '',
      startDate: '',
      endDate: '',
      ascensionLevel: '',
      victory: '',
      isDaily: '',
      ignoreDownfall: 'true'
    })
    setTimeout(() => fetchEnemies(), 0)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedEnemies = [...enemies].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  if (loading) {
    return <div className="loading">Loading enemy statistics...</div>
  }

  return (
    <div className="container">
      <h1>Enemy Analysis</h1>

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
          Ascension Level
          <input
            type="number"
            name="ascensionLevel"
            value={filters.ascensionLevel}
            onChange={handleFilterChange}
            placeholder="Any"
            min="0"
            max="20"
          />
        </label>
        <label>
          Result
          <select name="victory" value={filters.victory} onChange={handleFilterChange}>
            <option value="">All Runs</option>
            <option value="true">Victories Only</option>
            <option value="false">Defeats Only</option>
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

      <div style={{ marginBottom: '1rem', color: '#4a5568' }}>
        Showing {enemies.length} enemy types
      </div>

      <table className="runs-table">
        <thead>
          <tr>
            <th>Enemy</th>
            <th onClick={() => handleSort('encounters')} style={{ cursor: 'pointer' }}>
              Encounters {sortBy === 'encounters' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('avg_damage')} style={{ cursor: 'pointer' }}>
              Avg Damage {sortBy === 'avg_damage' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('avg_turns')} style={{ cursor: 'pointer' }}>
              Avg Turns {sortBy === 'avg_turns' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('defeats_player')} style={{ cursor: 'pointer' }}>
              Player Defeats {sortBy === 'defeats_player' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('defeat_rate')} style={{ cursor: 'pointer' }}>
              Defeat Rate % {sortBy === 'defeat_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('in_victories')} style={{ cursor: 'pointer' }}>
              In Victories {sortBy === 'in_victories' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('in_defeats')} style={{ cursor: 'pointer' }}>
              In Defeats {sortBy === 'in_defeats' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEnemies.map((enemy, index) => (
            <tr key={index}>
              <td style={{ fontWeight: 600 }}>{enemy.enemy}</td>
              <td>{enemy.encounters}</td>
              <td>{enemy.avg_damage.toFixed(1)}</td>
              <td>{enemy.avg_turns.toFixed(1)}</td>
              <td>
                <span style={{
                  color: enemy.defeats_player > 0 ? '#ef4444' : '#10b981',
                  fontWeight: 600
                }}>
                  {enemy.defeats_player}
                </span>
              </td>
              <td>
                <span style={{
                  color: enemy.defeat_rate > 10 ? '#ef4444' : enemy.defeat_rate > 5 ? '#f59e0b' : '#10b981',
                  fontWeight: 600
                }}>
                  {enemy.defeat_rate.toFixed(1)}%
                </span>
              </td>
              <td>{enemy.in_victories}</td>
              <td>{enemy.in_defeats}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Enemies
