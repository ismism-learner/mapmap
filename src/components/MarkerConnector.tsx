import { useMemo, useState, useRef } from 'react'
import { Vector3, QuadraticBezierCurve3, Mesh } from 'three'
import { Line, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
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
  label?: string // 连接线标签
  onLabelChange?: (newLabel: string) => void // 标签修改回调
  globeRef?: React.RefObject<Mesh> // 地球引用，用于遮挡检测
}

/**
 * 图钉之间的连接线
 * - 球形模式：使用简化的贝塞尔曲线（性能优化）
 * - 平面模式：使用直线连接（2D）
 * - 支持双击编辑标签
 * - 支持悬停显示事件信息
 */
function MarkerConnector({
  fromMarker,
  toMarker,
  connection,
  radius = 1.02,
  color = '#00ffff',
  lineWidth = 4, // 增加线宽，方便点击
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2,
  label = '',
  onLabelChange,
  globeRef
}: MarkerConnectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(label)
  const [hovered, setHovered] = useState(false)
  const arrowRef = useRef<Mesh>(null)
  const progressRef = useRef(0)

  // 计算连线的点和标签位置
  const { points, labelPosition } = useMemo(() => {
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
        labelPosition: mid
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

      // 计算两点之间的角度
      const angle = startVec.angleTo(endVec)

      // 计算贝塞尔曲线的控制点
      const controlPoint = new Vector3()

      if (angle > Math.PI * 0.95) {
        // 对于接近对跖点的情况（>171度），使用垂直于两点的向量
        const cross = new Vector3().crossVectors(startVec, endVec)
        if (cross.length() < 0.001) {
          // 完全对跖，随机选择一个垂直方向
          const arbitrary = Math.abs(startVec.y) < 0.9
            ? new Vector3(0, 1, 0)
            : new Vector3(1, 0, 0)
          cross.crossVectors(startVec, arbitrary)
        }
        cross.normalize()
        controlPoint.copy(cross).multiplyScalar(radius)
      } else {
        // 正常情况：使用球面插值（slerp）
        controlPoint.copy(startVec).lerp(endVec, 0.5).normalize()

        // 计算弧线高度（基于角度）
        const arcHeight = Math.min(Math.sin(angle / 2) * 0.3, 0.3)
        controlPoint.multiplyScalar(radius + arcHeight)
      }

      // 创建贝塞尔曲线
      const curve = new QuadraticBezierCurve3(startVec, controlPoint, endVec)

      // 减少点数：从50降到20，大幅提升性能
      const curvePoints = curve.getPoints(20)

      // 标签位置：使用曲线在 t=0.5 处的实际点（曲线的真实中点）
      const actualMidpoint = curve.getPoint(0.5)

      return {
        points: curvePoints,
        labelPosition: actualMidpoint
      }
    }
  }, [fromMarker, toMarker, radius, isFlat, mapWidth, mapHeight])

  // 处理双击线条进行编辑
  const handleLineDoubleClick = () => {
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

  // 动画箭头沿着曲线移动
  useFrame((_state, delta) => {
    if (arrowRef.current && points.length > 1) {
      // 更新进度（0到1循环）
      progressRef.current += delta * 0.5 // 调整速度
      if (progressRef.current > 1) {
        progressRef.current = 0
      }

      // 计算箭头在曲线上的位置
      const index = Math.floor(progressRef.current * (points.length - 1))
      const nextIndex = Math.min(index + 1, points.length - 1)
      const localProgress = (progressRef.current * (points.length - 1)) - index

      const currentPoint = points[index]
      const nextPoint = points[nextIndex]

      // 线性插值获取当前位置
      const position = new Vector3().lerpVectors(currentPoint, nextPoint, localProgress)
      arrowRef.current.position.copy(position)

      // 计算箭头方向（朝向下一个点）
      const direction = new Vector3().subVectors(nextPoint, currentPoint).normalize()
      arrowRef.current.lookAt(position.clone().add(direction))
    }
  })

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
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!connection.eventInfo) {
            handleLineDoubleClick()
          }
        }}
      />

      {/* 动画箭头 - 雪佛龙形状 */}
      <mesh ref={arrowRef}>
        <coneGeometry args={[0.015, 0.04, 4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 标签编辑（只在编辑时显示） */}
      {!connection.eventInfo && isEditing && (
        <Html
          position={[labelPosition.x, labelPosition.y, labelPosition.z]}
          center
          occlude={globeRef ? [globeRef] : undefined}
          distanceFactor={isFlat ? 1 : 0.5}
          style={{
            pointerEvents: 'auto',
            zIndex: 100,
          }}
          zIndexRange={[100, 0]}
        >
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
              placeholder="输入标签..."
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
        </Html>
      )}

      {/* 永久显示标签（事件信息或简单标签） */}
      {!isEditing && (label || connection.eventInfo) && (
        <Html
          position={[labelPosition.x, labelPosition.y, labelPosition.z]}
          center
          occlude={globeRef ? [globeRef] : undefined}
          distanceFactor={isFlat ? 1 : 0.5}
          style={{
            pointerEvents: hovered && connection.eventInfo ? 'auto' : 'none',
            zIndex: hovered && connection.eventInfo ? 10000 : 10,
          }}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              background: hovered && connection.eventInfo ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: hovered && connection.eventInfo ? '10px 14px' : '2px 6px',
              borderRadius: hovered && connection.eventInfo ? '8px' : '3px',
              fontSize: '8px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              border: hovered && connection.eventInfo ? '2px solid #00ffff' : '1px solid rgba(0, 255, 255, 0.3)',
              boxShadow: hovered && connection.eventInfo ? '0 4px 16px rgba(0, 255, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
              maxWidth: hovered && connection.eventInfo ? '280px' : 'none',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
          >
            {hovered && connection.eventInfo ? (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#00ffff', fontSize: '13px' }}>
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
              </>
            ) : (
              connection.eventInfo?.eventName || label
            )}
          </div>
        </Html>
      )}

    </group>
  )
}

export default MarkerConnector
