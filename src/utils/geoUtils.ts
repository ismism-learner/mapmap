import shp from 'shpjs'

/**
 * 加载 SHP 文件并转换为 GeoJSON 格式
 * @param shpPath - SHP 文件的路径
 * @returns GeoJSON 数据
 */
export async function loadShapefile(shpPath: string) {
  try {
    // shpjs 可以直接加载 .shp 文件，它会自动查找同名的 .dbf 和 .shx 文件
    const geojson = await shp(shpPath)
    return geojson
  } catch (error) {
    console.error(`Error loading shapefile ${shpPath}:`, error)
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
