import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import LayerControl, { LayerConfig } from './components/LayerControl'
import SearchBar from './components/SearchBar'
import InfoCard from './components/InfoCard'
import { City, loadCities } from './utils/cityUtils'
import './App.css'

function App() {
  // 图层配置
  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: 'countries',
      name: '国界 (110m)',
      shpPath: '/shapefiles/ne_110m_admin_0_countries.shp',
      color: '#FFD700',
      visible: true,
    },
  ])

  // 城市数据
  const [cities, setCities] = useState<City[]>([])
  const [markers, setMarkers] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [flyToCity, setFlyToCity] = useState<{ lon: number; lat: number } | null>(null)

  // 加载城市数据
  useEffect(() => {
    const loadData = async () => {
      const citiesData = await loadCities()
      setCities(citiesData)
      console.log(`✅ Loaded ${citiesData.length} cities for search`)
    }
    loadData()
  }, [])

  // 切换图层显示状态
  const handleLayerToggle = (layerId: string) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
  }

  // 选择城市（从搜索栏或标记点击）
  const handleSelectCity = (city: City) => {
    setSelectedCity(city)
    setFlyToCity({
      lon: parseFloat(city.longitude),
      lat: parseFloat(city.latitude),
    })

    // 添加到标记列表（如果不存在）
    setMarkers((prev) => {
      if (prev.find((m) => m.id === city.id)) {
        return prev
      }
      return [...prev, city]
    })

    // 清除飞行目标（防止重复触发）
    setTimeout(() => setFlyToCity(null), 100)
  }

  return (
    <div className="app">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Scene
          layers={layers}
          markers={markers}
          onMarkerClick={handleSelectCity}
          flyToCity={flyToCity}
        />
      </Canvas>

      {/* 搜索栏 */}
      <SearchBar cities={cities} onSelectCity={handleSelectCity} />

      {/* 左上角信息 */}
      <div className="info">
        <h1>MapMap - 3D 地球</h1>
        <p>鼠标拖动旋转 | 滚轮缩放</p>
      </div>

      {/* 图层控制面板 */}
      <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />

      {/* 城市信息卡片 */}
      <InfoCard city={selectedCity} onClose={() => setSelectedCity(null)} />
    </div>
  )
}

export default App
