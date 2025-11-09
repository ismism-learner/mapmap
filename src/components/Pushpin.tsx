import { useState, useMemo } from 'react'
import { Mesh } from 'three'
import { Html } from '@react-three/drei'
import { lonLatToVector3 } from '../utils/geoUtils'

interface PushpinProps {
  latitude: number
  longitude: number
  label?: string
  onClick?: () => void
  radius?: number
  color?: string
  globeRef?: React.RefObject<Mesh>
}

/**
 * 2D SVG图钉组件
 * - 使用SVG模拟3D效果，性能更好
 * - 通过连接线角度变化模拟立体感
 * - 支持点击和悬停
 * - 显示标签
 */
function Pushpin({
  latitude,
  longitude,
  label,
  onClick,
  radius = 1.01,
  color = '#ff4444',
  globeRef
}: PushpinProps) {
  const [hovered, setHovered] = useState(false)

  const { x, y, z } = lonLatToVector3(longitude, latitude, radius)

  // 根据位置计算模拟3D的角度
  // 使用经纬度来计算一个角度，模拟光照方向
  const highlightAngle = useMemo(() => {
    // 使用经度和纬度的组合来计算角度
    // 这样每个图钉的"光照"角度都不同，增强立体感
    const baseAngle = (longitude + 180) * (Math.PI / 180)
    const latitudeFactor = latitude * (Math.PI / 180)
    return baseAngle + latitudeFactor * 0.3
  }, [longitude, latitude])

  // SVG图钉配置
  const pinConfig = {
    outerRadius: 10,      // 外圈半径
    innerRadius: 6,       // 内圈半径
    strokeWidth: 2,       // 外圈描边宽度
    highlightWidth: 1.5,  // 高光线宽度
  }

  // 计算高光线的终点坐标
  const highlightEnd = useMemo(() => {
    const cx = pinConfig.outerRadius + pinConfig.strokeWidth
    const cy = pinConfig.outerRadius + pinConfig.strokeWidth
    const px = cx + pinConfig.outerRadius * Math.cos(highlightAngle)
    const py = cy + pinConfig.outerRadius * Math.sin(highlightAngle)
    return { px, py }
  }, [highlightAngle, pinConfig.outerRadius, pinConfig.strokeWidth])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  const svgSize = (pinConfig.outerRadius + pinConfig.strokeWidth) * 2

  return (
    <Html
      position={[x, y, z]}
      center
      occlude={globeRef ? [globeRef] : undefined}
      style={{
        transition: 'opacity 0.2s',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: hovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s',
        }}
      >
        {/* SVG图钉 */}
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{
            filter: hovered ? 'drop-shadow(0 0 4px rgba(255, 68, 68, 0.8))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            transition: 'filter 0.2s',
          }}
        >
          {/* 外圈（图钉头部边缘） */}
          <circle
            cx={pinConfig.outerRadius + pinConfig.strokeWidth}
            cy={pinConfig.outerRadius + pinConfig.strokeWidth}
            r={pinConfig.outerRadius}
            fill="none"
            stroke="#333"
            strokeWidth={pinConfig.strokeWidth}
          />

          {/* 内圈（图钉头部中心） */}
          <circle
            cx={pinConfig.outerRadius + pinConfig.strokeWidth}
            cy={pinConfig.outerRadius + pinConfig.strokeWidth}
            r={pinConfig.innerRadius}
            fill={hovered ? '#ff6b6b' : color}
          />

          {/* 连接线（模拟高光/3D效果） */}
          <line
            x1={pinConfig.outerRadius + pinConfig.strokeWidth}
            y1={pinConfig.outerRadius + pinConfig.strokeWidth}
            x2={highlightEnd.px}
            y2={highlightEnd.py}
            stroke={hovered ? '#ffffff' : 'rgba(255, 255, 255, 0.8)'}
            strokeWidth={pinConfig.highlightWidth}
            strokeLinecap="round"
          />

          {/* 中心点（增强立体感） */}
          <circle
            cx={pinConfig.outerRadius + pinConfig.strokeWidth}
            cy={pinConfig.outerRadius + pinConfig.strokeWidth}
            r={2}
            fill="rgba(0, 0, 0, 0.2)"
          />
        </svg>

        {/* 标签 */}
        {(hovered || label) && label && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              marginTop: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </Html>
  )
}

export default Pushpin
