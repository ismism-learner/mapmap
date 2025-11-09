import { City } from './cityUtils'
import { smartTranslate } from './translationUtils'
import { isBilibiliURL } from './bilibiliUtils'

export interface ParsedConnection {
  type: 'connection'
  time: string
  eventName: string
  location1: string
  relationship: string
  location2: string
}

export interface ParsedPin {
  type: 'pin'
  time: string
  eventName: string
  location: string
  description: string
}

export interface ParsedVideoPin {
  type: 'videoPin'
  location: string
  videoUrl: string
}

export type ParsedEvent = ParsedConnection | ParsedPin | ParsedVideoPin

/**
 * 解析单行事件文本
 * - 连接线格式：时间;事件名;地点1;关系;地点2
 * - 图钉格式：;时间;事件名;地点;描述
 * - 视频图钉格式：地点;B站链接
 */
export function parseEventLine(line: string): ParsedEvent | null {
  const trimmedLine = line.trim()

  if (!trimmedLine) {
    return null
  }

  // 同时支持中文分号和英文分号
  const normalizedLine = trimmedLine.replace(/；/g, ';')
  const parts = normalizedLine.split(';').map(p => p.trim())

  // 视频图钉格式：地点;B站链接 (2个部分)
  if (parts.length === 2 && isBilibiliURL(parts[1])) {
    return {
      type: 'videoPin',
      location: parts[0],
      videoUrl: parts[1]
    }
  }

  // 图钉格式：以分号开头，第一个元素为空
  if (parts[0] === '' && parts.length >= 5) {
    return {
      type: 'pin',
      time: parts[1],
      eventName: parts[2],
      location: parts[3],
      description: parts[4]
    }
  }

  // 连接线格式：时间;事件名;地点1;关系;地点2
  if (parts.length >= 5 && parts[0] !== '') {
    return {
      type: 'connection',
      time: parts[0],
      eventName: parts[1],
      location1: parts[2],
      relationship: parts[3],
      location2: parts[4]
    }
  }

  console.warn('⚠️ 无法解析行:', line)
  return null
}

/**
 * 解析多行事件文本
 */
