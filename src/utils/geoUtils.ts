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
    // shpjs 可以接受一个包含 .shp 和 .dbf 的 buffer 数组，或者一个 zip 文件

    // 方法1: 尝试加载单独的 .shp 和 .dbf 文件
    const [shpResponse, dbfResponse] = await Promise.all([
      fetch(`${basePath}.shp`),
      fetch(`${basePath}.dbf`)
    ])

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

    console.log('✅ Buffers loaded, SHP size:', shpBuffer.byteLength, 'DBF size:', dbfBuffer.byteLength)

    // 使用 shpjs 解析
    const geojson = await shp.combine([
      shp.parseShp(shpBuffer),
      shp.parseDbf(dbfBuffer)
    ])

    console.log('✅ GeoJSON parsed successfully:', geojson)
    console.log('📊 Features count:', geojson.features?.length || 0)

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
