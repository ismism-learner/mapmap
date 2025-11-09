/**
 * B站视频信息
 */
export interface BilibiliVideoInfo {
  bvid: string
  title: string
  cover: string
  author: string
  url: string
}

/**
 * 从B站视频链接中提取BV号
 */
export function extractBVID(url: string): string | null {
  // 支持多种B站链接格式
  const patterns = [
    /(?:bilibili\.com\/video\/)([Bb][Vv][A-Za-z0-9]+)/,  // https://www.bilibili.com/video/BVxxx
    /(?:b23\.tv\/)([A-Za-z0-9]+)/,                        // 短链接 b23.tv/xxx
    /^([Bb][Vv][A-Za-z0-9]+)$/                            // 直接BV号
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      let bvid = match[1]
      // 确保BV号大写开头
      if (!bvid.startsWith('BV')) {
        bvid = 'BV' + bvid.substring(2)
      }
      return bvid
    }
  }

  return null
}

/**
 * 获取B站视频信息
 */
export async function fetchBilibiliVideoInfo(urlOrBVID: string): Promise<BilibiliVideoInfo | null> {
  try {
    const bvid = extractBVID(urlOrBVID)
    if (!bvid) {
      console.error('❌ 无效的B站视频链接')
      return null
    }

    // 使用B站API获取视频信息
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`

    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code !== 0) {
      console.error('❌ B站API返回错误:', result.message)
      return null
    }

    const data = result.data

    return {
      bvid: data.bvid,
      title: data.title,
      cover: data.pic, // 封面图片URL
      author: data.owner.name,
      url: `https://www.bilibili.com/video/${data.bvid}`
    }
  } catch (error) {
    console.error('❌ 获取B站视频信息失败:', error)
    return null
  }
}

/**
 * 检查是否是B站视频链接
 */
export function isBilibiliURL(url: string): boolean {
  return /bilibili\.com\/video\/|b23\.tv\/|^[Bb][Vv][A-Za-z0-9]+$/.test(url)
}
