import shp from 'shpjs'

/**
 * 加载 SHP 文件并转换为 GeoJSON 格式
 * @param shpPath - SHP 文件的路径（不带扩展名）
 * @returns GeoJSON 数据
 */
export async function loadShapefile(shpPath: string) {
  try {
    console.log('📂 loadShapefile called with path:', shpPath)

    // 移除 .shp 扩展名（如果有），shpjs 会自动添加
    const basePath = shpPath.replace(/\.shp$/, '')
    console.log('📂 Base path:', basePath)

    // shpjs 需要基础路径，它会自动加载 .shp, .dbf, .shx 等文件
    const geojson = await shp(basePath)

    console.log('✅ GeoJSON loaded successfully:', geojson)
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
