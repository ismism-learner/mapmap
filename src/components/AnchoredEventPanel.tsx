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

/**
 * 侧边锚定事件面板（性能优化+单卡折叠功能）
 * - 固定在屏幕左侧或右侧
 * - 显示激活的事件卡片列表
 * - 每个卡片可独立收起/展开
 * - 使用 React.memo 优化性能
 */
const AnchoredEventPanel = memo(function AnchoredEventPanel({
  events,
  markers,
  side,
  onClose,
  onEdit
}: AnchoredEventPanelProps) {
  // 管理每个事件卡的收起/展开状态（默认全部展开）
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set())

  const sideEvents = events.filter(e => e.side === side)

  if (sideEvents.length === 0) {
    return null
  }

  // 切换单个卡片的收起/展开状态
  const toggleCardCollapse = (eventId: string) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  return (
    <div className={`anchored-event-panel anchored-event-panel-${side}`}>
      <div className="anchored-event-panel-scroll">
        {sideEvents.map((event) => {
          // 从markers数组中查找最新的标记数据
          const marker = markers.find(m => m.id === event.markerId)
          if (!marker) return null  // 如果标记已被删除，不显示

          const isCollapsed = collapsedCards.has(event.id)

          return (
            <div
              key={event.id}
              className={`event-card ${isCollapsed ? 'collapsed' : ''}`}
              data-event-id={event.id}
            >
              <div className="event-card-header">
                <h3>{marker.info.title}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="event-card-toggle"
                    onClick={() => toggleCardCollapse(event.id)}
                    title={isCollapsed ? '展开' : '收起'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#00ffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      transition: 'transform 0.2s'
                    }}
                  >
                    {isCollapsed ? <PlusIcon size={18} /> : <MinusIcon size={18} />}
                  </button>
                  <button
                    className="event-card-close"
                    onClick={() => onClose(event.id)}
                    title="关闭"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
              </div>

              {/* 只在展开时显示内容 */}
              {!isCollapsed && (
                <div className="event-card-content">
                {/* 描述文本（主要内容区） */}
                {marker.info.description && (
                  <p className="event-description">{marker.info.description}</p>
                )}

                {/* 图片展示 */}
                {marker.info.images.length > 0 && (
                  <div className="event-images">
                    {marker.info.images.slice(0, 3).map((img) => {
                      // 确定跳转链接：优先B站视频，其次第一个链接
                      const linkUrl = marker.info.videoInfo?.url || marker.info.links[0]?.url

                      return linkUrl ? (
                        <a
                          key={img.id}
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer', display: 'block' }}
                        >
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="event-image"
                            style={{ transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          />
                        </a>
                      ) : (
                        <img
                          key={img.id}
                          src={img.url}
                          alt={img.alt}
                          className="event-image"
                        />
                      )
                    })}
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
                    {(marker.info.time || marker.createdAt) && (
                      <div className="event-time-compact">
                        <ClockIcon size={12} />
                        <span>
                          {marker.info.time || new Date(marker.createdAt).toLocaleDateString('zh-CN')}
                        </span>
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
              )}

              {/* 锚点元素，用于连接线的起点 */}
              <div className="event-card-anchor" data-anchor-id={event.id}></div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default AnchoredEventPanel
