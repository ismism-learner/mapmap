import { useEffect, useState } from 'react'
import { BufferGeometry, Vector3 } from 'three'
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
  radius = 1.001, // 略大于地球半径，确保边界线显示在表面之上
}: BoundaryLayerProps) {
  const [geometries, setGeometries] = useState<BufferGeometry[]>([])

  useEffect(() => {
    if (!visible) return

    const loadBoundaries = async () => {
      try {
        const geojson = await loadShapefile(shpPath)
        const newGeometries: BufferGeometry[] = []

        // 处理 GeoJSON 特征
        const features = Array.isArray(geojson) ? geojson : geojson.features || []

        features.forEach((feature: any) => {
          const geometry = feature.geometry
          if (!geometry) return

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
                  const lineGeometry = new BufferGeometry().setFromPoints(points)
                  newGeometries.push(lineGeometry)
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
                const lineGeometry = new BufferGeometry().setFromPoints(points)
                newGeometries.push(lineGeometry)
              }
            })
          }
        })

        setGeometries(newGeometries)
      } catch (error) {
        console.error('Failed to load shapefile:', error)
      }
    }

    loadBoundaries()
  }, [shpPath, visible, radius])

  if (!visible || geometries.length === 0) {
    return null
  }

  return (
    <group>
      {geometries.map((geometry, index) => (
        <line key={index}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial attach="material" color={color} linewidth={lineWidth} />
        </line>
      ))}
    </group>
  )
}

export default BoundaryLayer
