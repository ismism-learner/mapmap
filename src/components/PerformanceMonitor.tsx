import { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * 性能监控组件
 *
 * 显示：
 * - FPS（帧率）
 * - 渲染时间
 * - 内存使用（如果可用）
 * - Draw calls
 * - 三角形数量
 */
function PerformanceMonitor() {
  const { gl } = useThree()
  const [stats, setStats] = useState({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    memory: 0
  })

  const [visible, setVisible] = useState(false)

  // 计算FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const interval = setInterval(() => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      const fps = Math.round((frameCount * 1000) / deltaTime)

      setStats(prev => ({
        ...prev,
        fps,
        frameTime: deltaTime / frameCount
      }))

      frameCount = 0
      lastTime = currentTime
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 每帧更新统计
  useFrame(() => {
    const info = gl.info

    setStats(prev => ({
      ...prev,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      memory: (info.memory as any)?.geometries || 0
    }))
  })

  // 监听快捷键 Shift+P 切换显示
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
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
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          zIndex: 1000,
        }}
        onClick={() => setVisible(true)}
      >
        Shift+P: 显示性能监控
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        minWidth: '220px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <strong>性能监控</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            lineHeight: '1',
          }}
        >
          ×
        </button>
      </div>

      <StatRow
        label="FPS"
        value={stats.fps}
        suffix=""
        color={stats.fps >= 60 ? '#4ade80' : stats.fps >= 30 ? '#fbbf24' : '#ef4444'}
      />
      <StatRow
        label="帧时间"
        value={stats.frameTime.toFixed(2)}
        suffix="ms"
        color={stats.frameTime <= 16.67 ? '#4ade80' : stats.frameTime <= 33.33 ? '#fbbf24' : '#ef4444'}
      />
      <StatRow label="Draw Calls" value={stats.drawCalls} suffix="" />
      <StatRow label="三角形" value={stats.triangles.toLocaleString()} suffix="" />
      {stats.points > 0 && <StatRow label="点" value={stats.points.toLocaleString()} suffix="" />}
      {stats.lines > 0 && <StatRow label="线" value={stats.lines.toLocaleString()} suffix="" />}
      {stats.memory > 0 && <StatRow label="几何体" value={stats.memory} suffix="" />}

      <div
        style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
        }}
      >
        Shift+P: 隐藏
      </div>
    </div>
  )
}

/**
 * 统计行组件
 */
function StatRow({
  label,
  value,
  suffix,
  color = '#94a3b8'
}: {
  label: string
  value: string | number
  suffix: string
  color?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
      }}
    >
      <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold' }}>
        {value} {suffix}
      </span>
    </div>
  )
}

export default PerformanceMonitor
