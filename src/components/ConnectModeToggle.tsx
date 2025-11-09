import './ConnectModeToggle.css'

interface ConnectModeToggleProps {
  isActive: boolean
  onToggle: () => void
  hasSelectedMarker: boolean
}

/**
 * 连接模式切换按钮
 */
function ConnectModeToggle({ isActive, onToggle, hasSelectedMarker }: ConnectModeToggleProps) {
  return (
    <div className="connect-mode-toggle">
      <button
        className={`connect-mode-btn ${isActive ? 'active' : ''}`}
        onClick={onToggle}
        title={isActive ? '退出连接模式' : '进入连接模式'}
      >
        {isActive ? '🔗 连接模式' : '🔗 连接'}
      </button>
      {isActive && (
        <div className="connect-mode-hint">
          {hasSelectedMarker
            ? '👆 点击第二个图钉创建连接'
            : '👆 点击第一个图钉开始'}
        </div>
      )}
    </div>
  )
}

export default ConnectModeToggle
