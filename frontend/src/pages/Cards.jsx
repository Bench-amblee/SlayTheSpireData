import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCardCharacter, CharacterIcon } from '../utils/characterMapping.jsx'
import { API_URL } from '../config'

function Cards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('picks')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filters, setFilters] = useState({
    character: '',
    rarity: '',
    startDate: '',
    endDate: '',
    ascensionLevel: '',
    victory: '',
    isDaily: '',
    ignoreDownfall: 'true'
  })

  const fetchCards = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.character) params.character = filters.character
      if (filters.rarity) params.rarity = filters.rarity
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.ascensionLevel !== '') params.ascension_level = filters.ascensionLevel
      if (filters.victory !== '') params.victory = filters.victory
      if (filters.isDaily !== '') params.is_daily = filters.isDaily
      if (filters.ignoreDownfall !== '') params.ignore_downfall = filters.ignoreDownfall

      const response = await axios.get(`${API_URL}/api/cards`, { params })
      setCards(response.data)
    } catch (error) {
      console.error('Error fetching cards:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    fetchCards()
  }

  const handleClearFilters = () => {
    setFilters({
      character: '',
      rarity: '',
      startDate: '',
      endDate: '',
      ascensionLevel: '',
      victory: '',
      isDaily: '',
      ignoreDownfall: 'true'
    })
    setTimeout(() => fetchCards(), 0)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedCards = [...cards].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  if (loading) {
    return <div className="loading">Loading card statistics...</div>
  }

  return (
    <div className="container">
      <h1>Card Analysis</h1>

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
          Rarity
          <select name="rarity" value={filters.rarity} onChange={handleFilterChange}>
            <option value="">All Rarities</option>
            <option value="Basic">Basic</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Curse">Curse</option>
            <option value="Status">Status</option>
            <option value="Special">Special</option>
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
        Showing {cards.length} cards
      </div>

      <table className="runs-table">
        <thead>
          <tr>
            <th>Card</th>
            <th onClick={() => handleSort('rarity')} style={{ cursor: 'pointer' }}>
              Rarity {sortBy === 'rarity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('picks')} style={{ cursor: 'pointer' }}>
              Picks {sortBy === 'picks' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('pick_rate')} style={{ cursor: 'pointer' }}>
              Pick Rate % {sortBy === 'pick_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('picked_upgraded')} style={{ cursor: 'pointer' }}>
              Picked Upgraded {sortBy === 'picked_upgraded' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('campfire_upgrades')} style={{ cursor: 'pointer' }}>
              Campfire Upgrades {sortBy === 'campfire_upgrades' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('win_rate')} style={{ cursor: 'pointer' }}>
              Win Rate % {sortBy === 'win_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('victories')} style={{ cursor: 'pointer' }}>
              Victories {sortBy === 'victories' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Times Available</th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.map((card, index) => {
            const characters = card.characters || []
            const getRarityColor = (rarity) => {
              switch(rarity) {
                case 'Common': return '#9e9e9e'
                case 'Uncommon': return '#4fc3f7'
                case 'Rare': return '#ffd700'
                case 'Basic': return '#ffffff'
                case 'Curse': return '#9c27b0'
                case 'Status': return '#607d8b'
                case 'Special': return '#00e676'
                default: return 'var(--text-secondary)'
              }
            }
            return (
              <tr key={index}>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>{card.card}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {characters.map(char => (
                        <CharacterIcon key={char} character={char} size="small" />
                      ))}
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ color: getRarityColor(card.rarity), fontWeight: 500 }}>
                    {card.rarity || 'Unknown'}
                  </span>
                </td>
                <td>{card.picks}</td>
                <td>{card.pick_rate.toFixed(1)}%</td>
                <td>{card.picked_upgraded || 0}</td>
                <td>{card.campfire_upgrades || 0}</td>
                <td>
                  <span style={{
                    color: card.win_rate > 50 ? 'var(--success)' : card.win_rate < 30 ? 'var(--danger)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    {card.win_rate.toFixed(1)}%
                  </span>
                </td>
                <td>{card.victories}</td>
                <td>{card.times_available}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Cards
