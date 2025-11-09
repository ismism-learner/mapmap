import { City } from '../utils/cityUtils'
import './InfoCard.css'

interface InfoCardProps {
  city: City | null
  onClose: () => void
}

/**
 * 城市信息卡片组件
 * - 显示城市详细信息
 * - 支持链接和图片
 */
function InfoCard({ city, onClose }: InfoCardProps) {
  if (!city) return null

  const wikipediaUrl = city.wikiDataId
    ? `https://www.wikidata.org/wiki/${city.wikiDataId}`
    : `https://en.wikipedia.org/wiki/${encodeURIComponent(city.name)}`

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${city.latitude},${city.longitude}`

  return (
    <div className="info-card">
      <div className="info-card-header">
        <h2>{city.name}</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="info-card-body">
        <div className="info-row">
          <span className="label">国家:</span>
          <span className="value">{city.country_name}</span>
        </div>

        <div className="info-row">
          <span className="label">省/州:</span>
          <span className="value">{city.state_name}</span>
        </div>

        <div className="info-row">
          <span className="label">坐标:</span>
          <span className="value">
            {parseFloat(city.latitude).toFixed(4)}°,{' '}
            {parseFloat(city.longitude).toFixed(4)}°
          </span>
        </div>

        <div className="info-links">
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="info-link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            维基百科
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="info-link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Google 地图
          </a>
        </div>
      </div>
    </div>
  )
}

export default InfoCard
