import shp from 'shpjs'

/**
 * 加载 SHP 文件并转换为 GeoJSON 格式
 * 在浏览器环境中，需要先 fetch 文件然后传递给 shpjs
 * @param shpPath - SHP 文件的路径
 * @returns GeoJSON 数据
 */
export async function loadShapefile(shpPath: string) {
  try {
    console.log('📂 loadShapefile called with path:', shpPath)

    // 移除 .shp 扩展名（如果有）
    const basePath = shpPath.replace(/\.shp$/, '')
    console.log('📂 Base path:', basePath)

    // 在浏览器环境中，需要通过 fetch 加载文件
    const [shpResponse, dbfResponse] = await Promise.all([
      fetch(`${basePath}.shp`),
      fetch(`${basePath}.dbf`)
    ])

    console.log('📥 Fetch responses:', {
      shp: { ok: shpResponse.ok, status: shpResponse.status },
      dbf: { ok: dbfResponse.ok, status: dbfResponse.status }
    })

    if (!shpResponse.ok) {
      throw new Error(`Failed to fetch SHP file: ${shpResponse.status} ${shpResponse.statusText}`)
    }

    if (!dbfResponse.ok) {
      throw new Error(`Failed to fetch DBF file: ${dbfResponse.status} ${dbfResponse.statusText}`)
    }

    console.log('✅ Files fetched successfully')

    const [shpBuffer, dbfBuffer] = await Promise.all([
      shpResponse.arrayBuffer(),
      dbfResponse.arrayBuffer()
    ])

    console.log('✅ Buffers loaded:', {
      shpSize: shpBuffer.byteLength,
      dbfSize: dbfBuffer.byteLength
    })

    // shpjs 接受一个包含多个文件的对象或单个 zip ArrayBuffer
    // 我们传递一个对象，键是文件扩展名，值是 ArrayBuffer
    const geojson = await shp({
      shp: shpBuffer,
      dbf: dbfBuffer
    })

    console.log('✅ GeoJSON created:', {
      type: Array.isArray(geojson) ? 'FeatureArray' : geojson.type,
      featuresCount: Array.isArray(geojson) ? geojson.length : geojson.features?.length || 0
    })

    // 打印第一个特征作为样本
    const features = Array.isArray(geojson) ? geojson : geojson.features
    if (features && features.length > 0) {
      console.log('📝 Sample feature:', {
        type: features[0].geometry?.type,
        properties: Object.keys(features[0].properties || {})
      })
    }

    return geojson
  } catch (error) {
    console.error(`❌ Error loading shapefile ${shpPath}:`, error)
    throw error
  }
}

/**
 * 将经纬度坐标转换为球面3D坐标
 * @param lon - 经度
 * @param lat - 纬度
 * @param radius - 球体半径
 */
export function lonLatToVector3(lon: number, lat: number, radius: number = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return { x, y, z }
}
