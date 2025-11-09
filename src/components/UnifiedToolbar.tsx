import { useState } from 'react'
import './UnifiedToolbar.css'

interface UnifiedToolbarProps {
  isAdminMode: boolean
  onToggleEventInput: () => void
  onToggleManualConnect: () => void
  onToggleAutoConnect: () => void
  onToggleLayerControl: () => void
  onToggleManagement: () => void
  onToggleImageUpload: () => void
  onToggleAdminPanel: () => void
  onToggleFontSize: () => void
  autoConnectEnabled: boolean
  manualConnectEnabled: boolean
  eventInputOpen: boolean
  layerControlOpen: boolean
  managementOpen: boolean
  imageUploadOpen: boolean
  adminPanelOpen: boolean
  fontSizeOpen: boolean
}

/**
 * 统一工具栏 - 磨砂玻璃风格
 * 集成所有管理功能到一个工具栏
 */
function UnifiedToolbar({
  isAdminMode,
  onToggleEventInput,
  onToggleManualConnect,
  onToggleAutoConnect,
  onToggleLayerControl,
  onToggleManagement,
  onToggleImageUpload,
  onToggleAdminPanel,
  onToggleFontSize,
  autoConnectEnabled,
  manualConnectEnabled,
  eventInputOpen,
  layerControlOpen,
  managementOpen,
  imageUploadOpen,
  adminPanelOpen,
  fontSizeOpen
}: UnifiedToolbarProps) {
  const [expanded, setExpanded] = useState(true)

  if (!isAdminMode) return null

  return (
    <div className={`unified-toolbar ${expanded ? 'expanded' : ''}`}>
      {/* 主按钮 - 展开/收起 */}
      <button
        className="toolbar-toggle"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? '收起工具栏' : '展开工具栏'}
      >
        {/* 菜单图标 SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* 工具按钮组 */}
      {expanded && (
        <div className="toolbar-buttons">
          {/* 批量创建事件 */}
          <button
            className={`toolbar-btn ${eventInputOpen ? 'active' : ''}`}
            onClick={onToggleEventInput}
            title="批量创建事件"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>

          {/* 手动连接模式 */}
          <button
            className={`toolbar-btn ${manualConnectEnabled ? 'active' : ''}`}
            onClick={onToggleManualConnect}
            title="手动连接模式"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="3" />
              <circle cx="12" cy="19" r="3" />
              <line x1="12" y1="8" x2="12" y2="16" />
            </svg>
          </button>

          {/* 自动连接模式 */}
          <button
            className={`toolbar-btn ${autoConnectEnabled ? 'active' : ''}`}
            onClick={onToggleAutoConnect}
            title="自动连接模式"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>

          {/* 图层控制 */}
          <button
            className={`toolbar-btn ${layerControlOpen ? 'active' : ''}`}
            onClick={onToggleLayerControl}
            title="图层控制"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          {/* 管理图钉与链接 */}
          <button
            className={`toolbar-btn ${managementOpen ? 'active' : ''}`}
            onClick={onToggleManagement}
            title="管理图钉与链接"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* 图片上传 */}
          <button
            className={`toolbar-btn ${imageUploadOpen ? 'active' : ''}`}
            onClick={onToggleImageUpload}
            title="图片上传"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* 设置/管理员面板 */}
          <button
            className={`toolbar-btn ${adminPanelOpen ? 'active' : ''}`}
            onClick={onToggleAdminPanel}
            title="设置"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
              <path d="m19.07 4.93-4.24 4.24m0 5.66 4.24 4.24M4.93 4.93l4.24 4.24m0 5.66-4.24 4.24" />
            </svg>
          </button>

          {/* 字体大小调节 */}
          <button
            className={`toolbar-btn ${fontSizeOpen ? 'active' : ''}`}
            onClick={onToggleFontSize}
            title="字体大小"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default UnifiedToolbar
