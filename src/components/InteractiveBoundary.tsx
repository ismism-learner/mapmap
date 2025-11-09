import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { loadShapefile, lonLatToVector3, lonLatToFlatPosition, vector3ToLonLat } from '../utils/geoUtils'

interface InteractiveBoundaryProps {
  shpPath: string
  color?: string
  lineWidth?: number
  visible?: boolean
  radius?: number
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
  onCountryClick?: (countryInfo: { id: number; name: string; latitude: number; longitude: number }) => void
  selectedCountries?: number[]
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
  onCountryClick,
  selectedCountries = []
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

  const handleClick = (feature: BoundaryFeature) => {
    console.log(`🖱️ 点击国家: ${feature.name}`, feature.center)

    if (onCountryClick) {
      onCountryClick({
        id: feature.id,
        name: feature.name || `区域 ${feature.id}`,
        latitude: feature.center.latitude,
        longitude: feature.center.longitude
      })
    }
  }

  if (!visible || loading || features.length === 0) {
    return null
  }

  return (
    <group ref={groupRef} name="interactive-boundary-layer">
      {features.map((feature) => {
        const isSelected = selectedCountries.includes(feature.id)
        const isHovered = hoveredId === feature.id

        return (
          <group key={`feature-${feature.id}`}>
            {/* 主边界线 */}
            {feature.lines.map((points, lineIdx) => (
              <Line
                key={`line-${feature.id}-${lineIdx}`}
                points={points}
                color={isSelected ? '#00FFFF' : (isHovered ? '#FFFFFF' : color)}
                lineWidth={isSelected ? lineWidth * 2.5 : (isHovered ? lineWidth * 1.8 : lineWidth)}
                transparent
                opacity={isSelected ? 1 : (isHovered ? 0.9 : 0.7)}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoveredId(feature.id)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoveredId(null)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick(feature)
                }}
              />
            ))}

            {/* 平面模式：简化的点击检测区域 */}
            {isFlat && feature.lines.length > 0 && feature.lines[0].length > 2 && (
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick(feature)
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
          </group>
        )
      })}
    </group>
  )
}

export default InteractiveBoundary
