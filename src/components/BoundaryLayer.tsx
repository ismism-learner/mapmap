import { useEffect, useState, useMemo } from 'react'
import { BufferGeometry, Vector3, LineBasicMaterial, Line as ThreeLine } from 'three'
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
  lineWidth = 1,
  visible = true,
  radius = 1.002, // 略大于地球半径，确保边界线显示在表面之上
}: BoundaryLayerProps) {
  const [lines, setLines] = useState<Vector3[][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      return
    }

    const loadBoundaries = async () => {
      try {
        console.log('🔄 Loading shapefile:', shpPath)
        const geojson = await loadShapefile(shpPath)
        console.log('✅ Shapefile loaded:', geojson)

        const newLines: Vector3[][] = []

        // 处理 GeoJSON 特征
        const features = Array.isArray(geojson) ? geojson : geojson.features || []
        console.log(`📊 Found ${features.length} features`)

        features.forEach((feature: any, idx: number) => {
          const geometry = feature.geometry
          if (!geometry) {
            console.warn(`⚠️ Feature ${idx} has no geometry`)
            return
          }

          // 处理不同的几何类型
          if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            const coordinates =
              geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

            coordinates.forEach((polygon: number[][][]) => {
              polygon.forEach((ring: number[][]) => {
                const points: Vector3[] = []

                ring.forEach(([lon, lat]) => {
                  const { x, y, z } = lonLatToVector3(lon, lat, radius)
                  points.push(new Vector3(x, y, z))
                })

                if (points.length > 1) {
                  newLines.push(points)
                }
              })
            })
          } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
            const coordinates =
              geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates

            coordinates.forEach((line: number[][]) => {
              const points: Vector3[] = []

              line.forEach(([lon, lat]) => {
                const { x, y, z } = lonLatToVector3(lon, lat, radius)
                points.push(new Vector3(x, y, z))
              })

              if (points.length > 1) {
                newLines.push(points)
              }
            })
          }
        })

        console.log(`✅ Created ${newLines.length} boundary lines`)
        setLines(newLines)
        setLoading(false)
      } catch (error) {
        console.error('❌ Failed to load shapefile:', error)
        setLoading(false)
      }
    }

    loadBoundaries()
  }, [shpPath, visible, radius])

  // 创建材质
  const material = useMemo(() => {
    return new LineBasicMaterial({
      color: color,
      linewidth: lineWidth,
      opacity: 1,
      transparent: false,
    })
  }, [color, lineWidth])

  if (!visible) {
    return null
  }

  if (loading) {
    console.log('⏳ BoundaryLayer is loading...')
    return null
  }

  if (lines.length === 0) {
    console.warn('⚠️ No boundary lines to display')
    return null
  }

  console.log(`🎨 Rendering ${lines.length} boundary lines with color ${color}`)

  return (
    <group>
      {lines.map((points, index) => {
        const geometry = new BufferGeometry().setFromPoints(points)
        const line = new ThreeLine(geometry, material)
        return <primitive key={index} object={line} />
      })}
    </group>
  )
}

export default BoundaryLayer
