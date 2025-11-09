import { useState } from 'react'
import { CustomMarker, MarkerConnection } from '../types/customMarker'
import './ManagementPanel.css'

interface ManagementPanelProps {
  customMarkers: CustomMarker[]
  connections: MarkerConnection[]
  onDeleteMarker: (markerId: string) => void
  onDeleteConnection: (connectionId: string) => void
  onSelectMarker?: (marker: CustomMarker) => void
  onClose: () => void
}

/**
 * 管理面板 - 管理所有图钉和连接（受控组件）
 * - 列出所有现有的图钉标记
 * - 列出所有连接线
 * - 支持删除功能
 */
function ManagementPanel({
  customMarkers,
  connections,
  onDeleteMarker,
  onDeleteConnection,
  onSelectMarker,
  onClose
}: ManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'markers' | 'connections'>('markers')

  // 获取与某个标记相关的连接数量
  const getMarkerConnectionCount = (markerId: string) => {
    return connections.filter(
      c => c.fromMarkerId === markerId || c.toMarkerId === markerId
    ).length
  }

  // 处理删除标记
  const handleDeleteMarker = (markerId: string) => {
    const marker = customMarkers.find(m => m.id === markerId)
    if (!marker) return

    const connectionCount = getMarkerConnectionCount(markerId)
    const message = connectionCount > 0
      ? `确定删除图钉 "${marker.info.title}"？\n这将同时删除 ${connectionCount} 条相关连接。`
      : `确定删除图钉 "${marker.info.title}"？`

    if (confirm(message)) {
      onDeleteMarker(markerId)
    }
  }

  // 处理删除连接
  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('确定删除这条连接？')) {
      onDeleteConnection(connectionId)
    }
  }

  return (
    <div className="management-panel">
      <div className="management-header">
        <h3>管理面板</h3>
        <button
          className="management-close"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tab切换 */}
      <div className="management-tabs">
        <button
          className={`tab-btn ${activeTab === 'markers' ? 'active' : ''}`}
          onClick={() => setActiveTab('markers')}
        >
          图钉 ({customMarkers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          连接 ({connections.length})
        </button>
      </div>

      <div className="management-content">
        {activeTab === 'markers' ? (
          /* 图钉列表 */
          <div className="markers-list">
            {customMarkers.length === 0 ? (
              <div className="empty-state">
                <p>暂无图钉</p>
                <small>双击地图创建图钉</small>
              </div>
            ) : (
              customMarkers.map((marker) => (
                <div key={marker.id} className="marker-item">
                  <div
                    className="marker-info"
                    onClick={() => onSelectMarker?.(marker)}
                    style={{ cursor: onSelectMarker ? 'pointer' : 'default' }}
                  >
                    <div className="marker-title">{marker.info.title || '未命名'}</div>
                    <div className="marker-meta">
                      <span>{marker.latitude.toFixed(4)}°, {marker.longitude.toFixed(4)}°</span>
                      {marker.info.videoInfo && <span className="video-badge">视频</span>}
                    </div>
                    {marker.info.description && (
                      <div className="marker-description">
                        {marker.info.description.length > 50
                          ? marker.info.description.substring(0, 50) + '...'
                          : marker.info.description}
                      </div>
                    )}
                    <div className="marker-stats">
                      {getMarkerConnectionCount(marker.id) > 0 && (
                        <span className="connection-count">
                          {getMarkerConnectionCount(marker.id)} 条连接
                        </span>
                      )}
                      {marker.info.links.length > 0 && (
                        <span>{marker.info.links.length} 链接</span>
                      )}
                      {marker.info.images.length > 0 && (
                        <span>{marker.info.images.length} 图片</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDeleteMarker(marker.id)}
                    title="删除图钉"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 连接列表 */
          <div className="connections-list">
            {connections.length === 0 ? (
              <div className="empty-state">
                <p>暂无连接</p>
                <small>创建多个图钉后自动连接，或使用手动连接模式</small>
              </div>
            ) : (
              connections.map((connection) => {
                const fromMarker = customMarkers.find(m => m.id === connection.fromMarkerId)
                const toMarker = customMarkers.find(m => m.id === connection.toMarkerId)

                if (!fromMarker || !toMarker) return null

                return (
                  <div key={connection.id} className="connection-item">
                    <div className="connection-info">
                      <div className="connection-route">
                        <span className="marker-name">{fromMarker.info.title}</span>
                        <span className="arrow">→</span>
                        <span className="marker-name">{toMarker.info.title}</span>
                      </div>
                      {connection.eventInfo ? (
                        <div className="connection-event">
                          <div className="event-name">{connection.eventInfo.eventName}</div>
                          <div className="event-meta">
                            <span>{connection.eventInfo.time}</span>
                            {connection.eventInfo.relationship && (
                              <span>{connection.eventInfo.relationship}</span>
                            )}
                          </div>
                        </div>
                      ) : connection.label ? (
                        <div className="connection-label">
                          {connection.label}
                        </div>
                      ) : null}
                    </div>
                    <button
                      className="delete-item-btn"
                      onClick={() => handleDeleteConnection(connection.id)}
                      title="删除连接"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagementPanel
