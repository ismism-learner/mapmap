import { useState } from 'react'
import { CustomMarker, generateId } from '../types/customMarker'

interface MarkerStressTestProps {
  onGenerateMarkers: (markers: CustomMarker[]) => void
}

/**
 * 标记压力测试工具
 *
 * 用于生成大量标记以测试渲染性能
 */
function MarkerStressTest({ onGenerateMarkers }: MarkerStressTestProps) {
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(1000)
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * 生成随机分布的标记
   */
  const generateRandomMarkers = (numMarkers: number): CustomMarker[] => {
    const markers: CustomMarker[] = []

    for (let i = 0; i < numMarkers; i++) {
      // 随机经纬度
      const latitude = (Math.random() * 180) - 90  // -90 到 90
      const longitude = (Math.random() * 360) - 180 // -180 到 180

      markers.push({
        id: generateId(),
        latitude,
        longitude,
        info: {
          title: `测试标记 ${i + 1}`,
          description: `这是一个用于性能测试的标记，编号：${i + 1}`,
          links: [],
          images: []
        },
        createdAt: Date.now()
      })
    }

    return markers
  }

  /**
   * 生成聚集分布的标记（模拟真实场景）
   */
  const generateClusteredMarkers = (numMarkers: number): CustomMarker[] => {
    const markers: CustomMarker[] = []
    const numClusters = Math.floor(numMarkers / 50) // 每50个标记一个聚集中心
    const clusters = []

    // 生成聚集中心点
    for (let i = 0; i < numClusters; i++) {
      clusters.push({
        lat: (Math.random() * 180) - 90,
        lon: (Math.random() * 360) - 180,
        radius: 5 + Math.random() * 15 // 聚集半径 5-20度
      })
    }

    // 在每个聚集中心周围生成标记
    for (let i = 0; i < numMarkers; i++) {
      const cluster = clusters[i % clusters.length]

      // 在聚集中心周围随机分布
      const angle = Math.random() * 2 * Math.PI
      const distance = Math.random() * cluster.radius

      const latitude = cluster.lat + (distance * Math.sin(angle))
      const longitude = cluster.lon + (distance * Math.cos(angle))

      // 确保在有效范围内
      const clampedLat = Math.max(-90, Math.min(90, latitude))
      const clampedLon = ((longitude + 180) % 360) - 180

      markers.push({
        id: generateId(),
        latitude: clampedLat,
        longitude: clampedLon,
        info: {
          title: `标记 ${i + 1}`,
          description: `聚集 ${(i % clusters.length) + 1}`,
          links: [],
          images: []
        },
        createdAt: Date.now()
      })
    }

    return markers
  }

  /**
   * 处理生成随机标记
   */
  const handleGenerateRandom = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const markers = generateRandomMarkers(count)
      onGenerateMarkers(markers)
      setIsGenerating(false)
      console.log(`✅ 生成了 ${count} 个随机分布的标记`)
    }, 100)
  }

  /**
   * 处理生成聚集标记
   */
  const handleGenerateClustered = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const markers = generateClusteredMarkers(count)
      onGenerateMarkers(markers)
      setIsGenerating(false)
      console.log(`✅ 生成了 ${count} 个聚集分布的标记`)
    }, 100)
  }

  if (!visible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '70px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        onClick={() => setVisible(true)}
      >
        🧪 压力测试
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '70px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '13px',
        minWidth: '250px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <strong>🧪 标记压力测试</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            lineHeight: '1',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          标记数量：
        </label>
        <input
          type="number"
          min="1"
          max="10000"
          step="100"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1000)}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '13px',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleGenerateRandom}
          disabled={isGenerating}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? '生成中...' : '生成随机分布'}
        </button>

        <button
          onClick={handleGenerateClustered}
          disabled={isGenerating}
          style={{
            background: '#8b5cf6',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? '生成中...' : '生成聚集分布'}
        </button>
      </div>

      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        💡 提示：
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          <li>建议从100开始测试</li>
          <li>观察Shift+P性能监控</li>
          <li>聚集分布更接近真实场景</li>
        </ul>
      </div>
    </div>
  )
}

export default MarkerStressTest
