import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

interface FlatMapProps {
  texturePath?: string
  width?: number
  height?: number
}

/**
 * 平面地图组件
 * - 使用等距圆柱投影展开地球
 * - 支持自定义底图
 */
function FlatMap({
  texturePath = '/textures/earth_hq.jpg',
  width = 4,
  height = 2
}: FlatMapProps) {
  // 加载地图纹理
  const texture = useLoader(TextureLoader, texturePath)

  // 配置纹理
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  return (
    <mesh rotation={[0, 0, 0]}>
      {/* 平面几何体 */}
      <planeGeometry args={[width, height]} />

      {/* 使用地图纹理的材质 */}
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default FlatMap
