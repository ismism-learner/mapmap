import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe from './components/Globe'
import BoundaryLayer from './components/BoundaryLayer'
import LayerControl, { LayerConfig } from './components/LayerControl'
import './App.css'

function App() {
  // 初始化图层配置
  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: 'countries',
      name: '国界 (110m)',
      shpPath: '/shapefiles/ne_110m_admin_0_countries.shp',
      color: '#FFD700',
      visible: true,
    },
  ])

  // 切换图层显示状态
  const handleLayerToggle = (layerId: string) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
  }

  return (
    <div className="app">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
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
      </Canvas>

      <div className="info">
        <h1>MapMap - 3D 地球</h1>
        <p>鼠标拖动旋转 | 滚轮缩放</p>
      </div>

      {/* 图层控制面板 */}
      <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />
    </div>
  )
}

export default App
