import { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Mesh, TextureLoader } from 'three'

/**
 * 3D 地球组件
 * - 使用真实地图纹理
 * - 自动缓慢旋转
 * - 支持鼠标交互（通过 OrbitControls）
 */
function Globe() {
  const meshRef = useRef<Mesh>(null)

  // 加载地球纹理
  const texture = useLoader(TextureLoader, '/tif1.png')

  // 每帧更新：让地球缓慢自转
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      {/* 球体几何体 - 64段精度保证球体光滑 */}
      <sphereGeometry args={[1, 64, 64]} />

      {/* 使用地图纹理的材质 */}
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}

export default Globe