export function parseEventText(text: string): ParsedEvent[] {
  const lines = text.split('\n')
  const events: ParsedEvent[] = []

  for (const line of lines) {
    const event = parseEventLine(line)
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * 标准化字符串用于拼音匹配
 * 移除空格、撇号、连字符等特殊字符，转小写
 * 例如："Xi'an" -> "xian", "New York" -> "newyork"
 */
function normalizeForPinyinMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/['\-\s]/g, '')  // 移除撇号、连字符、空格
    .trim()
}

/**
 * 地理编码：将地点字符串转换为经纬度坐标
 * 支持格式：
 * - "美国,加利福尼亚" -> 搜索加利福尼亚州的城市
 * - "中国,北京" -> 搜索北京
 * - "德国" -> 搜索德国的主要城市
 * 支持中文地名，会自动翻译为英文（或转换为拼音）
 */
export async function geocodeLocation(
  locationStr: string,
  cities: City[]
): Promise<{ latitude: number; longitude: number } | null> {
  if (!locationStr || !cities.length) {
    return null
  }

  const parts = locationStr.split(',').map(p => p.trim())

  // 将中文翻译为英文
  const translatedParts = await Promise.all(
    parts.map(part => smartTranslate(part))
  )

  let countryName = ''
  let stateName = ''
  let cityName = ''

  if (translatedParts.length === 1) {
    // 单个名称：可能是国家或城市
    countryName = translatedParts[0]
  } else if (translatedParts.length === 2) {
    // 两个名称：国家,州/城市
    countryName = translatedParts[0]
    cityName = translatedParts[1]
    stateName = translatedParts[1]
  } else if (translatedParts.length >= 3) {
    // 三个或更多：国家,州,城市
    countryName = translatedParts[0]
    stateName = translatedParts[1]
    cityName = translatedParts[2]
  }

  // 搜索匹配的城市 - 使用精确层级匹配 + 拼音匹配
  const candidates = cities.filter(city => {
    // 标准化所有名称用于拼音匹配
    const normCityName = normalizeForPinyinMatch(city.name)
    const normCountryName = normalizeForPinyinMatch(city.country_name)
    const normStateName = normalizeForPinyinMatch(city.state_name)
    const normCityFilter = normalizeForPinyinMatch(cityName)
    const normCountryFilter = normalizeForPinyinMatch(countryName)
    const normStateFilter = normalizeForPinyinMatch(stateName)

    // 拼音匹配：标准化后精确匹配或开头匹配
    const cityMatch = normCityFilter &&
      (normCityName === normCityFilter || normCityName.startsWith(normCityFilter))

    const stateMatch = normStateFilter &&
      (normStateName === normStateFilter || normStateName.startsWith(normStateFilter))

    const countryMatch = normCountryFilter &&
      (normCountryName === normCountryFilter || normCountryName.startsWith(normCountryFilter))

    // 组合匹配逻辑 - 按层级结构匹配
    if (translatedParts.length === 3) {
      // 国家,州省,城市：三者都必须匹配
      return countryMatch && stateMatch && cityMatch
    } else if (translatedParts.length === 2) {
      // 国家,州省/城市：国家必须匹配，州或城市匹配
      return countryMatch && (stateMatch || cityMatch)
    } else {
      // 单个名称：只匹配国家（返回该国家的首都或主要城市）
      return countryMatch
    }
  })

  if (candidates.length > 0) {
    // 选择第一个匹配结果（通常是人口最多的）
    const city = candidates[0]
    console.log(`📍 地理编码: "${locationStr}" -> ${city.name}, ${city.country_name} (${city.latitude}, ${city.longitude})`)

    return {
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude)
    }
  }

  console.warn(`⚠️ 无法找到地点: "${locationStr}"`)
  return null
}

/**
 * 将解析后的事件转换为标记和连接
 */
export interface GeocodedMarker {
  latitude: number
  longitude: number
  title: string
  description: string
  time: string
  videoUrl?: string // B站视频链接（可选）
}

export interface GeocodedConnection {
  marker1: GeocodedMarker
  marker2: GeocodedMarker
  relationship: string
}

export async function geocodeEvents(
  events: ParsedEvent[],
  cities: City[]
): Promise<{
  markers: GeocodedMarker[]
  connections: GeocodedConnection[]
}> {
  const markers: GeocodedMarker[] = []
  const connections: GeocodedConnection[] = []

  for (const event of events) {
    if (event.type === 'videoPin') {
      // 视频图钉：地点;B站链接
      const coords = await geocodeLocation(event.location, cities)
      if (coords) {
        markers.push({
          latitude: coords.latitude,
          longitude: coords.longitude,
          title: event.location, // 使用地点作为临时标题
          description: '',
          time: '',
          videoUrl: event.videoUrl
        })
      }
    } else if (event.type === 'pin') {
      const coords = await geocodeLocation(event.location, cities)
      if (coords) {
        markers.push({
          latitude: coords.latitude,
          longitude: coords.longitude,
          title: event.eventName,
          description: `${event.description}\n时间: ${event.time}`,
          time: event.time
        })
      }
    } else if (event.type === 'connection') {
      const coords1 = await geocodeLocation(event.location1, cities)
      const coords2 = await geocodeLocation(event.location2, cities)

      if (coords1 && coords2) {
        const marker1: GeocodedMarker = {
          latitude: coords1.latitude,
          longitude: coords1.longitude,
          title: event.eventName,
          description: `${event.location1}\n${event.relationship}\n时间: ${event.time}`,
          time: event.time
        }

        const marker2: GeocodedMarker = {
          latitude: coords2.latitude,
          longitude: coords2.longitude,
          title: event.eventName,
          description: `${event.location2}\n时间: ${event.time}`,
          time: event.time
        }

        connections.push({
          marker1,
          marker2,
          relationship: event.relationship
        })
      }
    }
  }

  return { markers, connections }
}
