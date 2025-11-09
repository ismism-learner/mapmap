/**
 * 自定义图钉标记
 */
export interface CustomMarker {
  id: string
  latitude: number
  longitude: number
  info: MarkerInfo
  createdAt: number
  labelOffset?: { x: number; y: number } // 标签偏移位置（像素）
}

/**
 * 图钉信息内容
 */
export interface MarkerInfo {
  title: string
  description: string
  links: MarkerLink[]
  images: MarkerImage[]
}

/**
 * 超链接
 */
export interface MarkerLink {
  id: string
  text: string
  url: string
}

/**
 * 图片
 */
export interface MarkerImage {
  id: string
  url: string
  alt: string
}

/**
 * 图钉之间的连接线
 */
export interface MarkerConnection {
  id: string
  fromMarkerId: string
  toMarkerId: string
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
