import { useState, memo } from 'react'
import { CustomMarker } from '../types/customMarker'
import { LocationIcon, ClockIcon, LinkIcon, EditIcon, CloseIcon, MinusIcon, PlusIcon } from './Icons'
import './AnchoredEventPanel.css'

export interface AnchoredEvent {
  id: string
  markerId: string  // 只保存标记ID，不保存整个对象
  side: 'left' | 'right'
}

interface AnchoredEventPanelProps {
  events: AnchoredEvent[]
  markers: CustomMarker[]  // 传入完整的标记列表，实时获取最新数据
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
  markers,
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
          {isExpanded ? <MinusIcon size={20} /> : <PlusIcon size={20} />}
          <span className="event-count">{sideEvents.length}</span>
        </button>
      )}

      <div className="anchored-event-panel-scroll">
        {displayEvents.map((event) => {
          // 从markers数组中查找最新的标记数据
          const marker = markers.find(m => m.id === event.markerId)
          if (!marker) return null  // 如果标记已被删除，不显示

          return (
            <div
              key={event.id}
              className="event-card"
              data-event-id={event.id}
            >
              <div className="event-card-header">
                <h3>{marker.info.title}</h3>
                <button
                  className="event-card-close"
                  onClick={() => onClose(event.id)}
                  title="关闭"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="event-card-content">
                {/* 描述文本（主要内容区） */}
                {marker.info.description && (
                  <p className="event-description">{marker.info.description}</p>
                )}

                {/* 图片展示 */}
                {marker.info.images.length > 0 && (
                  <div className="event-images">
                    {marker.info.images.slice(0, 3).map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={img.alt}
                        className="event-image"
                      />
                    ))}
                  </div>
                )}

                {/* 链接按钮 */}
                {marker.info.links.length > 0 && (
                  <div className="event-links">
                    {marker.info.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-link-button"
                        title={link.title || link.url}
                      >
                        <LinkIcon size={16} />
                        <span className="link-text">{link.title || '查看链接'}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* 底部信息栏：位置 + 时间 + 编辑按钮 */}
                <div className="event-footer">
                  <div className="event-meta-compact">
                    <div className="event-location-compact">
                      <LocationIcon size={12} />
                      <span>{marker.latitude.toFixed(2)}°, {marker.longitude.toFixed(2)}°</span>
                    </div>
                    {marker.createdAt && (
                      <div className="event-time-compact">
                        <ClockIcon size={12} />
                        <span>{new Date(marker.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="event-edit-btn-compact"
                    onClick={() => onEdit(marker)}
                    title="编辑详情"
                  >
                    <EditIcon size={16} />
                  </button>
                </div>
              </div>

              {/* 锚点元素，用于连接线的起点 */}
              <div className="event-card-anchor" data-anchor-id={event.id}></div>
            </div>
          )
        })}

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
