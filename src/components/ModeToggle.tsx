import './ModeToggle.css'

interface ModeToggleProps {
  autoConnect: boolean
  onToggleAutoConnect: () => void
  manualConnectMode: boolean
  onToggleManualConnect: () => void
  hasSelectedMarker: boolean
}

/**
 * 模式切换按钮组
 * - 自动连接模式：双击时自动连接到上一个图钉
 * - 手动连接模式：选择两个图钉手动创建连接
 */
function ModeToggle({
  autoConnect,
  onToggleAutoConnect,
  manualConnectMode,
  onToggleManualConnect,
  hasSelectedMarker
}: ModeToggleProps) {
  return (
    <div className="mode-toggle">
      {/* 自动连接模式切换 */}
      <button
        className={`mode-btn ${autoConnect ? 'active' : ''}`}
        onClick={onToggleAutoConnect}
        title={autoConnect ? '关闭自动连接' : '开启自动连接'}
      >
        {autoConnect ? '🔗 自动连接: 开' : '🔗 自动连接: 关'}
      </button>

      {/* 手动连接模式切换 */}
      <button
        className={`mode-btn manual ${manualConnectMode ? 'active' : ''}`}
        onClick={onToggleManualConnect}
        title={manualConnectMode ? '退出手动连接' : '手动连接图钉'}
      >
        {manualConnectMode ? '✏️ 手动连接中' : '✏️ 手动连接'}
      </button>

      {/* 手动连接模式提示 */}
      {manualConnectMode && (
        <div className="mode-hint">
          {hasSelectedMarker
            ? '👆 点击第二个图钉创建连接'
            : '👆 点击第一个图钉开始'}
        </div>
      )}
    </div>
  )
}

export default ModeToggle
