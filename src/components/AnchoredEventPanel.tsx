import { useState, memo } from 'react'
import { CustomMarker } from '../types/customMarker'
import './AnchoredEventPanel.css'

export interface AnchoredEvent {
  id: string
  marker: CustomMarker
  side: 'left' | 'right'
}

interface AnchoredEventPanelProps {
  events: AnchoredEvent[]
  side: 'left' | 'right'
  onClose: (eventId: string) => void
  onEdit: (marker: CustomMarker) => void
}

const COLLAPSE_THRESHOLD = 8 // 超过8个事件时自动收缩

/**
 * 侧边锚定事件面板（性能优化+折叠功能）
 * - 固定在屏幕左侧或右侧
 * - 显示激活的事件卡片列表
 * - 超过8个事件时自动收缩，可展开
 * - 使用 React.memo 优化性能
 */
const AnchoredEventPanel = memo(function AnchoredEventPanel({
  events,
  side,
  onClose,
  onEdit
}: AnchoredEventPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sideEvents = events.filter(e => e.side === side)

  if (sideEvents.length === 0) {
    return null
  }

  const shouldCollapse = sideEvents.length > COLLAPSE_THRESHOLD
  const displayEvents = (shouldCollapse && !isExpanded)
    ? sideEvents.slice(0, 3) // 收缩时只显示前3个
    : sideEvents

  return (
    <div className={`anchored-event-panel anchored-event-panel-${side} ${shouldCollapse && !isExpanded ? 'collapsed' : ''}`}>
      {/* 折叠/展开按钮 */}
      {shouldCollapse && (
        <button
          className="panel-toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? '收起' : '展开更多'}
        >
          {isExpanded ? '−' : '+'}
          <span className="event-count">{sideEvents.length}</span>
        </button>
      )}

      <div className="anchored-event-panel-scroll">
        {displayEvents.map((event) => (
          <div
            key={event.id}
            className="event-card"
            data-event-id={event.id}
          >
            <div className="event-card-header">
              <h3>{event.marker.info.title}</h3>
              <button
                className="event-card-close"
                onClick={() => onClose(event.id)}
                title="关闭"
              >
                ×
              </button>
            </div>

            <div className="event-card-content">
              {event.marker.info.description && (
                <p className="event-description">{event.marker.info.description}</p>
              )}

              <div className="event-meta">
                <div className="event-location">
                  📍 {event.marker.latitude.toFixed(2)}°, {event.marker.longitude.toFixed(2)}°
                </div>
                {event.marker.createdAt && (
                  <div className="event-time">
                    🕒 {new Date(event.marker.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>

              {event.marker.info.images.length > 0 && (
                <div className="event-images">
                  {event.marker.info.images.slice(0, 3).map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.alt}
                      className="event-image-thumb"
                    />
                  ))}
                </div>
              )}

              {event.marker.info.links.length > 0 && (
                <div className="event-links">
                  {event.marker.info.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-link"
                    >
                      🔗 {link.title || link.url}
                    </a>
                  ))}
                </div>
              )}

              <button
                className="event-edit-btn"
                onClick={() => onEdit(event.marker)}
              >
                ✏️ 编辑详情
              </button>
            </div>

            {/* 锚点元素，用于连接线的起点 */}
            <div className="event-card-anchor" data-anchor-id={event.id}></div>
          </div>
        ))}

        {/* 收缩状态提示 */}
        {shouldCollapse && !isExpanded && (
          <div className="collapse-hint">
            还有 {sideEvents.length - 3} 个事件...
          </div>
        )}
      </div>
    </div>
  )
})

export default AnchoredEventPanel
