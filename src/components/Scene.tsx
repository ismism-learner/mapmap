import { OrbitControls, Stars } from '@react-three/drei'
import Globe from './Globe'
import BoundaryLayer from './BoundaryLayer'
import Marker from './Marker'
import { LayerConfig } from './LayerControl'
import { City } from '../utils/cityUtils'
import { useCameraControls } from '../hooks/useCameraControls'

interface SceneProps {
  layers: LayerConfig[]
  markers: City[]
  onMarkerClick: (city: City) => void
  flyToCity: { lon: number; lat: number } | null
}

function Scene({ layers, markers, onMarkerClick, flyToCity }: SceneProps) {
  const { flyTo } = useCameraControls()

  // 当 flyToCity 改变时，执行相机动画
  if (flyToCity) {
    flyTo(flyToCity.lon, flyToCity.lat, 1.5)
  }

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.5} />

      {/* 定向光 */}
      <directionalLight position={[5, 3, 5]} intensity={1} />

      {/* 地球组件 */}
      <Globe />

      {/* 边界线图层 */}
      {layers.map((layer) => (
        <BoundaryLayer
          key={layer.id}
          shpPath={layer.shpPath}
          color={layer.color}
          visible={layer.visible}
        />
      ))}

      {/* 城市标记 */}
      {markers.map((city) => (
        <Marker key={city.id} city={city} onClick={onMarkerClick} />
      ))}

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
