import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { API_URL } from '../config'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    character: '',
    startDate: '',
    endDate: '',
    isDaily: '',
    ignoreDownfall: 'true' // Default to ignoring modded characters
  })

  const COLORS = {
    DEFECT: '#3182ce',
    IRONCLAD: '#c53030',
    THE_SILENT: '#38a169',
    WATCHER: '#805ad5'
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.character) params.character = filters.character
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.isDaily !== '') params.is_daily = filters.isDaily
      if (filters.ignoreDownfall !== '') params.ignore_downfall = filters.ignoreDownfall

      const [statsResponse, runsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/stats`, { params }),
        axios.get(`${API_URL}/api/runs`, { params })
      ])

      setStats(statsResponse.data)
      setRuns(runsResponse.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    fetchStats()
  }

  const handleClearFilters = () => {
    setFilters({
      character: '',
      startDate: '',
      endDate: '',
      isDaily: '',
      ignoreDownfall: 'true' // Keep default on clear
    })
    setTimeout(() => fetchStats(), 0)
  }

  if (loading || !stats) {
    return <div className="loading">Loading dashboard...</div>
  }

  // Prepare chart data
  const characterData = Object.entries(stats.character_distribution).map(([char, count]) => ({
    name: char.replace('THE_SILENT', 'Silent').replace('_', ' '),
    count,
    color: COLORS[char]
  }))

  const winRateData = Object.entries(stats.win_rate_by_character).map(([char, data]) => ({
    name: char.replace('THE_SILENT', 'Silent').replace('_', ' '),
    winRate: data.win_rate.toFixed(1),
    wins: data.wins,
    total: data.total,
    color: COLORS[char]
  }))

  // Find most picked character
  const mostPickedCharacter = Object.entries(stats.character_distribution)
    .sort(([, a], [, b]) => b - a)[0]
  const mostPickedName = mostPickedCharacter
    ? mostPickedCharacter[0].replace('THE_SILENT', 'The Silent').replace('_', ' ')
    : 'N/A'

  // Prepare time-series data for win rate over time (by date)
  const sortedRuns = [...runs].sort((a, b) => a.timestamp - b.timestamp)
  const winRateByDate = {}
  let cumulativeGames = 0
  let cumulativeWins = 0

  sortedRuns.forEach((run) => {
    cumulativeGames++
    if (run.victory) cumulativeWins++

    const date = new Date(run.timestamp * 1000).toLocaleDateString()
    winRateByDate[date] = {
      date,
      winRate: ((cumulativeWins / cumulativeGames) * 100).toFixed(1),
      games: cumulativeGames
    }
  })

  const winRateOverTime = Object.values(winRateByDate)

  // Prepare games by day data
  const gamesByDay = {}
  runs.forEach(run => {
    const date = new Date(run.timestamp * 1000).toLocaleDateString()
    if (!gamesByDay[date]) {
      gamesByDay[date] = { date, wins: 0, losses: 0 }
    }
    if (run.victory) {
      gamesByDay[date].wins++
    } else {
      gamesByDay[date].losses++
    }
  })
  const gamesByDayData = Object.values(gamesByDay).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  )

  // Prepare character runs over time (by date, cumulative)
  const characterRunsByDate = {}
  const characterCumulativeCounts = {}

  sortedRuns.forEach((run) => {
    const char = run.character
    const date = new Date(run.timestamp * 1000).toLocaleDateString()

    // Initialize cumulative count for character if not exists
    if (!characterCumulativeCounts[char]) {
      characterCumulativeCounts[char] = 0
    }
    characterCumulativeCounts[char]++

    // Initialize date entry if not exists
    if (!characterRunsByDate[date]) {
      characterRunsByDate[date] = { date }
      // Copy previous cumulative counts
      Object.keys(characterCumulativeCounts).forEach(c => {
        characterRunsByDate[date][c] = characterCumulativeCounts[c]
      })
    } else {
      // Update this character's count for this date
      characterRunsByDate[date][char] = characterCumulativeCounts[char]
    }
  })

  // Fill in missing character data for each date
  const characterTimeData = Object.values(characterRunsByDate).map(dateEntry => {
    const filledEntry = { ...dateEntry }
    Object.keys(stats.character_distribution).forEach(char => {
      if (!filledEntry[char]) {
        filledEntry[char] = 0
      }
    })
    return filledEntry
  })

  return (
    <div className="container">
      <h1>Dashboard</h1>

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

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Runs</h3>
          <div className="value">{stats.total_runs}</div>
        </div>
        <div className="stat-card">
          <h3>Victories</h3>
          <div className="value">{stats.victories}</div>
        </div>
        <div className="stat-card">
          <h3>Win Rate</h3>
          <div className="value">{stats.win_rate.toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <h3>Avg Floor Reached</h3>
          <div className="value">{stats.avg_floor_reached.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Score</h3>
          <div className="value">{Math.round(stats.avg_score).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Highest Score</h3>
          <div className="value">{stats.highest_score.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Most Picked Character</h3>
          <div className="value">{mostPickedName}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Playtime</h3>
          <div className="value">{Math.floor(stats.avg_playtime_seconds / 60)}m</div>
        </div>
      </div>

      <h2>Character Distribution</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={characterData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, count }) => `${name}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {characterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1a1a26',
                border: '1px solid #2d2d3d',
                borderRadius: '8px',
                color: '#e8e8f0'
              }}
              itemStyle={{
                color: '#e8e8f0'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <h2>Win Rate Over Time</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={winRateOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
            <XAxis dataKey="date" stroke="#b8b8c8" />
            <YAxis stroke="#b8b8c8" label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#b8b8c8' }} />
            <Tooltip
              contentStyle={{
                background: '#1a1a26',
                border: '1px solid #2d2d3d',
                borderRadius: '8px',
                color: '#e8e8f0'
              }}
              itemStyle={{
                color: '#e8e8f0'
              }}
              formatter={(value) => `${value}%`}
            />
            <Legend wrapperStyle={{ color: '#b8b8c8' }} />
            <Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#d4af37" strokeWidth={2} dot={{ fill: '#d4af37' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Games Played by Day</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gamesByDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
            <XAxis dataKey="date" stroke="#b8b8c8" />
            <YAxis stroke="#b8b8c8" />
            <Tooltip
              contentStyle={{
                background: '#1a1a26',
                border: '1px solid #2d2d3d',
                borderRadius: '8px',
                color: '#e8e8f0'
              }}
              itemStyle={{
                color: '#e8e8f0'
              }}
            />
            <Legend wrapperStyle={{ color: '#b8b8c8' }} />
            <Bar dataKey="wins" name="Wins" fill="#48bb78" stackId="a" />
            <Bar dataKey="losses" name="Losses" fill="#f56565" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2>Character Runs Over Time</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={characterTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
            <XAxis dataKey="date" stroke="#b8b8c8" />
            <YAxis stroke="#b8b8c8" label={{ value: 'Total Runs', angle: -90, position: 'insideLeft', fill: '#b8b8c8' }} />
            <Tooltip
              contentStyle={{
                background: '#1a1a26',
                border: '1px solid #2d2d3d',
                borderRadius: '8px',
                color: '#e8e8f0'
              }}
              itemStyle={{
                color: '#e8e8f0'
              }}
            />
            <Legend wrapperStyle={{ color: '#b8b8c8' }} />
            {Object.keys(stats.character_distribution).map(char => (
              <Line
                key={char}
                type="monotone"
                dataKey={char}
                name={char.replace('THE_SILENT', 'Silent').replace('_', ' ')}
                stroke={COLORS[char]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Win Rate Details</h2>
      <div className="stats-grid">
        {Object.entries(stats.win_rate_by_character).map(([char, data]) => (
          <div className="stat-card" key={char}>
            <h3>{char.replace('THE_SILENT', 'Silent').replace('_', ' ')}</h3>
            <div className="value">{data.win_rate.toFixed(1)}%</div>
            <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {data.wins} / {data.total} wins
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
