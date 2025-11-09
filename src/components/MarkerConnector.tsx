import { useMemo } from 'react'
import { Vector3, QuadraticBezierCurve3 } from 'three'
import { Line } from '@react-three/drei'
import { lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'
import { CustomMarker } from '../types/customMarker'

interface MarkerConnectorProps {
  fromMarker: CustomMarker
  toMarker: CustomMarker
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
 */
function MarkerConnector({
  fromMarker,
  toMarker,
  radius = 1.02,
  color = '#00ffff',
  lineWidth = 2,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2
}: MarkerConnectorProps) {
  const points = useMemo(() => {
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

      // 只返回起点和终点，直线连接
      return [startVec, endVec]
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
      return curve.getPoints(20)
    }
  }, [fromMarker, toMarker, radius, isFlat, mapWidth, mapHeight])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={0.6}
    />
  )
}

export default MarkerConnector
