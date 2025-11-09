import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

interface GlobeProps {
  texturePath?: string
}

/**
 * 3D 地球组件
 * - 使用真实地图纹理
 * - 支持鼠标交互（通过 OrbitControls）
 * - 支持自定义底图
 */
function Globe({ texturePath = '/textures/earth_hq.jpg' }: GlobeProps) {
  // 加载地球纹理
  const texture = useLoader(TextureLoader, texturePath)

  // 配置纹理以避免极点撕裂
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  return (
    <mesh rotation={[0, 0, 0]}>
      {/* 球体几何体 - 增加段数以获得更好的纹理映射 */}
      <sphereGeometry args={[1, 128, 128]} />

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
