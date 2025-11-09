import { useMemo } from 'react'
import { Vector3, QuadraticBezierCurve3 } from 'three'
import { Line } from '@react-three/drei'
import { lonLatToVector3 } from '../utils/geoUtils'
import { CustomMarker } from '../types/customMarker'

interface MarkerConnectorProps {
  fromMarker: CustomMarker
  toMarker: CustomMarker
  radius?: number
  color?: string
  lineWidth?: number
}

/**
 * 图钉之间的曲线连接
 * - 使用贝塞尔曲线连接两个图钉
 * - 曲线在地球表面上方形成优雅的弧线
 */
function MarkerConnector({
  fromMarker,
  toMarker,
  radius = 1.02,
  color = '#00ffff',
  lineWidth = 2
}: MarkerConnectorProps) {
  const points = useMemo(() => {
    // 起点和终点
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

    // 获取曲线上的点（更多点使曲线更平滑）
    return curve.getPoints(50)
  }, [fromMarker, toMarker, radius])

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
