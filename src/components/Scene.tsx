import { useRef, useState, useCallback, memo } from 'react'
import { Mesh } from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe from './Globe'
import FlatMap from './FlatMap'
import FlatMapControls from './FlatMapControls'
import InteractiveBoundary from './InteractiveBoundary'
import Marker from './Marker'
import Pushpin from './Pushpin'
import OptimizedMarkers from './OptimizedMarkers'
import MarkerConnector from './MarkerConnector'
import ConnectorCalculator from './ConnectorCalculator'
import { LayerConfig } from './LayerControl'
import { City } from '../utils/cityUtils'
import { CustomMarker, MarkerConnection } from '../types/customMarker'
import { useCameraControls } from '../hooks/useCameraControls'
import { vector3ToLonLat } from '../utils/geoUtils'
import { AnchoredEvent } from './AnchoredEventPanel'
import { ConnectorLine } from './DynamicConnector'

interface SceneProps {
  layers: LayerConfig[]
  cityMarkers: City[]
  customMarkers: CustomMarker[]
  connections: MarkerConnection[]
  onCityMarkerClick: (city: City) => void
  onCustomMarkerClick: (marker: CustomMarker) => void
  onDoubleClick: (latitude: number, longitude: number) => void
  flyToCity: { lon: number; lat: number } | null
  manualConnectMode?: boolean
  selectedMarkerForConnect?: CustomMarker | null
  realisticLighting?: boolean
  texturePath?: string
  isFlatMode?: boolean
  useOptimizedRendering?: boolean
  onLabelDrag?: (markerId: string, offset: { x: number; y: number }) => void
  onConnectionLabelChange?: (connectionId: string, newLabel: string) => void
  labelFontSize?: number
  dollarFontSize?: number
  paintMode?: boolean
  selectedColor?: string
  countryColors?: Map<number, string>
  onCountryPaint?: (countryId: number, color: string) => void
  anchoredEvents?: AnchoredEvent[]
  onConnectorLinesUpdate?: (lines: ConnectorLine[]) => void
}

