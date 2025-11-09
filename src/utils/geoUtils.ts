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

/**
 * 将3D坐标转换为经纬度
 * @param x - X坐标
 * @param y - Y坐标
 * @param z - Z坐标
 */
export function vector3ToLonLat(x: number, y: number, z: number) {
  const radius = Math.sqrt(x * x + y * y + z * z)
  const phi = Math.acos(y / radius)
  const theta = Math.atan2(z, -x)

  const latitude = 90 - (phi * 180) / Math.PI
  const longitude = (theta * 180) / Math.PI - 180

  return { latitude, longitude }
}

/**
 * 将经纬度转换为平面地图坐标
 * @param lon - 经度 (-180 to 180)
 * @param lat - 纬度 (-90 to 90)
 * @param mapWidth - 地图宽度（默认4）
 * @param mapHeight - 地图高度（默认2）
 */
export function lonLatToFlatPosition(
  lon: number,
  lat: number,
  mapWidth: number = 4,
  mapHeight: number = 2
) {
  // 等距圆柱投影
  // 经度 -180 到 180 映射到 x: -mapWidth/2 到 mapWidth/2
  // 纬度 -90 到 90 映射到 y: -mapHeight/2 到 mapHeight/2
  const x = (lon / 180) * (mapWidth / 2)
  const y = (lat / 90) * (mapHeight / 2)
  const z = 0.01 // 略微抬高以避免z-fighting

  return { x, y, z }
}
