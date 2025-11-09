import { useState, useEffect, useRef } from 'react'
import { smartSearch, SearchResult } from '../utils/unifiedSearchUtils'
import { CloseIcon } from './Icons'
import './SearchBar.css'

interface SearchBarProps {
  cities: any[] // 兼容旧接口，但不再使用
  onSelectCity: (city: any) => void
}

/**
 * 统一搜索栏组件
 * - 智能三层搜索（国家/省州/城市）
 * - 通过逗号数量自动判断搜索层级
 * - 支持中文和拼音搜索
 */
function SearchBar({ cities, onSelectCity }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      setShowResults(false)
      return
    }

    // 智能搜索（根据逗号数量判断层级）
    let isCancelled = false

    smartSearch(query).then(searchResults => {
      if (!isCancelled) {
        setResults(searchResults)
        setShowResults(true)
        setSelectedIndex(0)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [query])

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

  const handleSelectCity = (result: SearchResult) => {
    setQuery('')
    setShowResults(false)

    // 转换为旧的City格式，保持兼容性
    const cityData = {
      id: parseInt(result.id.split('-')[1]) || 0,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      state_name: result.displayPath.split(', ')[0] || '',
      country_name: result.displayPath.split(', ').pop() || '',
      state_id: 0,
      state_code: '',
      country_id: 0,
      country_code: '',
      wikiDataId: ''
    }

    onSelectCity(cityData)
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
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
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
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectCity(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-city-name">{result.name}</div>
              <div className="result-location">{result.displayPath}</div>
            </div>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && (
        <div className="search-results">
          <div className="no-results">未找到匹配结果</div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
