/**
 * 翻译工具 - 直接使用原始 countries.json 数据
 * 支持拼音匹配城市/州名
 */

import { pinyin } from 'pinyin-pro'

export interface Country {
  id: number
  name: string
  iso2: string
  iso3: string
  translations: {
    'zh-CN': string
    [key: string]: string
  }
}

let countriesData: Country[] | null = null

/**
 * 加载国家数据（包含中文翻译）
 */
export async function loadCountries(): Promise<Country[]> {
  if (countriesData) {
    return countriesData
  }

  try {
    const response = await fetch('/data/countries.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status}`)
    }
    countriesData = await response.json()
    console.log(`✅ 加载 ${countriesData!.length} 个国家数据（含中文翻译）`)
    return countriesData!
  } catch (error) {
    console.error('❌ 加载国家数据失败:', error)
    return []
  }
}

/**
 * 中文城市名称映射（仅主要城市）
 * 因为原始数据库没有城市的中文翻译，这里手动维护常用城市
 */
const CITY_TRANSLATIONS: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '成都': 'Chengdu',
  '杭州': 'Hangzhou',
  '重庆': 'Chongqing',
  '武汉': 'Wuhan',
  '西安': "Xi'an",
  '苏州': 'Suzhou',
  '天津': 'Tianjin',
  '南京': 'Nanjing',
  '长沙': 'Changsha',
  '郑州': 'Zhengzhou',
  '沈阳': 'Shenyang',
  '青岛': 'Qingdao',
  '东莞': 'Dongguan',
  '大连': 'Dalian',
  '宁波': 'Ningbo',
  '厦门': 'Xiamen',
  '福州': 'Fuzhou',
  '无锡': 'Wuxi',
  '合肥': 'Hefei',
  '昆明': 'Kunming',
  '哈尔滨': 'Harbin',
  '济南': 'Jinan',
  '佛山': 'Foshan',
  '长春': 'Changchun',
  '温州': 'Wenzhou',
  '石家庄': 'Shijiazhuang',
  '南宁': 'Nanning',
  '南昌': 'Nanchang',
  '贵阳': 'Guiyang',
  '太原': 'Taiyuan',
  '香港': 'Hong Kong',
  '澳门': 'Macao',
  '台北': 'Taipei'
}

/**
 * 中文省份名称映射
 */
const STATE_TRANSLATIONS: Record<string, string> = {
  '安徽': 'Anhui',
  '北京': 'Beijing',
  '重庆': 'Chongqing',
  '福建': 'Fujian',
  '甘肃': 'Gansu',
  '广东': 'Guangdong',
  '广西': 'Guangxi',
  '贵州': 'Guizhou',
  '海南': 'Hainan',
  '河北': 'Hebei',
  '黑龙江': 'Heilongjiang',
  '河南': 'Henan',
  '香港': 'Hong Kong',
  '湖北': 'Hubei',
  '湖南': 'Hunan',
  '内蒙古': 'Inner Mongolia',
  '江苏': 'Jiangsu',
  '江西': 'Jiangxi',
  '吉林': 'Jilin',
  '辽宁': 'Liaoning',
  '澳门': 'Macao',
  '宁夏': 'Ningxia',
  '青海': 'Qinghai',
  '陕西': 'Shaanxi',
  '山东': 'Shandong',
  '上海': 'Shanghai',
  '山西': 'Shanxi',
  '四川': 'Sichuan',
  '台湾': 'Taiwan',
  '天津': 'Tianjin',
  '西藏': 'Tibet',
  '新疆': 'Xinjiang',
  '云南': 'Yunnan',
  '浙江': 'Zhejiang'
}

/**
 * 检测文本是否包含中文字符
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

/**
 * 将中文转换为拼音（用于匹配数据库中的拼音地名）
 * 例如："北京" -> "beijing"
 */
export function chineseToPinyin(text: string): string {
  if (!containsChinese(text)) {
    return text
  }

  // 转换为拼音，不带音调，返回字符串（默认用空格分隔）
  const pinyinText = pinyin(text, {
    toneType: 'none',      // 不要声调
    type: 'string'         // 返回字符串类型
  })

  // 移除空格，转小写
  return pinyinText.replace(/\s+/g, '').toLowerCase()
}

/**
 * 将中文翻译为英文
 * @param chineseText 中文文本
 * @param countries 国家数据（可选，如果已加载）
 */
export function translateToEnglish(
  chineseText: string,
  countries?: Country[]
): string {
  const trimmed = chineseText.trim()

  // 1. 尝试城市翻译
  if (CITY_TRANSLATIONS[trimmed]) {
    return CITY_TRANSLATIONS[trimmed]
  }

  // 2. 尝试省份翻译
  if (STATE_TRANSLATIONS[trimmed]) {
    return STATE_TRANSLATIONS[trimmed]
  }

  // 3. 尝试国家翻译（从 countries.json 的 translations["zh-CN"] 字段）
  if (countries) {
    const country = countries.find(c =>
      c.translations && c.translations['zh-CN'] === trimmed
    )
    if (country) {
      console.log(`🔄 翻译国家: "${trimmed}" -> "${country.name}"`)
      return country.name
    }
  }

  // 4. 如果是中文但没找到翻译，转换为拼音用于匹配
  if (containsChinese(trimmed)) {
    const pinyinResult = chineseToPinyin(trimmed)
    console.log(`🔄 拼音转换: "${trimmed}" -> "${pinyinResult}"`)
    return pinyinResult
  }

  // 5. 返回原文
  return trimmed
}

/**
 * 智能翻译：如果是中文则翻译，否则保持原文
 */
export async function smartTranslate(text: string): Promise<string> {
  if (!containsChinese(text)) {
    return text
  }

  const countries = await loadCountries()
  return translateToEnglish(text, countries)
}
