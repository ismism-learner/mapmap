import { useState, useMemo, useRef } from 'react'
import { Mesh, Vector3 } from 'three'
import { Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
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
  fontSize?: number // 标签字体大小
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
  labelOffset: _labelOffset = { x: 0, y: 0 },
  onLabelDrag: _onLabelDrag,
  videoInfo,
  fontSize = 28
}: PushpinProps) {
  const [hovered, setHovered] = useState(false)
  const [labelOpacity, setLabelOpacity] = useState(1)
  const { camera } = useThree()
  const positionRef = useRef(new Vector3())

  // 根据模式计算位置
  const position = useMemo(() => {
    if (isFlat) {
      return lonLatToFlatPosition(longitude, latitude, mapWidth, mapHeight)
    } else {
      return lonLatToVector3(longitude, latitude, radius)
    }
  }, [isFlat, longitude, latitude, radius, mapWidth, mapHeight])

  const { x, y, z } = position

  // 更新位置引用
  useMemo(() => {
    positionRef.current.set(x, y, z)
  }, [x, y, z])

  // 基于相机距离动态调整标签透明度
  useFrame(() => {
    const distance = camera.position.distanceTo(positionRef.current)

    // 透明度渐变区间
    const farThreshold = 3.5   // 距离大于此值时完全可见
    const nearThreshold = 1.8  // 距离小于此值时完全透明

    let opacity = 1
    if (distance < nearThreshold) {
      opacity = 0
    } else if (distance < farThreshold) {
      // 线性插值：从近到远，透明度从0到1
      opacity = (distance - nearThreshold) / (farThreshold - nearThreshold)
    }

    // 只在变化较大时更新状态，避免频繁渲染
    if (Math.abs(opacity - labelOpacity) > 0.01) {
      setLabelOpacity(opacity)
    }
  })

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

  const svgSize = (pinConfig.outerRadius + pinConfig.strokeWidth) * 2

  return (
    <Html
      position={[x, y, z]}
      center
      occlude={globeRef ? [globeRef] : undefined}
      transform
      sprite
      distanceFactor={0.15}
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
          pointerEvents: 'auto',
          position: 'relative', // 添加相对定位，方便视频卡片绝对定位
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

        {/* 标签 - 基于相机距离动态调整透明度 */}
        {label && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: `${fontSize}px`,
              fontWeight: '500',
              whiteSpace: 'nowrap',
              marginTop: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              pointerEvents: 'none',
              userSelect: 'none',
              opacity: labelOpacity,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            {label}
          </div>
        )}

        {/* 视频封面 - 仅悬停时显示，位于右上方 */}
        {videoInfo && hovered && (
          <a
            href={videoInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)} // 保持悬停状态
            onMouseLeave={() => setHovered(false)} // 移开时取消悬停
            onMouseDown={(e) => {
              // 如果点击封面，打开链接而不是拖动
              e.stopPropagation()
            }}
            style={{
              position: 'absolute',
              left: '100%',
              top: '0',
              marginLeft: '16px',
              pointerEvents: 'auto',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'block',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                border: '2px solid rgba(0, 255, 255, 0.5)',
                width: '240px',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.5)'
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
                  padding: '10px',
                }}
              >
                <div
                  style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.4',
                  }}
                >
                  {videoInfo.title}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}
                >
                  UP主: {videoInfo.author}
                </div>
                <div
                  style={{
                    color: '#00ffff',
                    fontSize: '10px',
                    textAlign: 'center',
                    padding: '4px',
                    background: 'rgba(0, 255, 255, 0.1)',
                    borderRadius: '4px',
                  }}
                >
                  点击查看视频 →
                </div>
              </div>
            </div>
          </a>
        )}
      </div>
    </Html>
  )
}

export default Pushpin
