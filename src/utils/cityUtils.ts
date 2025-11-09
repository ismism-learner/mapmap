import { TranslationData, smartTranslate, containsChinese } from './translationUtils'

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
    const response = await fetch('/cities.json')
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
 * 搜索城市（支持国家名和城市名，支持中文）
 */
export function searchCities(cities: City[], query: string, translations?: TranslationData): City[] {
  if (!query || query.trim() === '') {
    return []
  }

  let searchQuery = query.trim()

  // 如果包含中文且有翻译数据，尝试翻译为英文
  if (containsChinese(searchQuery) && translations) {
    const translated = smartTranslate(searchQuery, translations)
    console.log(`🔍 搜索翻译: "${searchQuery}" -> "${translated}"`)
    searchQuery = translated
  }

  const lowerQuery = searchQuery.toLowerCase()

  return cities.filter(city =>
    city.name.toLowerCase().includes(lowerQuery) ||
    city.country_name.toLowerCase().includes(lowerQuery) ||
    city.state_name.toLowerCase().includes(lowerQuery)
  ).slice(0, 50) // 限制返回50个结果
}
