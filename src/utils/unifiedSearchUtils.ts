/**
 * 统一搜索工具 - 使用三层数据结构
 * 搜索层级通过逗号数量判断：
 * - 无逗号：搜索国家
 * - 一个逗号：搜索省/州
 * - 两个逗号：搜索城市
 */

import { pinyin } from 'pinyin-pro'

export interface UnifiedCity {
  id: number
  name: string
  latitude: string
  longitude: string
}

export interface UnifiedState {
  id: number
  name: string
  iso2?: string
  latitude: string
  longitude: string
  type?: string
  cities: UnifiedCity[]
}

export interface UnifiedCountry {
  id: number
  name: string
  iso2: string
  iso3: string
  latitude: string
  longitude: string
  translations: {
    'zh-CN': string
    [key: string]: string
  }
  states: UnifiedState[]
}

export interface SearchResult {
  id: string // 唯一标识符 "country-1" | "state-3901" | "city-52"
  name: string // 显示名称
  displayPath: string // 显示路径 "国家" | "省, 国家" | "城市, 省, 国家"
  latitude: string
  longitude: string
  level: 'country' | 'state' | 'city' // 搜索层级
}

let countriesData: UnifiedCountry[] | null = null

/**
 * 加载统一数据库
 */
export async function loadUnifiedDatabase(): Promise<UnifiedCountry[]> {
  if (countriesData) {
    return countriesData
  }

  try {
    const response = await fetch('/countries-states-cities.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch database: ${response.status}`)
    }
    countriesData = await response.json()
    console.log(`✅ 加载统一数据库: ${countriesData!.length} 个国家`)
    return countriesData!
  } catch (error) {
    console.error('❌ 加载统一数据库失败:', error)
    return []
  }
}

/**
 * 检测文本是否包含中文字符
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

/**
 * 将中文转换为拼音
 */
function chineseToPinyin(text: string): string {
  if (!containsChinese(text)) {
    return text
  }
  const pinyinText = pinyin(text, {
    toneType: 'none',
    type: 'string'
  })
  return pinyinText.replace(/\s+/g, '').toLowerCase()
}

/**
 * 智能搜索：根据逗号数量判断搜索层级
 */
export async function smartSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim() === '') {
    return []
  }

  const countries = await loadUnifiedDatabase()
  const trimmed = query.trim()

  // 统计逗号数量（支持中英文逗号）
  const commaCount = (trimmed.match(/[,，]/g) || []).length

  // 分割搜索词
  const parts = trimmed.split(/[,，]/).map(p => p.trim()).filter(p => p)

  if (parts.length === 0) {
    return []
  }

  const results: SearchResult[] = []

  if (commaCount === 0) {
    // 一层搜索：国家
    results.push(...searchCountries(countries, parts[0]))
  } else if (commaCount === 1) {
    // 二层搜索：省/州
    if (parts.length === 2) {
      // "广东, 中国" 格式
      results.push(...searchStates(countries, parts[0], parts[1]))
    } else if (parts.length === 1) {
      // "广东" 格式，搜索所有国家的省
      results.push(...searchStates(countries, parts[0]))
    }
  } else if (commaCount >= 2) {
    // 三层搜索：城市
    if (parts.length === 3) {
      // "深圳, 广东, 中国" 格式
      results.push(...searchCities(countries, parts[0], parts[1], parts[2]))
    } else if (parts.length === 2) {
      // "深圳, 广东" 格式
      results.push(...searchCities(countries, parts[0], parts[1]))
    } else if (parts.length === 1) {
      // "深圳" 格式
      results.push(...searchCities(countries, parts[0]))
    }
  }

  return results.slice(0, 50)
}

/**
 * 搜索国家
 */