function Scene({
  layers,
  cityMarkers,
  customMarkers,
  connections,
  onCityMarkerClick,
  onCustomMarkerClick,
  onDoubleClick,
  flyToCity,
  manualConnectMode = false,
  selectedMarkerForConnect = null,
  realisticLighting = false,
  texturePath,
  isFlatMode = false,
  useOptimizedRendering = true,
  onLabelDrag,
  onConnectionLabelChange,
  labelFontSize = 20,
  dollarFontSize = 25,
  paintMode = false,
  selectedColor = '#FF6B6B',
  countryColors = new Map(),
  onCountryPaint,
  anchoredEvents = [],
  onConnectorLinesUpdate
}: SceneProps) {
  const { flyTo } = useCameraControls()
  const globeRef = useRef<Mesh>(null)

  // 相机移动状态检测（性能优化：移动时隐藏连接线）
  const [isCameraMoving, setIsCameraMoving] = useState(false)
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 拖动开始：立即隐藏连接线
  const handleCameraStart = useCallback(() => {
    setIsCameraMoving(true)
    // 立即清空连接线，避免移动时的计算和渲染
    if (onConnectorLinesUpdate) {
      onConnectorLinesUpdate([])
    }
    // 清除之前的定时器
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
    }
  }, [onConnectorLinesUpdate])

  // 相机变化处理：持续移动时重置定时器
  const handleCameraChange = useCallback(() => {
    // 确保移动状态
    if (!isCameraMoving) {
      setIsCameraMoving(true)
      if (onConnectorLinesUpdate) {
        onConnectorLinesUpdate([])
      }
    }

    // 清除之前的定时器
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
    }

    // 100ms后如果没有新的移动，则认为已停止（延长延迟避免闪烁）
    moveTimeoutRef.current = setTimeout(() => {
      setIsCameraMoving(false)
    }, 100)
  }, [isCameraMoving, onConnectorLinesUpdate])

  // 当 flyToCity 改变时，执行相机动画
  if (flyToCity && !isFlatMode) {
    flyTo(flyToCity.lon, flyToCity.lat, 1.5)
  }

  // 处理双击地球事件（球形模式）
  const handleGlobeDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    // 获取点击点的世界坐标
    const point = event.point

    // 将3D坐标转换为经纬度
    const { latitude, longitude } = vector3ToLonLat(point.x, point.y, point.z)

    onDoubleClick(latitude, longitude)
  }

  // 处理双击平面地图事件（平面模式）
  const handleFlatMapDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    // 获取点击点的世界坐标
    const point = event.point

    // 平面地图坐标转换为经纬度
    // 默认地图尺寸: width=4, height=2
    const mapWidth = 4
    const mapHeight = 2
    const longitude = (point.x / (mapWidth / 2)) * 180
    const latitude = (point.y / (mapHeight / 2)) * 90

    onDoubleClick(latitude, longitude)
  }

  return (
    <>
      {/* 光照系统 */}
      {realisticLighting ? (
        <>
          {/* 真实光照模式：模拟太阳光 */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 3, 5]} intensity={1.2} />
        </>
      ) : (
        <>
          {/* 均匀光照模式：从多个方向均匀照射 */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 5, 0]} intensity={0.4} />
          <directionalLight position={[5, 0, 0]} intensity={0.2} />
          <directionalLight position={[-5, 0, 0]} intensity={0.2} />
          <directionalLight position={[0, 0, 5]} intensity={0.2} />
          <directionalLight position={[0, 0, -5]} intensity={0.2} />
        </>
      )}

      {/* 地球/平面地图组件 - 添加双击事件 */}
      {isFlatMode ? (
        <mesh ref={globeRef} onDoubleClick={handleFlatMapDoubleClick}>
          <FlatMap texturePath={texturePath} />
        </mesh>
      ) : (
        <mesh ref={globeRef} onDoubleClick={handleGlobeDoubleClick}>
          <Globe texturePath={texturePath} />
        </mesh>
      )}

      {/* 交互式边界线图层 */}
      {layers.map((layer) => (
        <InteractiveBoundary
          key={layer.id}
          shpPath={layer.shpPath}
          color={layer.color}
          visible={layer.visible}
          isFlat={isFlatMode}
          paintMode={paintMode}
          selectedColor={selectedColor}
          countryColors={countryColors}
          onCountryPaint={onCountryPaint}
        />
      ))}

      {/* 标记渲染 - 支持优化和传统两种模式 */}
      {useOptimizedRendering ? (
        /* 优化渲染模式：使用InstancedMesh批量渲染 */
        <OptimizedMarkers
          customMarkers={customMarkers}
          cityMarkers={cityMarkers}
          onCustomMarkerClick={onCustomMarkerClick}
          onCityMarkerClick={onCityMarkerClick}
          isFlat={isFlatMode}
          selectedMarkerId={selectedMarkerForConnect?.id}
          globeRef={globeRef}
        />
      ) : (
        <>
          {/* 传统渲染模式：独立组件渲染 */}
          {/* 城市标记（搜索功能） */}
          {cityMarkers.map((city) => (
            <Marker key={city.id} city={city} onClick={onCityMarkerClick} />
          ))}

          {/* 自定义图钉标记 */}
          {customMarkers.map((marker) => {
            const isSelected = manualConnectMode && selectedMarkerForConnect?.id === marker.id
            return (
              <Pushpin
                key={marker.id}
                latitude={marker.latitude}
                longitude={marker.longitude}
                label={manualConnectMode ? (isSelected ? '✓ 已选中' : marker.info.title) : marker.info.title}
                onClick={() => onCustomMarkerClick(marker)}
                color={isSelected ? '#00ff00' : '#ff4444'}
                globeRef={globeRef}
                isFlat={isFlatMode}
                labelOffset={marker.labelOffset}
                onLabelDrag={onLabelDrag ? (offset) => onLabelDrag(marker.id, offset) : undefined}
                videoInfo={marker.info.videoInfo}
                fontSize={labelFontSize}
              />
            )
          })}
        </>
      )}

      {/* 标记之间的连接线 */}
      {connections.map((connection) => {
        const fromMarker = customMarkers.find((m) => m.id === connection.fromMarkerId)
        const toMarker = customMarkers.find((m) => m.id === connection.toMarkerId)

        if (!fromMarker || !toMarker) return null

        return (
          <MarkerConnector
            key={connection.id}
            fromMarker={fromMarker}
            toMarker={toMarker}
            connection={connection}
            color="#00ffff"
            lineWidth={4}
            isFlat={isFlatMode}
            label={connection.label}
            onLabelChange={onConnectionLabelChange ? (newLabel) => onConnectionLabelChange(connection.id, newLabel) : undefined}
            globeRef={globeRef}
            labelFontSize={labelFontSize}
            dollarFontSize={dollarFontSize}
          />
        )
      })}

      {/* 星空背景 */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* 锚定事件连接线坐标计算器 - 只在相机静止时计算，大幅提升性能 */}
      {anchoredEvents.length > 0 && onConnectorLinesUpdate && !isCameraMoving && (
        <ConnectorCalculator
          events={anchoredEvents}
          markers={customMarkers}
          onUpdate={onConnectorLinesUpdate}
          isFlatMode={isFlatMode}
        />
      )}

      {/* 控制器 - 根据模式选择 */}
      {isFlatMode ? (
        /* 平面模式：带限制的缩放和平移控制 */
        <FlatMapControls
          mapWidth={4}
          mapHeight={2}
          minZoom={1.5}
          maxZoom={12}
          onStart={handleCameraStart}
          onChange={handleCameraChange}
        />
      ) : (
        /* 球形模式：旋转控制（禁用惯性，立即停止） */
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          zoomSpeed={0.6}
          rotateSpeed={0.4}
          enableDamping={false}
          onStart={handleCameraStart}
          onChange={handleCameraChange}
        />
      )}
    </>
  )
}

// 性能优化：使用 React.memo 避免不必要的重渲染
export default memo(Scene)
