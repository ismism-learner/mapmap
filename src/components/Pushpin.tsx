import { useState, useMemo } from 'react'
import { Mesh } from 'three'
import { Html } from '@react-three/drei'
import { lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'

interface PushpinProps {
  latitude: number
  longitude: number
  label?: string
  onClick?: () => void
  radius?: number
  color?: string
  globeRef?: React.RefObject<Mesh>
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
}

/**
 * 简化的2D SVG图钉组件
 * - 轻量级SVG实现，性能优秀
 * - 简单的外圈+内圈设计
 * - 支持点击和悬停
 * - 显示标签
 * - 支持球形和平面两种模式
 */
function Pushpin({
  latitude,
  longitude,
  label,
  onClick,
  radius = 1.01,
  color = '#ff4444',
  globeRef,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2
}: PushpinProps) {
  const [hovered, setHovered] = useState(false)

  // 根据模式计算位置
  const position = useMemo(() => {
    if (isFlat) {
      return lonLatToFlatPosition(longitude, latitude, mapWidth, mapHeight)
    } else {
      return lonLatToVector3(longitude, latitude, radius)
    }
  }, [isFlat, longitude, latitude, radius, mapWidth, mapHeight])

  const { x, y, z } = position

  // 简化的SVG图钉配置
  const pinConfig = {
    outerRadius: 10,      // 外圈半径
    innerRadius: 6,       // 内圈半径
    strokeWidth: 2,       // 外圈描边宽度
  }

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
        pointerEvents: 'none',
        zIndex: 100,
      }}
      zIndexRange={[100, 0]}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: hovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s',
          pointerEvents: 'none',
        }}
      >
        {/* SVG图钉 */}
        <svg
          onClick={handleClick}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{
            filter: hovered ? 'drop-shadow(0 0 4px rgba(255, 68, 68, 0.8))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            transition: 'filter 0.2s',
            cursor: 'pointer',
            pointerEvents: 'auto',
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
