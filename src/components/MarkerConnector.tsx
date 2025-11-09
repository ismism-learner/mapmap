import { useMemo, useState } from 'react'
import { Vector3, QuadraticBezierCurve3 } from 'three'
import { Line, Html } from '@react-three/drei'
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
  label?: string // 连接线标签
  onLabelChange?: (newLabel: string) => void // 标签修改回调
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
  mapHeight = 2,
  label = '',
  onLabelChange
}: MarkerConnectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(label)
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

  // 计算标签位置（曲线中点）
  const labelPosition = useMemo(() => {
    if (isFlat) {
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

      // 平面模式：直线中点
      return {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        z: (start.z + end.z) / 2
      }
    } else {
      // 球形模式：曲线中点（和贝塞尔曲线的控制点一样）
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
      const mid = new Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)

      const distance = startVec.distanceTo(endVec)
      const arcHeight = Math.min(distance * 0.3, 0.3)

      mid.normalize().multiplyScalar(radius + arcHeight)

      return { x: mid.x, y: mid.y, z: mid.z }
    }
  }, [fromMarker, toMarker, radius, isFlat, mapWidth, mapHeight])

  // 处理双击编辑
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditValue(label)
  }

  // 保存编辑
  const handleSave = () => {
    if (onLabelChange) {
      onLabelChange(editValue)
    }
    setIsEditing(false)
  }

  // 取消编辑
  const handleCancel = () => {
    setEditValue(label)
    setIsEditing(false)
  }

  // 处理按键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={0.6}
      />

      {/* 标签显示 */}
      <Html
        position={[labelPosition.x, labelPosition.y, labelPosition.z]}
        center
        style={{
          pointerEvents: 'auto',
          zIndex: 100,
        }}
        zIndexRange={[100, 0]}
      >
        {isEditing ? (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                border: '1px solid #00ffff',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '500',
                outline: 'none',
                minWidth: '100px',
              }}
            />
            <button
              onClick={handleSave}
              style={{
                background: '#00ffff',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              background: label ? 'rgba(0, 255, 255, 0.9)' : 'rgba(0, 255, 255, 0.3)',
              color: 'black',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: '1px solid rgba(0, 255, 255, 0.5)',
              userSelect: 'none',
              minWidth: label ? 'auto' : '60px',
              textAlign: 'center',
            }}
            title="双击编辑"
          >
            {label || '双击添加'}
          </div>
        )}
      </Html>
    </>
  )
}

export default MarkerConnector
