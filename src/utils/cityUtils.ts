import { smartTranslate, containsChinese } from './translationUtils'

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
 * 搜索城市（支持国家名和城市名，支持中英文混合搜索）
 */
export async function searchCities(cities: City[], query: string): Promise<City[]> {
  if (!query || query.trim() === '') {
    return []
  }

  const searchQuery = query.trim()
  const lowerQuery = searchQuery.toLowerCase()

  // 如果包含中文，同时用中文和英文搜索
  let translatedQuery = ''
  if (containsChinese(searchQuery)) {
    translatedQuery = (await smartTranslate(searchQuery)).toLowerCase()
    console.log(`🔍 搜索: 中文="${searchQuery}" + 英文="${translatedQuery}"`)
  }

  return cities.filter(city => {
    const cityName = city.name.toLowerCase()
    const countryName = city.country_name.toLowerCase()
    const stateName = city.state_name.toLowerCase()

    // 直接用原始输入搜索（支持中文字段）
    const matchOriginal =
      cityName.includes(lowerQuery) ||
      countryName.includes(lowerQuery) ||
      stateName.includes(lowerQuery) ||
      city.name.includes(searchQuery) ||
      city.country_name.includes(searchQuery) ||
      city.state_name.includes(searchQuery)

    // 如果有翻译，也用翻译后的搜索（支持中文输入搜索英文字段）
    const matchTranslated = translatedQuery ? (
      cityName.includes(translatedQuery) ||
      countryName.includes(translatedQuery) ||
      stateName.includes(translatedQuery)
    ) : false

    return matchOriginal || matchTranslated
  }).slice(0, 50) // 限制返回50个结果
}
