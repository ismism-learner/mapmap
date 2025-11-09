import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { loadShapefile, lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'

interface InteractiveBoundaryProps {
  shpPath: string
  color?: string
  lineWidth?: number
  visible?: boolean
  radius?: number
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
}

interface BoundaryFeature {
  id: number
  name?: string
  lines: THREE.Vector3[][]
  mesh: THREE.Mesh | null
  hoverIntensity: number
  targetIntensity: number
}

/**
 * 交互式边界层组件
 * - 支持鼠标悬停高亮
 * - 内部发光效果（Inner Glow）
 * - 柔和的过渡动画
 */
function InteractiveBoundary({
  shpPath,
  color = '#FFD700',
  lineWidth = 1.5,
  visible = true,
  radius = 1.005,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2
}: InteractiveBoundaryProps) {
  const [features, setFeatures] = useState<BoundaryFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      return
    }

    const loadBoundaries = async () => {
      try {
        console.log('🔄 Loading interactive boundaries:', shpPath)
        const geojson = await loadShapefile(shpPath)
        const featuresList: BoundaryFeature[] = []

        const geoFeatures = Array.isArray(geojson) ? geojson : geojson.features || []
        console.log(`📊 Processing ${geoFeatures.length} features`)

        geoFeatures.forEach((feature: any, idx: number) => {
          const geometry = feature.geometry
          if (!geometry) return

          const lines: THREE.Vector3[][] = []

          // 处理多边形
          if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            const coordinates =
              geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

            coordinates.forEach((polygon: number[][][]) => {
              polygon.forEach((ring: number[][]) => {
                const points: THREE.Vector3[] = []

                ring.forEach(([lon, lat]) => {
                  if (lon !== undefined && lat !== undefined) {
                    if (isFlat) {
                      const { x, y, z } = lonLatToFlatPosition(lon, lat, mapWidth, mapHeight)
                      points.push(new THREE.Vector3(x, y, z))
                    } else {
                      const { x, y, z } = lonLatToVector3(lon, lat, radius)
                      points.push(new THREE.Vector3(x, y, z))
                    }
                  }
                })

                if (points.length > 1) {
                  lines.push(points)
                }
              })
            })
          }

          if (lines.length > 0) {
            featuresList.push({
              id: idx,
              name: feature.properties?.name || feature.properties?.NAME || `区域 ${idx}`,
              lines,
              mesh: null,
              hoverIntensity: 0,
              targetIntensity: 0
            })
          }
        })

        console.log(`✅ Created ${featuresList.length} interactive features`)
        setFeatures(featuresList)
        setLoading(false)
      } catch (error) {
        console.error('❌ Failed to load boundaries:', error)
        setLoading(false)
      }
    }

    loadBoundaries()
  }, [shpPath, visible, radius, isFlat, mapWidth, mapHeight])

  // 动画循环：平滑过渡发光强度
  useFrame(() => {
    setFeatures(prev => prev.map(feature => {
      const diff = feature.targetIntensity - feature.hoverIntensity
      if (Math.abs(diff) > 0.001) {
        return {
          ...feature,
          hoverIntensity: feature.hoverIntensity + diff * 0.1 // 平滑插值
        }
      }
      return feature
    }))
  })

  const handleClick = (id: number, name?: string) => {
    // 如果点击的是已选中的区域，则取消选中
    if (hoveredId === id) {
      setHoveredId(null)
      setFeatures(prev => prev.map(f =>
        f.id === id ? { ...f, targetIntensity: 0 } : f
      ))
      console.log(`🖱️ 取消选择: ${name}`)
    } else {
      // 否则选中新区域，并取消之前的选择
      setHoveredId(id)
      setFeatures(prev => prev.map(f =>
        f.id === id ? { ...f, targetIntensity: 0.6 } : { ...f, targetIntensity: 0 }
      ))
      console.log(`🖱️ 点击选中: ${name}`)
    }
  }

  // 处理点击空白区域（取消选中）
  const handleBackgroundClick = () => {
    if (hoveredId !== null) {
      setHoveredId(null)
      setFeatures(prev => prev.map(f => ({ ...f, targetIntensity: 0 })))
      console.log('🖱️ 点击空白区域，取消选择')
    }
  }

  if (!visible || loading || features.length === 0) {
    return null
  }

  return (
    <group ref={groupRef} name="interactive-boundary-layer">
      {/* 背景层：捕获空白区域点击 */}
      <mesh
        onClick={handleBackgroundClick}
        position={[0, 0, isFlat ? -0.01 : 0]}
        visible={false}
      >
        {isFlat ? (
          <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
        ) : (
          <sphereGeometry args={[radius * 0.99, 64, 64]} />
        )}
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {features.map((feature) => {
        const isHovered = hoveredId === feature.id

        return (
          <group key={`feature-${feature.id}`}>
            {/* 主边界线 */}
            {feature.lines.map((points, lineIdx) => (
              <Line
                key={`line-${feature.id}-${lineIdx}`}
                points={points}
                color={isHovered ? '#FFFFFF' : color}
                lineWidth={isHovered ? lineWidth * 1.8 : lineWidth}
                transparent
                opacity={isHovered ? 1 : 0.7}
              />
            ))}

            {/* 平面模式：填充区域用于鼠标检测（完全透明） */}
            {isFlat && feature.lines.length > 0 && feature.lines[0].length > 2 && (
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick(feature.id, feature.name)
                }}
                position={[0, 0, 0.001]}
              >
                <shapeGeometry
                  args={[
                    new THREE.Shape(
                      feature.lines[0].map(p => new THREE.Vector2(p.x, p.y))
                    )
                  ]}
                />
                <meshBasicMaterial
                  transparent
                  opacity={0}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* 球形模式：使用管道几何体创建可点击的边界（完全透明） */}
            {!isFlat && feature.lines.length > 0 && feature.lines.map((points, lineIdx) => {
              if (points.length < 2) return null

              return (
                <mesh
                  key={`tube-${feature.id}-${lineIdx}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick(feature.id, feature.name)
                  }}
                >
                  <tubeGeometry
                    args={[
                      new THREE.CatmullRomCurve3(points),
                      points.length * 2,
                      0.008, // 管道半径
                      8,
                      false
                    ]}
                  />
                  <meshBasicMaterial
                    transparent
                    opacity={0}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

export default InteractiveBoundary
