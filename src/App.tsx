import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe from './components/Globe'
import './App.css'

function App() {
  return (
    <div className="app">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        {/* 环境光 */}
        <ambientLight intensity={0.5} />

        {/* 定向光 */}
        <directionalLight position={[5, 3, 5]} intensity={1} />

        {/* 地球组件 */}
        <Globe />

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
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
        />
      </Canvas>

      <div className="info">
        <h1>3D Earth Globe</h1>
        <p>鼠标拖动旋转 | 滚轮缩放 | 右键平移</p>
      </div>
    </div>
  )
}

export default App
