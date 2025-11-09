import { useState, useMemo, useEffect } from 'react'
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
  labelOffset?: { x: number; y: number } // 标签偏移位置
  onLabelDrag?: (offset: { x: number; y: number }) => void // 标签拖动回调
  videoInfo?: {
    bvid: string
    title: string
    cover: string
    author: string
    url: string
  } // B站视频信息
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
  mapHeight = 2,
  labelOffset = { x: 0, y: 0 },
  onLabelDrag,
  videoInfo
}: PushpinProps) {
  const [hovered, setHovered] = useState(false)
  const [isDraggingLabel, setIsDraggingLabel] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

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
    setHovered(false) // 点击后立即隐藏标签，避免遮挡编辑面板
    if (onClick) {
      onClick()
    }
  }

  // 标签拖动开始
  const handleLabelMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingLabel(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // 标签拖动中
  const handleLabelMouseMove = (e: MouseEvent) => {
    if (!isDraggingLabel || !onLabelDrag) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    onLabelDrag({
      x: labelOffset.x + deltaX,
      y: labelOffset.y + deltaY
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // 标签拖动结束
  const handleLabelMouseUp = () => {
    setIsDraggingLabel(false)
  }

  // 监听全局鼠标事件（拖动标签时）
  useEffect(() => {
    if (isDraggingLabel) {
      window.addEventListener('mousemove', handleLabelMouseMove)
      window.addEventListener('mouseup', handleLabelMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleLabelMouseMove)
        window.removeEventListener('mouseup', handleLabelMouseUp)
      }
    }
  }, [isDraggingLabel, dragStart, labelOffset])

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

        {/* 视频封面 - 优先显示，可点击跳转 */}
        {videoInfo && (
          <a
            href={videoInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseDown={(e) => {
              // 如果点击封面，打开链接而不是拖动
              e.stopPropagation()
            }}
            style={{
              marginTop: '8px',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transform: `translate(${labelOffset.x}px, ${labelOffset.y}px)`,
              textDecoration: 'none',
              display: 'block',
              transition: isDraggingLabel ? 'none' : 'transform 0.2s',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.2)',
                maxWidth: '200px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {/* 封面图 */}
              <img
                src={videoInfo.cover}
                alt={videoInfo.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              {/* 视频信息 */}
              <div
                style={{
                  padding: '8px',
                  color: 'white',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '4px',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {videoInfo.title}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  UP主: {videoInfo.author}
                </div>
              </div>
            </div>
          </a>
        )}

        {/* 标签 - 当没有视频时显示，可拖动 */}
        {!videoInfo && label && (
          <div
            onMouseDown={handleLabelMouseDown}
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
              pointerEvents: 'auto',
              cursor: isDraggingLabel ? 'grabbing' : 'grab',
              transform: `translate(${labelOffset.x}px, ${labelOffset.y}px)`,
              userSelect: 'none',
              opacity: hovered || isDraggingLabel ? 1 : 0.8,
              transition: isDraggingLabel ? 'none' : 'opacity 0.2s',
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
