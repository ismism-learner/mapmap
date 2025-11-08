import { useEffect, useState } from 'react'
import { Vector3 } from 'three'
import { Line } from '@react-three/drei'
import { loadShapefile, lonLatToVector3 } from '../utils/geoUtils'

interface BoundaryLayerProps {
  shpPath: string
  color?: string
  lineWidth?: number
  visible?: boolean
  radius?: number
}

/**
 * 边界线图层组件
 * - 加载并渲染 SHP 文件中的边界线
 * - 将地理坐标转换为球面 3D 坐标
 */
function BoundaryLayer({
  shpPath,
  color = '#ffffff',
  lineWidth = 2,
  visible = true,
  radius = 1.005, // 略大于地球半径，确保边界线显示在表面之上
}: BoundaryLayerProps) {
  const [lines, setLines] = useState<Vector3[][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      return
    }

    const loadBoundaries = async () => {
      try {
        console.log('🔄 [BoundaryLayer] Loading shapefile:', shpPath)
        const geojson = await loadShapefile(shpPath)

        const newLines: Vector3[][] = []

        // 处理 GeoJSON 特征
        const features = Array.isArray(geojson) ? geojson : geojson.features || []
        console.log(`📊 [BoundaryLayer] Processing ${features.length} features`)

        let totalRings = 0
        features.forEach((feature: any, idx: number) => {
          const geometry = feature.geometry
          if (!geometry) {
            console.warn(`⚠️ [BoundaryLayer] Feature ${idx} has no geometry`)
            return
          }

          // 处理不同的几何类型
          if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            const coordinates =
              geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

            coordinates.forEach((polygon: number[][][], polyIdx: number) => {
              polygon.forEach((ring: number[][], ringIdx: number) => {
                const points: Vector3[] = []

                ring.forEach(([lon, lat]) => {
                  if (lon !== undefined && lat !== undefined) {
                    const { x, y, z } = lonLatToVector3(lon, lat, radius)
                    points.push(new Vector3(x, y, z))
                  }
                })

                if (points.length > 1) {
                  newLines.push(points)
                  totalRings++

                  // 打印前几条线的详细信息
                  if (totalRings <= 3) {
                    console.log(`🔍 [BoundaryLayer] Line ${totalRings}:`, {
                      featureIdx: idx,
                      polygonIdx: polyIdx,
                      ringIdx: ringIdx,
                      pointsCount: points.length,
                      firstPoint: points[0],
                      lastPoint: points[points.length - 1]
                    })
                  }
                }
              })
            })
          } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
            const coordinates =
              geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates

            coordinates.forEach((line: number[][]) => {
              const points: Vector3[] = []

              line.forEach(([lon, lat]) => {
                if (lon !== undefined && lat !== undefined) {
                  const { x, y, z } = lonLatToVector3(lon, lat, radius)
                  points.push(new Vector3(x, y, z))
                }
              })

              if (points.length > 1) {
                newLines.push(points)
                totalRings++
              }
            })
          }
        })

        console.log(`✅ [BoundaryLayer] Created ${newLines.length} boundary lines from ${totalRings} rings`)

        if (newLines.length === 0) {
          console.warn('⚠️ [BoundaryLayer] No valid lines were created!')
        }

        setLines(newLines)
        setLoading(false)
      } catch (error) {
        console.error('❌ [BoundaryLayer] Failed to load shapefile:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setLoading(false)
      }
    }

    loadBoundaries()
  }, [shpPath, visible, radius])

  if (!visible) {
    console.log('👁️ [BoundaryLayer] Not visible, returning null')
    return null
  }

  if (loading) {
    console.log('⏳ [BoundaryLayer] Still loading...')
    return null
  }

  if (error) {
    console.error('❌ [BoundaryLayer] Error state:', error)
    return null
  }

  if (lines.length === 0) {
    console.warn('⚠️ [BoundaryLayer] No boundary lines to display')
    return null
  }

  console.log(`🎨 [BoundaryLayer] Rendering ${lines.length} lines with color ${color}`)

  return (
    <group name="boundary-layer">
      {lines.map((points, index) => {
        // 每100条线打印一次
        if (index % 100 === 0) {
          console.log(`🖊️ [BoundaryLayer] Rendering line ${index}/${lines.length}`)
        }

        return (
          <Line
            key={`boundary-line-${index}`}
            points={points}
            color={color}
            lineWidth={lineWidth}
            dashed={false}
          />
        )
      })}
    </group>
  )
}

export default BoundaryLayer
