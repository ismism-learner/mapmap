/**
 * 底图纹理配置
 */
export interface TextureConfig {
  id: string
  name: string
  path: string
  description?: string
}

/**
 * 加载可用的底图列表
 */
export async function loadTextures(): Promise<TextureConfig[]> {
  try {
    const response = await fetch('/textures/textures.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch textures: ${response.status}`)
    }
    const textures = await response.json()
    console.log(`✅ Loaded ${textures.length} textures`)
    return textures
  } catch (error) {
    console.error('❌ Failed to load textures:', error)
    // 返回默认底图
    return [
      {
        id: 'earth_hq',
        name: '默认地球',
        path: '/textures/earth_hq.jpg',
        description: '高质量地球纹理'
      }
    ]
  }
}
