import { useRef } from 'react'
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
import { LayerConfig } from './LayerControl'
import { City } from '../utils/cityUtils'
import { CustomMarker, MarkerConnection } from '../types/customMarker'
import { useCameraControls } from '../hooks/useCameraControls'
import { vector3ToLonLat } from '../utils/geoUtils'

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
  useOptimizedRendering = true
}: SceneProps) {
  const { flyTo } = useCameraControls()
  const globeRef = useRef<Mesh>(null)

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
            color="#00ffff"
            lineWidth={2}
            isFlat={isFlatMode}
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

      {/* 控制器 - 根据模式选择 */}
      {isFlatMode ? (
        /* 平面模式：带限制的缩放和平移控制 */
        <FlatMapControls
          mapWidth={4}
          mapHeight={2}
          minZoom={1.5}
          maxZoom={12}
        />
      ) : (
        /* 球形模式：旋转控制 */
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          zoomSpeed={0.6}
          rotateSpeed={0.4}
        />
      )}
    </>
  )
}

export default Scene