function searchCountries(countries: UnifiedCountry[], query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase()
  const pinyinQuery = containsChinese(query) ? chineseToPinyin(query) : ''

  return countries.filter(country => {
    const countryName = country.name.toLowerCase()
    const chineseName = country.translations?.['zh-CN'] || ''

    // 中文名匹配
    if (chineseName && chineseName.includes(query)) {
      return true
    }

    // 英文名匹配
    if (countryName.includes(lowerQuery)) {
      return true
    }

    // 拼音匹配
    if (pinyinQuery && countryName.includes(pinyinQuery)) {
      return true
    }

    return false
  }).map(country => ({
    id: `country-${country.id}`,
    name: country.translations?.['zh-CN'] || country.name,
    displayPath: '国家',
    latitude: country.latitude,
    longitude: country.longitude,
    level: 'country' as const
  }))
}

/**
 * 搜索省/州
 */
function searchStates(
  countries: UnifiedCountry[],
  stateQuery: string,
  countryQuery?: string
): SearchResult[] {
  const lowerStateQuery = stateQuery.toLowerCase()
  const pinyinStateQuery = containsChinese(stateQuery) ? chineseToPinyin(stateQuery) : ''

  const results: SearchResult[] = []

  for (const country of countries) {
    // 如果指定了国家，先过滤国家
    if (countryQuery) {
      const lowerCountryQuery = countryQuery.toLowerCase()
      const countryName = country.name.toLowerCase()
      const chineseCountryName = country.translations?.['zh-CN'] || ''

      const countryMatch =
        chineseCountryName.includes(countryQuery) ||
        countryName.includes(lowerCountryQuery)

      if (!countryMatch) {
        continue
      }
    }

    // 搜索该国家的省/州
    for (const state of country.states) {
      const stateName = state.name.toLowerCase()

      const stateMatch =
        stateName.includes(lowerStateQuery) ||
        (pinyinStateQuery && stateName.includes(pinyinStateQuery))

      if (stateMatch) {
        const countryDisplayName = country.translations?.['zh-CN'] || country.name
        results.push({
          id: `state-${state.id}`,
          name: state.name,
          displayPath: `省/州, ${countryDisplayName}`,
          latitude: state.latitude,
          longitude: state.longitude,
          level: 'state' as const
        })
      }
    }
  }

  return results
}

/**
 * 搜索城市
 */
function searchCities(
  countries: UnifiedCountry[],
  cityQuery: string,
  stateQuery?: string,
  countryQuery?: string
): SearchResult[] {
  const lowerCityQuery = cityQuery.toLowerCase()
  const pinyinCityQuery = containsChinese(cityQuery) ? chineseToPinyin(cityQuery) : ''

  const results: SearchResult[] = []

  for (const country of countries) {
    // 如果指定了国家，先过滤国家
    if (countryQuery) {
      const lowerCountryQuery = countryQuery.toLowerCase()
      const countryName = country.name.toLowerCase()
      const chineseCountryName = country.translations?.['zh-CN'] || ''

      const countryMatch =
        chineseCountryName.includes(countryQuery) ||
        countryName.includes(lowerCountryQuery)

      if (!countryMatch) {
        continue
      }
    }

    // 搜索州/省
    for (const state of country.states) {
      // 如果指定了州，先过滤州
      if (stateQuery) {
        const lowerStateQuery = stateQuery.toLowerCase()
        const stateName = state.name.toLowerCase()

        const stateMatch = stateName.includes(lowerStateQuery)

        if (!stateMatch) {
          continue
        }
      }

      // 搜索城市
      for (const city of state.cities) {
        const cityName = city.name.toLowerCase()

        const cityMatch =
          cityName.includes(lowerCityQuery) ||
          (pinyinCityQuery && cityName.includes(pinyinCityQuery))

        if (cityMatch) {
          const countryDisplayName = country.translations?.['zh-CN'] || country.name
          results.push({
            id: `city-${city.id}`,
            name: city.name,
            displayPath: `${state.name}, ${countryDisplayName}`,
            latitude: city.latitude,
            longitude: city.longitude,
            level: 'city' as const
          })
        }
      }
    }
  }

  return results
}
