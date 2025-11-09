import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import LayerControl, { LayerConfig } from './components/LayerControl'
import SearchBar from './components/SearchBar'
import InfoCard from './components/InfoCard'
import EditableInfoPanel from './components/EditableInfoPanel'
import UnfoldTransition from './components/UnfoldTransition'
import EventInput from './components/EventInput'
import PerformanceMonitor from './components/PerformanceMonitor'
import MarkerStressTest from './components/MarkerStressTest'
import ClickDebugger from './components/ClickDebugger'
import AdminPanel from './components/AdminPanel'
import ManagementPanel from './components/ManagementPanel'
import UnifiedToolbar from './components/UnifiedToolbar'
import ImageUpload from './components/ImageUpload'
import FontSizeControl from './components/FontSizeControl'
import AnchoredEventPanel, { AnchoredEvent } from './components/AnchoredEventPanel'
import DynamicConnector, { ConnectorLine } from './components/DynamicConnector'
import { City, loadCities } from './utils/cityUtils'
import { TextureConfig, loadTextures } from './types/texture'
import {
  CustomMarker,
  MarkerConnection,
  MarkerInfo,
  generateId
} from './types/customMarker'
import { parseEventText, geocodeEvents } from './utils/eventParser'
import { loadCountries } from './utils/translationUtils'
import { fetchBilibiliVideoInfo } from './utils/bilibiliUtils'
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

  // 模式控制
  const [autoConnect, setAutoConnect] = useState(true) // 自动连接模式（默认开启）
  const [manualConnectMode, setManualConnectMode] = useState(false) // 手动连接模式
  const [firstMarkerForConnect, setFirstMarkerForConnect] = useState<CustomMarker | null>(null)

  // 国家选择状态
  const [selectedCountries, setSelectedCountries] = useState<number[]>([])
  const [countryMarkers, setCountryMarkers] = useState<Map<number, string>>(new Map()) // 国家ID -> 图钉ID

  // 国家上色状态
  const [paintMode, setPaintMode] = useState(false) // 上色模式
  const [selectedColor, setSelectedColor] = useState('#FF6B6B') // 选中的颜色
  const [countryColors, setCountryColors] = useState<Map<number, string>>(new Map()) // 国家ID -> 颜色

  // 锚定事件面板状态
  const [anchoredEvents, setAnchoredEvents] = useState<AnchoredEvent[]>([])
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([])
  const [nextEventSide, setNextEventSide] = useState<'left' | 'right'>('left') // 下一个事件放置的侧边

  // 光照模式
  const [realisticLighting, setRealisticLighting] = useState(false) // 真实光照模式（默认关闭）

  // 底图管理
  const [textures, setTextures] = useState<TextureConfig[]>([])
  const [selectedTexture, setSelectedTexture] = useState<string>('earth_hq')

  // 地图模式（球形/平面）
  const [isFlatMode, setIsFlatMode] = useState(false) // 默认球形模式
  const [isTransitioning, setIsTransitioning] = useState(false) // 切片过渡状态

  // 管理员模式
  const [isAdminMode, setIsAdminMode] = useState(true) // 默认开启，部署时可改为false

  // 面板显示状态
  const [eventInputOpen, setEventInputOpen] = useState(false)
  const [layerControlOpen, setLayerControlOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)
  const [imageUploadOpen, setImageUploadOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [fontSizeOpen, setFontSizeOpen] = useState(false)

  // 字体大小状态
  const [labelFontSize, setLabelFontSize] = useState(20) // 标签字体大小
  const [dollarFontSize, setDollarFontSize] = useState(25) // 美元符号字体大小

  const [flyToCity, setFlyToCity] = useState<{ lon: number; lat: number } | null>(null)

  // 面板切换处理函数
  const handleToggleEventInput = () => setEventInputOpen(!eventInputOpen)
  const handleToggleLayerControl = () => setLayerControlOpen(!layerControlOpen)
  const handleToggleManagement = () => setManagementOpen(!managementOpen)
  const handleToggleImageUpload = () => setImageUploadOpen(!imageUploadOpen)
  const handleToggleAdminPanel = () => setAdminPanelOpen(!adminPanelOpen)
  const handleToggleFontSize = () => setFontSizeOpen(!fontSizeOpen)

  // 监听地图模式切换，触发过渡动画
  useEffect(() => {
    setIsTransitioning(true)
  }, [isFlatMode])

  // 加载城市数据
  useEffect(() => {
    const loadData = async () => {
      const citiesData = await loadCities()
      setCities(citiesData)
      console.log(`✅ Loaded ${citiesData.length} cities for search`)
    }
    loadData()
  }, [])

  // 加载底图列表
  useEffect(() => {
    const loadTextureList = async () => {
      const textureList = await loadTextures()
      setTextures(textureList)
      console.log(`✅ Loaded ${textureList.length} textures`)
    }
    loadTextureList()
  }, [])

  // 预加载国家数据（用于中文翻译）
  useEffect(() => {
    loadCountries() // 预加载，后续搜索时直接使用缓存
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
    // 只有管理员模式才能创建标记
    if (!isAdminMode) {
      console.log('用户模式下无法创建标记')
      return
    }

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

    // 只有在自动连接模式开启时，才自动创建连接线
    if (autoConnect && lastMarker) {
      const newConnection: MarkerConnection = {
        id: generateId(),
        fromMarkerId: lastMarker.id,
        toMarkerId: newMarker.id
      }
      setConnections((prev) => [...prev, newConnection])
    }

    // 更新最后一个标记（用于自动连接）
    setLastMarker(newMarker)
    // 不再自动打开编辑面板，让用户点击图钉后再打开
    // setSelectedMarker(newMarker)
  }

  // 点击国家创建图钉并连接
  const handleCountryClick = (countryInfo: { id: number; name: string; latitude: number; longitude: number }) => {
    // 只有管理员模式才能创建标记
    if (!isAdminMode) {
      console.log('用户模式下无法创建标记')
      return
    }

    console.log('🌍 点击国家:', countryInfo)

    // 检查这个国家是否已经有图钉
    const existingMarkerId = countryMarkers.get(countryInfo.id)

    if (existingMarkerId) {
      // 如果已经有图钉，从选择列表中移除该国家
      setSelectedCountries(prev => prev.filter(id => id !== countryInfo.id))

      // 删除该国家的图钉
      setCustomMarkers(prev => prev.filter(m => m.id !== existingMarkerId))

      // 删除相关的连接线
      setConnections(prev => prev.filter(c =>
        c.fromMarkerId !== existingMarkerId && c.toMarkerId !== existingMarkerId
      ))

      // 从映射中移除
      setCountryMarkers(prev => {
        const newMap = new Map(prev)
        newMap.delete(countryInfo.id)
        return newMap
      })

      console.log(`🗑️ 移除国家 ${countryInfo.name} 的图钉`)
      return
    }

    // 创建新图钉
    const newMarker: CustomMarker = {
      id: generateId(),
      latitude: countryInfo.latitude,
      longitude: countryInfo.longitude,
      info: {
        title: countryInfo.name,
        description: `国家/地区：${countryInfo.name}`,
        links: [],
        images: []
      },
      createdAt: Date.now()
    }

    setCustomMarkers(prev => [...prev, newMarker])

    // 添加到映射
    setCountryMarkers(prev => {
      const newMap = new Map(prev)
      newMap.set(countryInfo.id, newMarker.id)
      return newMap
    })

    // 更新选中的国家列表（永久保留，不删除）
    setSelectedCountries(prev => [...prev, countryInfo.id])

    console.log(`📍 在国家 ${countryInfo.name} 创建永久图钉`)
  }

  // 点击自定义标记
  const handleClickMarker = (marker: CustomMarker) => {
    // 如果在手动连接模式下
    if (manualConnectMode) {
      if (!firstMarkerForConnect) {
        // 选择第一个图钉
        setFirstMarkerForConnect(marker)
      } else if (firstMarkerForConnect.id !== marker.id) {
        // 选择第二个图钉，创建连接
        const newConnection: MarkerConnection = {
          id: generateId(),
          fromMarkerId: firstMarkerForConnect.id,
          toMarkerId: marker.id
        }

        // 检查是否已存在连接
        const connectionExists = connections.some(
          c => (c.fromMarkerId === firstMarkerForConnect.id && c.toMarkerId === marker.id) ||
               (c.fromMarkerId === marker.id && c.toMarkerId === firstMarkerForConnect.id)
        )

        if (!connectionExists) {
          setConnections((prev) => [...prev, newConnection])
        }

        // 重置选择
        setFirstMarkerForConnect(null)
      }
    } else {
      // 普通模式：激活锚定事件面板
      handleActivateEvent(marker)
      setSelectedCity(null) // 关闭城市信息卡
    }
  }

  // 激活锚定事件（允许同一图钉创建多个事件卡）
  const handleActivateEvent = (marker: CustomMarker) => {
    // 创建新的锚定事件（只保存标记ID）
    const newEvent: AnchoredEvent = {
      id: `event-${marker.id}-${Date.now()}`,
      markerId: marker.id,  // 只保存ID，不保存整个对象
      side: nextEventSide,
    }

    setAnchoredEvents(prev => [...prev, newEvent])

    // 切换下一个事件的侧边
    setNextEventSide(prev => prev === 'left' ? 'right' : 'left')
  }

  // 停用锚定事件
  const handleDeactivateEvent = (eventId: string) => {
    setAnchoredEvents(prev => prev.filter(e => e.id !== eventId))
  }

  // 更新连接线坐标
  const handleConnectorLinesUpdate = (lines: ConnectorLine[]) => {
    setConnectorLines(lines)
  }

  // 编辑事件详情
  const handleEditEventDetails = (marker: CustomMarker) => {
    setSelectedMarker(marker)
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

  // 删除标记（通过ID，用于管理面板）
  const handleDeleteMarkerById = (markerId: string) => {
    // 删除标记
    setCustomMarkers((prev) => prev.filter((m) => m.id !== markerId))

    // 删除与此标记相关的连接线
    setConnections((prev) =>
      prev.filter(
        (c) => c.fromMarkerId !== markerId && c.toMarkerId !== markerId
      )
    )

    // 如果这是最后一个标记，清除
    if (lastMarker?.id === markerId) {
      setLastMarker(null)
    }

    // 如果这是选中的标记，清除选中状态
    if (selectedMarker?.id === markerId) {
      setSelectedMarker(null)
    }
  }

  // 删除连接（用于管理面板）
  const handleDeleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId))
  }

  // 处理标签拖动
  const handleLabelDrag = (markerId: string, offset: { x: number; y: number }) => {
    setCustomMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, labelOffset: offset } : m
      )
    )
  }

  // 处理连接线标签修改
  const handleConnectionLabelChange = (connectionId: string, newLabel: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, label: newLabel } : c
      )
    )
  }

  // 切换自动连接模式（与手动连接互斥）
  const handleToggleAutoConnect = () => {
    const newAutoConnect = !autoConnect
    setAutoConnect(newAutoConnect)

    // 开启自动连接时，关闭手动连接
    if (newAutoConnect) {
      setManualConnectMode(false)
      setFirstMarkerForConnect(null)
    }

    // 关闭自动连接时，清除最后一个标记
    if (!newAutoConnect) {
      setLastMarker(null)
    }
  }

  // 切换手动连接模式（与自动连接互斥）
  const handleToggleManualConnect = () => {
    const newManualConnect = !manualConnectMode
    setManualConnectMode(newManualConnect)

    // 开启手动连接时，关闭自动连接
    if (newManualConnect) {
      setAutoConnect(false)
      setLastMarker(null)
    }

    setFirstMarkerForConnect(null) // 重置选择
    if (!newManualConnect) {
      setSelectedMarker(null) // 退出手动连接模式时关闭信息面板
    }
  }

  // 切换上色模式
  const handleTogglePaintMode = () => {
    setPaintMode(!paintMode)
  }

  // 更改选中的颜色
  const handleColorChange = (color: string) => {
    setSelectedColor(color)
  }

  // 国家上色
  const handleCountryPaint = (countryId: number, color: string) => {
    setCountryColors(prev => {
      const newMap = new Map(prev)
      newMap.set(countryId, color)
      return newMap
    })
    console.log(`🎨 国家 ${countryId} 上色为 ${color}`)
  }

  // 批量创建事件
  const handleCreateEvents = async (eventText: string) => {
    console.log('📝 开始批量创建事件...')

    // 解析事件文本
    const events = parseEventText(eventText)
    if (events.length === 0) {
      console.warn('⚠️ 没有解析到任何事件')
      return
    }

    console.log(`📊 解析到 ${events.length} 个事件`)

    // 地理编码（支持中文地名）
    const { markers: geocodedMarkers, connections: geocodedConnections } = await geocodeEvents(
      events,
      cities
    )

    console.log(`📍 地理编码结果: ${geocodedMarkers.length} 个标记, ${geocodedConnections.length} 个连接`)

    // 创建标记（从独立图钉）
    const newMarkers: CustomMarker[] = []

    for (const gm of geocodedMarkers) {
      let videoInfo = undefined

      // 如果有B站视频链接，自动获取视频信息
      if (gm.videoUrl) {
        console.log(`📺 正在获取B站视频信息: ${gm.videoUrl}`)
        videoInfo = await fetchBilibiliVideoInfo(gm.videoUrl)
        if (videoInfo) {
          console.log(`✅ 成功获取视频: ${videoInfo.title}`)
        }
      }

      newMarkers.push({
        id: generateId(),
        latitude: gm.latitude,
        longitude: gm.longitude,
        info: {
          title: videoInfo?.title || gm.title,
          description: gm.description,
          links: [],
          images: [],
          videoInfo: videoInfo || undefined
        },
        createdAt: Date.now()
      })
    }

    // 创建连接线的标记
    const connectionMarkerMap = new Map<string, CustomMarker>()

    const newConnections: MarkerConnection[] = geocodedConnections.map(gc => {
      // 为每个连接的端点创建或复用标记
      const key1 = `${gc.marker1.latitude},${gc.marker1.longitude}`
      const key2 = `${gc.marker2.latitude},${gc.marker2.longitude}`

      if (!connectionMarkerMap.has(key1)) {
        connectionMarkerMap.set(key1, {
          id: generateId(),
          latitude: gc.marker1.latitude,
          longitude: gc.marker1.longitude,
          info: {
            title: gc.marker1.title,
            description: gc.marker1.description,
            links: [],
            images: []
          },
          createdAt: Date.now()
        })
      }

      if (!connectionMarkerMap.has(key2)) {
        connectionMarkerMap.set(key2, {
          id: generateId(),
          latitude: gc.marker2.latitude,
          longitude: gc.marker2.longitude,
          info: {
            title: gc.marker2.title,
            description: gc.marker2.description,
            links: [],
            images: []
          },
          createdAt: Date.now()
        })
      }

      const marker1 = connectionMarkerMap.get(key1)!
      const marker2 = connectionMarkerMap.get(key2)!

      return {
        id: generateId(),
        fromMarkerId: marker1.id,
        toMarkerId: marker2.id,
        eventInfo: {
          eventName: gc.marker1.title,
          time: gc.marker1.time,
          relationship: gc.relationship
        }
      }
    })

    // 合并所有标记
    const allNewMarkers = [...newMarkers, ...Array.from(connectionMarkerMap.values())]

    // 添加到状态
    setCustomMarkers(prev => [...prev, ...allNewMarkers])
    setConnections(prev => [...prev, ...newConnections])

    console.log(`✅ 成功创建 ${allNewMarkers.length} 个标记和 ${newConnections.length} 个连接`)
  }

  // 处理生成测试标记
  const handleGenerateTestMarkers = (markers: CustomMarker[]) => {
    setCustomMarkers(markers)
    setConnections([]) // 清除连接线
    setLastMarker(null)
    setSelectedMarker(null)
  }

  // 导入数据
  const handleImportData = (data: { markers: CustomMarker[], connections: MarkerConnection[] }) => {
    setCustomMarkers(data.markers)
    setConnections(data.connections)
    setLastMarker(null)
    setSelectedMarker(null)
    setFirstMarkerForConnect(null)
  }

  // 切换管理员模式
  const handleToggleAdminMode = () => {
    setIsAdminMode(!isAdminMode)
    if (isAdminMode) {
      // 切换到用户模式时，关闭所有编辑面板
      setSelectedMarker(null)
      setManualConnectMode(false)
      setFirstMarkerForConnect(null)
    }
  }

  // 处理图片上传
  const handleImageUpload = (imageUrl: string) => {
    if (!selectedMarker) {
      console.warn('⚠️ 没有选中的标记，无法上传图片')
      return
    }

    // 创建图片对象
    const newImage = {
      id: generateId(),
      url: imageUrl,
      alt: `图片 ${selectedMarker.info.images.length + 1}`
    }

    // 添加图片到当前选中的标记
    const updatedInfo: MarkerInfo = {
      ...selectedMarker.info,
      images: [...selectedMarker.info.images, newImage]
    }

    handleSaveMarkerInfo(updatedInfo)
  }

  // 获取当前选中的底图路径
  const currentTexturePath = textures.find(t => t.id === selectedTexture)?.path

  return (
    <div className="app">
      <Canvas camera={{ position: isFlatMode ? [0, 0, 5] : [0, 0, 3], fov: 45 }}>
        <Scene
          layers={layers}
          cityMarkers={cityMarkers}
          customMarkers={customMarkers}
          connections={connections}
          onCityMarkerClick={handleSelectCity}
          onCustomMarkerClick={handleClickMarker}
          onDoubleClick={handleDoubleClick}
          flyToCity={flyToCity}
          manualConnectMode={manualConnectMode}
          selectedMarkerForConnect={firstMarkerForConnect}
          realisticLighting={realisticLighting}
          texturePath={currentTexturePath}
          isFlatMode={isFlatMode}
          useOptimizedRendering={true}
          onLabelDrag={handleLabelDrag}
          onConnectionLabelChange={handleConnectionLabelChange}
          labelFontSize={labelFontSize}
          dollarFontSize={dollarFontSize}
          onCountryClick={handleCountryClick}
          selectedCountries={selectedCountries}
          paintMode={paintMode}
          selectedColor={selectedColor}
          countryColors={countryColors}
          onCountryPaint={handleCountryPaint}
          anchoredEvents={anchoredEvents}
          onConnectorLinesUpdate={handleConnectorLinesUpdate}
        />
      </Canvas>

      {/* 动态连接线覆盖层 */}
      <DynamicConnector lines={connectorLines} />

      {/* 锚定事件面板 - 左侧 */}
      <AnchoredEventPanel
        events={anchoredEvents}
        markers={customMarkers}
        side="left"
        onClose={handleDeactivateEvent}
        onEdit={handleEditEventDetails}
      />

      {/* 锚定事件面板 - 右侧 */}
      <AnchoredEventPanel
        events={anchoredEvents}
        markers={customMarkers}
        side="right"
        onClose={handleDeactivateEvent}
        onEdit={handleEditEventDetails}
      />

      {/* 性能监控面板 - 在Canvas外部 */}
      <PerformanceMonitor />

      {/* 搜索栏 - 支持中文搜索 */}
      <SearchBar cities={cities} onSelectCity={handleSelectCity} />

      {/* 统一工具栏 - 仅管理员模式 */}
      {isAdminMode && (
        <UnifiedToolbar
          isAdminMode={isAdminMode}
          onToggleEventInput={handleToggleEventInput}
          onToggleManualConnect={handleToggleManualConnect}
          onToggleAutoConnect={handleToggleAutoConnect}
          onToggleLayerControl={handleToggleLayerControl}
          onToggleManagement={handleToggleManagement}
          onToggleImageUpload={handleToggleImageUpload}
          onToggleAdminPanel={handleToggleAdminPanel}
          onToggleFontSize={handleToggleFontSize}
          onTogglePaintMode={handleTogglePaintMode}
          autoConnectEnabled={autoConnect}
          manualConnectEnabled={manualConnectMode}
          paintModeEnabled={paintMode}
          eventInputOpen={eventInputOpen}
          layerControlOpen={layerControlOpen}
          managementOpen={managementOpen}
          imageUploadOpen={imageUploadOpen}
          adminPanelOpen={adminPanelOpen}
          fontSizeOpen={fontSizeOpen}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
        />
      )}

      {/* 图层控制面板 */}
      {layerControlOpen && (
        <LayerControl
          layers={layers}
          onLayerToggle={handleLayerToggle}
          realisticLighting={realisticLighting}
          onLightingToggle={() => setRealisticLighting(!realisticLighting)}
          textures={textures}
          selectedTexture={selectedTexture}
          onTextureChange={setSelectedTexture}
          isFlatMode={isFlatMode}
          onMapModeToggle={() => setIsFlatMode(!isFlatMode)}
        />
      )}

      {/* 城市信息卡片 */}
      <InfoCard city={selectedCity} onClose={() => setSelectedCity(null)} />

      {/* 自定义标记信息面板 - 只有管理员模式才能编辑 */}
      {selectedMarker && !manualConnectMode && isAdminMode && (
        <EditableInfoPanel
          marker={selectedMarker}
          onSave={handleSaveMarkerInfo}
          onClose={() => setSelectedMarker(null)}
          onDelete={handleDeleteMarker}
        />
      )}

      {/* 批量事件创建面板 */}
      {eventInputOpen && isAdminMode && (
        <EventInput onCreateEvents={handleCreateEvents} />
      )}

      {/* 管理面板 - 管理图钉和连接 */}
      {managementOpen && isAdminMode && (
        <ManagementPanel
          customMarkers={customMarkers}
          connections={connections}
          onDeleteMarker={handleDeleteMarkerById}
          onDeleteConnection={handleDeleteConnection}
          onSelectMarker={setSelectedMarker}
          onClose={() => setManagementOpen(false)}
        />
      )}

      {/* 图片上传面板 */}
      {imageUploadOpen && isAdminMode && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={() => setImageUploadOpen(false)}
        />
      )}

      {/* 压力测试工具 - 仅管理员模式 */}
      {isAdminMode && <MarkerStressTest onGenerateMarkers={handleGenerateTestMarkers} />}

      {/* 点击调试工具 - 仅管理员模式 */}
      {isAdminMode && <ClickDebugger />}

      {/* 管理员面板 */}
      {adminPanelOpen && (
        <AdminPanel
          isAdminMode={isAdminMode}
          onToggleAdminMode={handleToggleAdminMode}
          customMarkers={customMarkers}
          connections={connections}
          onImportData={handleImportData}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}

      {/* 字体大小控制面板 */}
      {fontSizeOpen && isAdminMode && (
        <FontSizeControl
          labelFontSize={labelFontSize}
          dollarFontSize={dollarFontSize}
          onLabelFontSizeChange={setLabelFontSize}
          onDollarFontSizeChange={setDollarFontSize}
          onClose={() => setFontSizeOpen(false)}
        />
      )}

      {/* 球形展开/收缩过渡效果 */}
      <UnfoldTransition
        isTransitioning={isTransitioning}
        toFlatMode={isFlatMode}
        duration={600}
      />
    </div>
  )
}

export default App
