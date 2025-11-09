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
 * 使用 CORS 代理绕过浏览器跨域限制
 */
export async function fetchBilibiliVideoInfo(urlOrBVID: string): Promise<BilibiliVideoInfo | null> {
  try {
    const bvid = extractBVID(urlOrBVID)
    if (!bvid) {
      console.error('❌ 无效的B站视频链接')
      return null
    }

    // 使用 CORS 代理访问B站API
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`

    console.log(`🔄 正在获取视频信息: ${bvid}`)

    const response = await fetch(corsProxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code !== 0) {
      console.error('❌ B站API返回错误:', result.message)

      // 降级方案：返回基本信息，让用户后续编辑
      return {
        bvid: bvid,
        title: `视频 ${bvid}（请编辑标题）`,
        cover: 'https://via.placeholder.com/200x120/000000/FFFFFF?text=Bilibili+Video',
        author: '未知UP主',
        url: `https://www.bilibili.com/video/${bvid}`
      }
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

    // 降级方案：CORS 失败时返回基本信息
    const bvid = extractBVID(urlOrBVID)
    if (bvid) {
      console.warn('⚠️ 使用降级方案：请手动编辑视频信息')
      return {
        bvid: bvid,
        title: `视频 ${bvid}（请编辑标题）`,
        cover: 'https://via.placeholder.com/200x120/1f1f1f/00a1d6?text=Bilibili',
        author: '请编辑UP主',
        url: `https://www.bilibili.com/video/${bvid}`
      }
    }

    return null
  }
}

/**
 * 检查是否是B站视频链接
 */
export function isBilibiliURL(url: string): boolean {
  return /bilibili\.com\/video\/|b23\.tv\/|^[Bb][Vv][A-Za-z0-9]+$/.test(url)
}
