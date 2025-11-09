import { useRef } from 'react'
import { Mesh } from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe from './Globe'
import BoundaryLayer from './BoundaryLayer'
import Marker from './Marker'
import Pushpin from './Pushpin'
import MarkerConnector from './MarkerConnector'
import { LayerConfig } from './LayerControl'
import { City } from '../utils/cityUtils'
import { CustomMarker, MarkerConnection } from '../types/customMarker'
import { useCameraControls } from '../hooks/useCameraControls'

interface SceneProps {
  layers: LayerConfig[]
  cityMarkers: City[]
  customMarkers: CustomMarker[]
  connections: MarkerConnection[]
  onCityMarkerClick: (city: City) => void
  onCustomMarkerClick: (marker: CustomMarker) => void
  onDoubleClick: (latitude: number, longitude: number) => void
  flyToCity: { lon: number; lat: number } | null
}

function Scene({
  layers,
  cityMarkers,
  customMarkers,
  connections,
  onCityMarkerClick,
  onCustomMarkerClick,
  onDoubleClick,
  flyToCity
}: SceneProps) {
  const { flyTo } = useCameraControls()
  const globeRef = useRef<Mesh>(null)

  // 当 flyToCity 改变时，执行相机动画
  if (flyToCity) {
    flyTo(flyToCity.lon, flyToCity.lat, 1.5)
  }

  // 处理双击地球事件
  const handleGlobeDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    // 获取点击点的世界坐标
    const point = event.point

    // 将3D坐标转换为经纬度
    const radius = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2)
    const latitude = 90 - (Math.acos(point.y / radius) * 180) / Math.PI
    const longitude = ((Math.atan2(point.z, -point.x) * 180) / Math.PI + 180) % 360 - 180

    onDoubleClick(latitude, longitude)
  }

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.5} />

      {/* 定向光 */}
      <directionalLight position={[5, 3, 5]} intensity={1} />

      {/* 地球组件 - 添加双击事件 */}
      <mesh ref={globeRef} onDoubleClick={handleGlobeDoubleClick}>
        <Globe />
      </mesh>

      {/* 边界线图层 */}
      {layers.map((layer) => (
        <BoundaryLayer
          key={layer.id}
          shpPath={layer.shpPath}
          color={layer.color}
          visible={layer.visible}
        />
      ))}

      {/* 城市标记（搜索功能） */}
      {cityMarkers.map((city) => (
        <Marker key={city.id} city={city} onClick={onCityMarkerClick} />
      ))}

      {/* 自定义图钉标记 */}
      {customMarkers.map((marker) => (
        <Pushpin
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          label={marker.info.title}
          onClick={() => onCustomMarkerClick(marker)}
          color="#ff4444"
        />
      ))}

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

      {/* 轨道控制器 - 支持鼠标拖动旋转 */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        zoomSpeed={0.6}
        rotateSpeed={0.4}
      />
    </>
  )
}

export default Scene
