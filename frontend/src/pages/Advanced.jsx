import { useState, useEffect } from 'react'
import axios from 'axios'

function Advanced() {
  const [correlationData, setCorrelationData] = useState(null)
  const [topCorrelations, setTopCorrelations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariables, setSelectedVariables] = useState([])
  const [selectedTargetVariable, setSelectedTargetVariable] = useState('')
  const [hiddenCorrelations, setHiddenCorrelations] = useState([])
  const [filters, setFilters] = useState({
    character: '',
    startDate: '',
    endDate: '',
    isDaily: '',
    ignoreDownfall: 'true',
    victory: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.character) params.character = filters.character
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.isDaily !== '') params.is_daily = filters.isDaily
      if (filters.ignoreDownfall !== '') params.ignore_downfall = filters.ignoreDownfall
      if (filters.victory !== '') params.victory = filters.victory

      const [corrResponse, topResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/correlation', { params }),
        axios.get('http://localhost:5000/api/correlation/top', { params })
      ])

      setCorrelationData(corrResponse.data)
      setTopCorrelations(topResponse.data)

      // Initialize with all variables selected
      setSelectedVariables(corrResponse.data.features)
    } catch (error) {
      console.error('Error fetching correlation data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleApplyFilters = () => {
    fetchData()
  }

  const handleClearFilters = () => {
    setFilters({
      character: '',
      startDate: '',
      endDate: '',
      isDaily: '',
      ignoreDownfall: 'true',
      victory: ''
    })
    setTimeout(() => fetchData(), 0)
  }

  const toggleVariable = (variable) => {
    setSelectedVariables(prev =>
      prev.includes(variable)
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    )
  }

  const selectAll = () => {
    setSelectedVariables(correlationData.features)
  }

  const deselectAll = () => {
    setSelectedVariables([])
  }

  const getColor = (value) => {
    // Enhanced color scale for dark mode with better contrast
    const absValue = Math.abs(value)
    if (value > 0) {
      // Green gradient - darker background, brighter for high values
      if (absValue < 0.3) return `rgba(34, 197, 94, ${0.2 + absValue * 0.3})`
      if (absValue < 0.6) return `rgba(34, 197, 94, ${0.4 + absValue * 0.4})`
      return `rgba(34, 197, 94, ${0.6 + absValue * 0.4})`
    } else {
      // Red gradient - darker background, brighter for high values
      if (absValue < 0.3) return `rgba(239, 68, 68, ${0.2 + absValue * 0.3})`
      if (absValue < 0.6) return `rgba(239, 68, 68, ${0.4 + absValue * 0.4})`
      return `rgba(239, 68, 68, ${0.6 + absValue * 0.4})`
    }
  }

  const getTopCorrelationsForVariable = (variable) => {
    const varIndex = correlationData.features.indexOf(variable)
    if (varIndex === -1) return []

    const correlations = correlationData.features
      .map((feature, idx) => ({
        feature,
        correlation: correlationData.matrix[varIndex][idx]
      }))
      .filter(item => item.feature !== variable && !hiddenCorrelations.includes(item.feature))
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

    return correlations.slice(0, 5)
  }

  const handleRemoveCorrelation = (feature) => {
    setHiddenCorrelations([...hiddenCorrelations, feature])
  }

  const handleResetHidden = () => {
    setHiddenCorrelations([])
  }

  const formatVariableName = (name) => {
    // Add card ranges for deck size labels
    if (name === 'small_deck') return 'Small Deck (10-25 cards)'
    if (name === 'medium_deck') return 'Medium Deck (26-40 cards)'
    if (name === 'large_deck') return 'Large Deck (40+ cards)'

    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading || !correlationData || !topCorrelations) {
    return <div className="loading">Loading correlation analysis...</div>
  }

  // Filter correlation matrix based on selected variables
  const selectedIndices = selectedVariables.map(v => correlationData.features.indexOf(v))
  const filteredFeatures = selectedVariables
  const filteredMatrix = selectedIndices.map(i =>
    selectedIndices.map(j => correlationData.matrix[i][j])
  )

  return (
    <div className="container">
      <h1>Advanced Analytics</h1>

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
          <input
            type="checkbox"
            name="victory"
            checked={filters.victory === 'true'}
            onChange={(e) => {
              setFilters({
                ...filters,
                victory: e.target.checked ? 'true' : ''
              })
            }}
            style={{ width: 'auto', marginRight: '8px' }}
          />
          Victories Only
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

      <h2>Variable Explorer</h2>
      <div style={{
        background: 'var(--card-background)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Explore Correlations by Variable
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Select a variable to see its top 5 correlations:
          </label>
          <select
            value={selectedTargetVariable}
            onChange={(e) => setSelectedTargetVariable(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.75rem',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            className="dark-mode-select"
          >
            <option value="" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Choose a variable...</option>
            {correlationData.features.map(variable => (
              <option key={variable} value={variable} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                {formatVariableName(variable)}
              </option>
            ))}
          </select>
          <style>{`
            .dark-mode-select option {
              background: var(--bg-tertiary);
              color: var(--text-primary);
            }
          `}</style>
        </div>

        {selectedTargetVariable && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                Top 5 Correlations for {formatVariableName(selectedTargetVariable)}
              </h4>
              {hiddenCorrelations.length > 0 && (
                <button
                  onClick={handleResetHidden}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent-sapphire)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Reset Hidden ({hiddenCorrelations.length})
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {getTopCorrelationsForVariable(selectedTargetVariable).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: item.correlation > 0
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${item.correlation > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '8px',
                    gap: '1rem'
                  }}
                >
                  <span style={{
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    flex: 1
                  }}>
                    {idx + 1}. {formatVariableName(item.feature)}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: item.correlation > 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {item.correlation.toFixed(3)}
                  </span>
                  <button
                    onClick={() => handleRemoveCorrelation(item.feature)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="correlation-controls">
        <h2>Correlation Heatmap</h2>
        <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Select variables to display in the heatmap below:
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={deselectAll}>Deselect All</button>
        </div>
        <div className="variable-selector">
          {correlationData.features.map(variable => (
            <div
              key={variable}
              className={`variable-chip ${selectedVariables.includes(variable) ? 'selected' : ''}`}
              onClick={() => toggleVariable(variable)}
            >
              {formatVariableName(variable)}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-container" style={{
        background: 'var(--card-background)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '0.5rem',
                  textAlign: 'left',
                  position: 'sticky',
                  left: 0,
                  background: 'var(--card-background)',
                  zIndex: 2,
                  color: 'var(--text-primary)'
                }}></th>
                {filteredFeatures.map(feature => (
                  <th
                    key={feature}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'left bottom',
                      height: '120px',
                      verticalAlign: 'bottom',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {formatVariableName(feature)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((rowFeature, i) => (
                <tr key={rowFeature}>
                  <td
                    style={{
                      padding: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      position: 'sticky',
                      left: 0,
                      background: 'var(--card-background)',
                      zIndex: 1,
                      color: 'var(--text-primary)',
                      borderRight: '2px solid var(--border-color)'
                    }}
                  >
                    {formatVariableName(rowFeature)}
                  </td>
                  {filteredMatrix[i].map((value, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        background: getColor(value),
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minWidth: '60px',
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                      }}
                      title={`${formatVariableName(rowFeature)} vs ${formatVariableName(filteredFeatures[j])}: ${value.toFixed(3)}`}
                    >
                      {value.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2>Key Metrics - Top Correlations</h2>
      <div className="top-correlations" style={{
        display: 'grid',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {Object.entries(topCorrelations).map(([target, data]) => (
          <div key={target} style={{
            background: 'var(--card-background)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div className="correlation-list">
              <h3 style={{ marginBottom: '1rem', color: '#22c55e', fontSize: '1.1rem' }}>
                {formatVariableName(target)} - Positive Correlations
              </h3>
              {data.positive.slice(0, 5).map((item, idx) => (
                <div className="correlation-item" key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>{formatVariableName(item.feature)}</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>
                    {item.correlation.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>

            <div className="correlation-list" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ef4444', fontSize: '1.1rem' }}>
                {formatVariableName(target)} - Negative Correlations
              </h3>
              {data.negative.slice(0, 5).map((item, idx) => (
                <div className="correlation-item" key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>{formatVariableName(item.feature)}</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>
                    {item.correlation.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--card-background)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>How to Read This Data</h3>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <li>
            <strong style={{ color: '#22c55e' }}>Green colors</strong> indicate positive correlation (when one increases, the other tends to increase)
          </li>
          <li>
            <strong style={{ color: '#ef4444' }}>Red colors</strong> indicate negative correlation (when one increases, the other tends to decrease)
          </li>
          <li>Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation)</li>
          <li>Values near 0 indicate little to no correlation</li>
          <li>Use the Variable Explorer above to quickly find correlations for any specific metric</li>
          <li>Click variable chips to show/hide them from the heatmap</li>
        </ul>
      </div>
    </div>
  )
}

export default Advanced
