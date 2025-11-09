export interface City {
  id: number
  name: string
  state_id: number
  state_code: string
  state_name: string
  country_id: number
  country_code: string
  country_name: string
  latitude: string
  longitude: string
  wikiDataId?: string
}

/**
 * 加载主要城市数据
 */
export async function loadCities(): Promise<City[]> {
  try {
    const response = await fetch('/major-cities.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`)
    }
    const cities = await response.json()
    console.log(`✅ Loaded ${cities.length} cities`)
    return cities
  } catch (error) {
    console.error('❌ Failed to load cities:', error)
    return []
  }
}

/**
 * 搜索城市（支持国家名和城市名）
 */
export function searchCities(cities: City[], query: string): City[] {
  if (!query || query.trim() === '') {
    return []
  }

  const lowerQuery = query.toLowerCase().trim()

  return cities.filter(city =>
    city.name.toLowerCase().includes(lowerQuery) ||
    city.country_name.toLowerCase().includes(lowerQuery) ||
    city.state_name.toLowerCase().includes(lowerQuery)
  ).slice(0, 50) // 限制返回50个结果
}
