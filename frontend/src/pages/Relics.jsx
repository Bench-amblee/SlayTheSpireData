import { useState, useEffect } from 'react'
import axios from 'axios'
import { getRelicCharacter, CharacterIcon } from '../utils/characterMapping.jsx'

function Relics() {
  const [relics, setRelics] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('picks')
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

  const fetchRelics = async () => {
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

      const response = await axios.get('http://localhost:5000/api/relics', { params })
      setRelics(response.data)
    } catch (error) {
      console.error('Error fetching relics:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRelics()
  }, [])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    fetchRelics()
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
    setTimeout(() => fetchRelics(), 0)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedRelics = [...relics].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  if (loading) {
    return <div className="loading">Loading relic statistics...</div>
  }

  return (
    <div className="container">
      <h1>Relic Analysis</h1>

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

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        Showing {relics.length} relics
      </div>

      <table className="runs-table">
        <thead>
          <tr>
            <th>Relic</th>
            <th onClick={() => handleSort('picks')} style={{ cursor: 'pointer' }}>
              Picks {sortBy === 'picks' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('win_rate')} style={{ cursor: 'pointer' }}>
              Win Rate % {sortBy === 'win_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('victories')} style={{ cursor: 'pointer' }}>
              Victories {sortBy === 'victories' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('defeats')} style={{ cursor: 'pointer' }}>
              Defeats {sortBy === 'defeats' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRelics.map((relic, index) => {
            const characters = relic.characters || []
            return (
              <tr key={index}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>{relic.relic}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {characters.map(char => (
                        <CharacterIcon key={char} character={char} size="small" />
                      ))}
                    </div>
                  </div>
                </td>
                <td>{relic.picks}</td>
                <td>
                  <span style={{
                    color: relic.win_rate > 50 ? 'var(--success)' : relic.win_rate < 30 ? 'var(--danger)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    {relic.win_rate.toFixed(1)}%
                  </span>
                </td>
                <td>{relic.victories}</td>
                <td>{relic.defeats}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Relics
