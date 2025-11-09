import { useState, useEffect, useRef } from 'react'
import { City, searchCities } from '../utils/cityUtils'
import { TranslationData } from '../utils/translationUtils'
import './SearchBar.css'

interface SearchBarProps {
  cities: City[]
  onSelectCity: (city: City) => void
  translations?: TranslationData | null
}

/**
 * 城市搜索栏组件
 * - 实时搜索城市
 * - 显示搜索结果
 * - 支持键盘导航
 */
function SearchBar({ cities, onSelectCity, translations }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      setShowResults(false)
      return
    }

    const searchResults = searchCities(cities, query, translations || undefined)
    setResults(searchResults)
    setShowResults(true)
    setSelectedIndex(0)
  }, [query, cities, translations])

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectCity = (city: City) => {
    setQuery('')
    setShowResults(false)
    onSelectCity(city)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectCity(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        break
    }
  }

  return (
    <div className="search-bar" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索城市或国家..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className="clear-button"
            onClick={() => {
              setQuery('')
              setShowResults(false)
            }}
          >
            ×
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((city, index) => (
            <div
              key={city.id}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectCity(city)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-city-name">{city.name}</div>
              <div className="result-location">
                {city.state_name}, {city.country_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && (
        <div className="search-results">
          <div className="no-results">未找到匹配的城市</div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
