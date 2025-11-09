import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import LayerControl, { LayerConfig } from './components/LayerControl'
import SearchBar from './components/SearchBar'
import InfoCard from './components/InfoCard'
import EditableInfoPanel from './components/EditableInfoPanel'
import { City, loadCities } from './utils/cityUtils'
import {
  CustomMarker,
  MarkerConnection,
  MarkerInfo,
  generateId
} from './types/customMarker'
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

  // 城市数据（搜索功能）
  const [cities, setCities] = useState<City[]>([])
  const [cityMarkers, setCityMarkers] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  // 自定义标记数据
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([])
  const [connections, setConnections] = useState<MarkerConnection[]>([])
  const [selectedMarker, setSelectedMarker] = useState<CustomMarker | null>(null)
  const [lastMarker, setLastMarker] = useState<CustomMarker | null>(null)

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

  // 选择城市（从搜索栏）
  const handleSelectCity = (city: City) => {
    setSelectedCity(city)
    setFlyToCity({
      lon: parseFloat(city.longitude),
      lat: parseFloat(city.latitude),
    })

    // 添加到城市标记列表（如果不存在）
    setCityMarkers((prev) => {
      if (prev.find((m) => m.id === city.id)) {
        return prev
      }
      return [...prev, city]
    })

    // 清除飞行目标（防止重复触发）
    setTimeout(() => setFlyToCity(null), 100)
  }

  // 双击地球放置自定义标记
  const handleDoubleClick = (latitude: number, longitude: number) => {
    const newMarker: CustomMarker = {
      id: generateId(),
      latitude,
      longitude,
      info: {
        title: '新标记',
        description: '',
        links: [],
        images: []
      },
      createdAt: Date.now()
    }

    setCustomMarkers((prev) => [...prev, newMarker])

    // 如果有上一个标记，创建连接线
    if (lastMarker) {
      const newConnection: MarkerConnection = {
        id: generateId(),
        fromMarkerId: lastMarker.id,
        toMarkerId: newMarker.id
      }
      setConnections((prev) => [...prev, newConnection])
    }

    setLastMarker(newMarker)
    setSelectedMarker(newMarker)

    // 飞到新标记位置
    setFlyToCity({ lon: longitude, lat: latitude })
    setTimeout(() => setFlyToCity(null), 100)
  }

  // 点击自定义标记
  const handleClickMarker = (marker: CustomMarker) => {
    setSelectedMarker(marker)
    setSelectedCity(null) // 关闭城市信息卡
  }

  // 保存标记信息
  const handleSaveMarkerInfo = (updatedInfo: MarkerInfo) => {
    if (!selectedMarker) return

    setCustomMarkers((prev) =>
      prev.map((m) =>
        m.id === selectedMarker.id ? { ...m, info: updatedInfo } : m
      )
    )

    setSelectedMarker((prev) =>
      prev ? { ...prev, info: updatedInfo } : null
    )
  }

  // 删除自定义标记
  const handleDeleteMarker = () => {
    if (!selectedMarker) return

    // 删除标记
    setCustomMarkers((prev) => prev.filter((m) => m.id !== selectedMarker.id))

    // 删除与此标记相关的连接线
    setConnections((prev) =>
      prev.filter(
        (c) => c.fromMarkerId !== selectedMarker.id && c.toMarkerId !== selectedMarker.id
      )
    )

    // 如果这是最后一个标记，清除
    if (lastMarker?.id === selectedMarker.id) {
      setLastMarker(null)
    }

    setSelectedMarker(null)
  }

  return (
    <div className="app">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Scene
          layers={layers}
          cityMarkers={cityMarkers}
          customMarkers={customMarkers}
          connections={connections}
          onCityMarkerClick={handleSelectCity}
          onCustomMarkerClick={handleClickMarker}
          onDoubleClick={handleDoubleClick}
          flyToCity={flyToCity}
        />
      </Canvas>

      {/* 搜索栏 */}
      <SearchBar cities={cities} onSelectCity={handleSelectCity} />

      {/* 左上角信息 */}
      <div className="info">
        <h1>MapMap - 3D 地球</h1>
        <p>鼠标拖动旋转 | 滚轮缩放 | 双击放置图钉</p>
      </div>

      {/* 图层控制面板 */}
      <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />

      {/* 城市信息卡片 */}
      <InfoCard city={selectedCity} onClose={() => setSelectedCity(null)} />

      {/* 自定义标记信息面板 */}
      {selectedMarker && (
        <EditableInfoPanel
          marker={selectedMarker}
          onSave={handleSaveMarkerInfo}
          onClose={() => setSelectedMarker(null)}
          onDelete={handleDeleteMarker}
        />
      )}
    </div>
  )
}

export default App
