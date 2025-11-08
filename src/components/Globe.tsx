import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

/**
 * 3D 地球组件
 * - 深蓝色球体
 * - 自动缓慢旋转
 * - 支持鼠标交互（通过 OrbitControls）
 */
function Globe() {
  const meshRef = useRef<Mesh>(null)

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

      {/* 深蓝色材质 */}
      <meshStandardMaterial
        color="#1e3a8a"  // 深蓝色
        roughness={0.7}   // 粗糙度
        metalness={0.3}   // 金属感
        emissive="#0c1f47" // 自发光颜色（更深的蓝色）
        emissiveIntensity={0.2} // 自发光强度
      />
    </mesh>
  )
}

export default Globe
