import { useEffect, useState } from 'react'

/**
 * 点击事件调试工具
 * 用于诊断点击事件被哪个元素拦截
 */
function ClickDebugger() {
  const [logs, setLogs] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const elementInfo = `
元素: ${target.tagName}
类名: ${target.className || '(无)'}
ID: ${target.id || '(无)'}
层级: ${target.style.zIndex || '(默认)'}
pointer-events: ${window.getComputedStyle(target).pointerEvents}
位置: x=${e.clientX}, y=${e.clientY}
      `.trim()

      setLogs(prev => [elementInfo, ...prev.slice(0, 4)])
    }

    // 在捕获阶段监听，可以看到最先接收到的元素
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!visible) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '100px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          zIndex: 20000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        onClick={() => setVisible(true)}
      >
        🔍 Shift+D: 点击调试
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        minWidth: '350px',
        maxWidth: '500px',
        maxHeight: '600px',
        overflow: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        zIndex: 20000,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <strong>🔍 点击事件调试器</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '12px', color: '#fbbf24' }}>
        💡 点击任何地方查看事件信息
      </div>

      <div>
        {logs.length === 0 ? (
          <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            等待点击事件...
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '8px',
                whiteSpace: 'pre-wrap',
                fontSize: '10px',
                border: i === 0 ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {i === 0 && <div style={{ color: '#4ade80', marginBottom: '4px' }}>最新 ↓</div>}
              {log}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        Shift+D: 隐藏
      </div>
    </div>
  )
}

export default ClickDebugger
