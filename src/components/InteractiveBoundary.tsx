import { useEffect, useState, useRef, useMemo, memo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { loadShapefile, lonLatToVector3, lonLatToFlatPosition, vector3ToLonLat } from '../utils/geoUtils'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import earcut from 'earcut'

interface InteractiveBoundaryProps {
  shpPath: string
  color?: string
  lineWidth?: number
  visible?: boolean
  radius?: number
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
  paintMode?: boolean
  selectedColor?: string
  countryColors?: Map<number, string>
  onCountryPaint?: (countryId: number, color: string) => void
}

interface BoundaryFeature {
  id: number
  name?: string
  lines: THREE.Vector3[][]
  center: { latitude: number; longitude: number }
}

/**
 * 交互式边界层组件
 * - 支持鼠标悬停高亮
 * - 内部发光效果（Inner Glow）
 * - 柔和的过渡动画
 * - 点击国家创建图钉并连接
 */
function InteractiveBoundary({
  shpPath,
  color = '#FFD700',
  lineWidth = 1.5,
  visible = true,
  radius = 1.005,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2,
  paintMode = false,
  selectedColor = '#FF6B6B',
  countryColors = new Map(),
  onCountryPaint
}: InteractiveBoundaryProps) {
  const [features, setFeatures] = useState<BoundaryFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  // 计算多边形中心点（经纬度）
  const calculateCenter = (lines: THREE.Vector3[][]): { latitude: number; longitude: number } => {
    if (lines.length === 0 || lines[0].length === 0) {
      return { latitude: 0, longitude: 0 }
    }

    // 获取所有点
    const allPoints: THREE.Vector3[] = []
    lines.forEach(line => allPoints.push(...line))

    // 计算平均位置
    const avgPosition = new THREE.Vector3()
    allPoints.forEach(point => avgPosition.add(point))
    avgPosition.divideScalar(allPoints.length)

    // 转换为经纬度
    const { latitude, longitude } = vector3ToLonLat(avgPosition.x, avgPosition.y, avgPosition.z)
    return { latitude, longitude }
  }

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
            const center = calculateCenter(lines)
            featuresList.push({
              id: idx,
              name: feature.properties?.name || feature.properties?.NAME || `区域 ${idx}`,
              lines,
              center
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

  const handleClick = (e: any, feature: BoundaryFeature) => {
    // 立即清除悬停高亮状态
    setHoveredId(null)

    // 只在上色模式下处理点击并阻止传播
    if (paintMode && onCountryPaint) {
      e.stopPropagation()
      onCountryPaint(feature.id, selectedColor)
      console.log(`🎨 上色: ${feature.name} -> ${selectedColor}`)
    }
    // 非上色模式下不阻止传播，让事件传递到地球
  }

  // 在顶层预计算所有几何体，避免在循环中使用hooks
  const geometriesCache = useMemo(() => {
    const cache = new Map<number, any[]>()

    features.forEach(feature => {
      const fillColor = countryColors.get(feature.id)

      // 只在球形模式且未上色时创建几何体
      if (!fillColor && !isFlat) {
        const geometries = feature.lines.map((line) => {
          if (line.length < 3) return null
          try {
            return new ConvexGeometry(line)
          } catch (error) {
            console.warn(`Failed to create click geometry for feature ${feature.id}:`, error)
            return null
          }
        }).filter(Boolean)

        cache.set(feature.id, geometries)
      }
    })

    return cache
  }, [features, countryColors, isFlat])

  if (!visible || loading || features.length === 0) {
    return null
  }

  return (
    <group ref={groupRef} name="interactive-boundary-layer">
      {features.map((feature) => {
        const isHovered = hoveredId === feature.id
        const fillColor = countryColors.get(feature.id)
        const clickGeometries = geometriesCache.get(feature.id)

        return (
          <group key={`feature-${feature.id}`}>
            {/* 国家填充（如果已上色） */}
            {fillColor && feature.lines.length > 0 && feature.lines[0].length > 2 && (
              <>
                {isFlat ? (
                  // 平面模式填充
                  <mesh
                    position={[0, 0, 0.0005]}
                    onClick={(e) => handleClick(e, feature)}
                    onDoubleClick={(e) => handleClick(e, feature)}
                  >
                    <shapeGeometry
                      args={[
                        new THREE.Shape(
                          feature.lines[0].map(p => new THREE.Vector2(p.x, p.y))
                        )
                      ]}
                    />
                    <meshBasicMaterial
                      color={fillColor}
                      transparent
                      opacity={0.6}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  // 球形模式填充（使用Earcut三角剖分）
                  feature.lines.map((line, idx) => {
                    if (line.length < 3) return null

                    try {
                      // 步骤1: 准备3D顶点
                      const vertices3D: number[] = []
                      line.forEach(point => {
                        vertices3D.push(point.x, point.y, point.z)
                      })

                      // 步骤2: 将3D顶点投影到局部2D平面
                      // 计算多边形中心
                      const center = new THREE.Vector3()
                      line.forEach(point => center.add(point))
                      center.divideScalar(line.length)
                      center.normalize() // 归一化，得到球面上的中心方向

                      // 建立局部坐标系（以中心点为原点的切平面）
                      const normal = center.clone()
                      const up = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
                      const tangent = new THREE.Vector3().crossVectors(up, normal).normalize()
                      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize()

                      // 投影到2D
                      const vertices2D: number[] = []
                      line.forEach(point => {
                        const localPoint = point.clone().sub(center.clone().multiplyScalar(radius))
                        const u = localPoint.dot(tangent)
                        const v = localPoint.dot(bitangent)
                        vertices2D.push(u, v)
                      })

                      // 步骤3: 使用Earcut进行三角剖分
                      const indices = earcut(vertices2D)

                      // 步骤4: 创建BufferGeometry
                      const geometry = new THREE.BufferGeometry()
                      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices3D), 3))
                      geometry.setIndex(indices)
                      geometry.computeVertexNormals()

                      return (
                        <mesh
                          key={`fill-${feature.id}-${idx}`}
                          geometry={geometry}
                          onClick={(e) => handleClick(e, feature)}
                          onDoubleClick={(e) => handleClick(e, feature)}
                        >
                          <meshBasicMaterial
                            color={fillColor}
                            transparent
                            opacity={0.6}
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                      )
                    } catch (error) {
                      console.warn(`三角剖分失败 (feature ${feature.id}, line ${idx}):`, error)
                      return null
                    }
                  })
                )}
              </>
            )}

            {/* 主边界线 */}
            {feature.lines.map((points, lineIdx) => (
              <Line
                key={`line-${feature.id}-${lineIdx}`}
                points={points}
                color={isHovered ? '#FFFFFF' : color}
                lineWidth={isHovered ? lineWidth * 1.8 : lineWidth}
                transparent
                opacity={isHovered ? 0.9 : 0.7}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoveredId(feature.id)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoveredId(null)
                }}
                onClick={(e) => handleClick(e, feature)}
                onDoubleClick={(e) => handleClick(e, feature)}
              />
            ))}

            {/* 平面模式：简化的点击检测区域 */}
            {!fillColor && isFlat && feature.lines.length > 0 && feature.lines[0].length > 2 && (
              <mesh
                onClick={(e) => handleClick(e, feature)}
                onDoubleClick={(e) => handleClick(e, feature)}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoveredId(feature.id)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoveredId(null)
                }}
                position={[0, 0, 0.001]}
                visible={false}
              >
                <shapeGeometry
                  args={[
                    new THREE.Shape(
                      feature.lines[0].map(p => new THREE.Vector2(p.x, p.y))
                    )
                  ]}
                />
              </mesh>
            )}

            {/* 球形模式：不可见的点击检测区域（使用缓存的几何体） */}
            {clickGeometries && clickGeometries.map((geometry, idx) => {
              if (!geometry) return null

              return (
                <mesh
                  key={`click-area-${feature.id}-${idx}`}
                  geometry={geometry}
                  onClick={(e) => handleClick(e, feature)}
                  onDoubleClick={(e) => handleClick(e, feature)}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    setHoveredId(feature.id)
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation()
                    setHoveredId(null)
                  }}
                  visible={false}
                >
                  <meshBasicMaterial side={THREE.DoubleSide} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

// 性能优化：使用 React.memo 避免不必要的重渲染
export default memo(InteractiveBoundary)
