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
            📖 维基百科
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="info-link"
          >
            🗺️ Google 地图
          </a>
        </div>
      </div>
    </div>
  )
}

export default InfoCard
