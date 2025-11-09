import { useMemo, useState } from 'react'
import { Vector3, QuadraticBezierCurve3 } from 'three'
import { Line, Html } from '@react-three/drei'
import { lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'
import { CustomMarker, MarkerConnection } from '../types/customMarker'

interface MarkerConnectorProps {
  fromMarker: CustomMarker
  toMarker: CustomMarker
  connection: MarkerConnection
  radius?: number
  color?: string
  lineWidth?: number
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
}

/**
 * 图钉之间的连接线
 * - 球形模式：使用简化的贝塞尔曲线（性能优化）
 * - 平面模式：使用直线连接（2D）
 * - 支持悬停显示事件信息
 */
function MarkerConnector({
  fromMarker,
  toMarker,
  connection,
  radius = 1.02,
  color = '#00ffff',
  lineWidth = 2,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2
}: MarkerConnectorProps) {
  const [hovered, setHovered] = useState(false)

  // 计算连线的点和中点
  const { points, midpoint } = useMemo(() => {
    if (isFlat) {
      // 平面模式：简单的直线连接
      const start = lonLatToFlatPosition(
        fromMarker.longitude,
        fromMarker.latitude,
        mapWidth,
        mapHeight
      )
      const end = lonLatToFlatPosition(
        toMarker.longitude,
        toMarker.latitude,
        mapWidth,
        mapHeight
      )

      const startVec = new Vector3(start.x, start.y, start.z)
      const endVec = new Vector3(end.x, end.y, end.z)

      // 计算中点用于显示信息
      const mid = new Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)

      return {
        points: [startVec, endVec],
        midpoint: mid
      }
    } else {
      // 球形模式：简化的贝塞尔曲线
      const start = lonLatToVector3(
        fromMarker.longitude,
        fromMarker.latitude,
        radius
      )
      const end = lonLatToVector3(
        toMarker.longitude,
        toMarker.latitude,
        radius
      )

      const startVec = new Vector3(start.x, start.y, start.z)
      const endVec = new Vector3(end.x, end.y, end.z)

      // 计算中点，并向外扩展以形成弧线
      const mid = new Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)

      // 计算弧线高度（基于距离）
      const distance = startVec.distanceTo(endVec)
      const arcHeight = Math.min(distance * 0.3, 0.3) // 限制最大高度

      // 将中点向外推以形成弧形
      mid.normalize().multiplyScalar(radius + arcHeight)

      // 创建贝塞尔曲线
      const curve = new QuadraticBezierCurve3(startVec, mid, endVec)

      // 减少点数：从50降到20，大幅提升性能
      const curvePoints = curve.getPoints(20)

      return {
        points: curvePoints,
        midpoint: mid
      }
    }
  }, [fromMarker, toMarker, radius, isFlat, mapWidth, mapHeight])

  return (
    <group>
      <Line
        points={points}
        color={hovered ? '#ffff00' : color}
        lineWidth={hovered ? lineWidth + 1 : lineWidth}
        transparent
        opacity={hovered ? 0.9 : 0.6}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      />

      {/* 悬停时显示事件信息 */}
      {hovered && connection.eventInfo && (
        <Html
          position={[midpoint.x, midpoint.y, midpoint.z]}
          center
          distanceFactor={isFlat ? 1 : 0.5}
          style={{
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.92)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              border: '2px solid #00ffff',
              boxShadow: '0 4px 16px rgba(0, 255, 255, 0.3)',
              maxWidth: '280px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#00ffff' }}>
              {connection.eventInfo.eventName}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>
              📅 {connection.eventInfo.time}
            </div>
            {connection.eventInfo.relationship && (
              <div style={{ fontSize: '12px', color: '#ddd' }}>
                🔗 {connection.eventInfo.relationship}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

export default MarkerConnector
