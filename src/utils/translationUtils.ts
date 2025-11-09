/**
 * 翻译工具
 * 加载和管理中英文地名翻译
 */

export interface TranslationData {
  countries: Record<string, string>
  states: Record<string, string>
  cities: Record<string, string>
}

let translationData: TranslationData | null = null

/**
 * 加载翻译数据
 */
export async function loadTranslations(): Promise<TranslationData> {
  if (translationData) {
    return translationData
  }

  try {
    const response = await fetch('/locales/zh-CN.json')
    if (!response.ok) {
      throw new Error(`Failed to fetch translations: ${response.status}`)
    }
    translationData = await response.json()
    console.log(`✅ 加载翻译数据成功`)
    return translationData!
  } catch (error) {
    console.error('❌ 加载翻译数据失败:', error)
    // 返回空翻译数据
    return {
      countries: {},
      states: {},
      cities: {}
    }
  }
}

/**
 * 将中文翻译为英文
 */
export function translateToEnglish(
  chineseText: string,
  translations: TranslationData
): string | null {
  // 尝试从国家翻译
  if (translations.countries[chineseText]) {
    return translations.countries[chineseText]
  }

  // 尝试从州/省翻译
  if (translations.states[chineseText]) {
    return translations.states[chineseText]
  }

  // 尝试从城市翻译
  if (translations.cities[chineseText]) {
    return translations.cities[chineseText]
  }

  // 如果没有找到翻译，返回原文
  return null
}

/**
 * 检测文本是否包含中文字符
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

/**
 * 智能翻译地点名称
 * 如果是中文，翻译为英文；如果是英文，保持不变
 */
export function smartTranslate(
  locationName: string,
  translations: TranslationData
): string {
  const trimmed = locationName.trim()

  // 如果包含中文，尝试翻译
  if (containsChinese(trimmed)) {
    const translated = translateToEnglish(trimmed, translations)
    if (translated) {
      console.log(`🔄 翻译: "${trimmed}" -> "${translated}"`)
      return translated
    }
  }

  // 返回原文
  return trimmed
}
