import { useRef, useState } from 'react'
import { Group } from 'three'
import { Html } from '@react-three/drei'
import { lonLatToVector3 } from '../utils/geoUtils'

interface PushpinProps {
  latitude: number
  longitude: number
  label?: string
  onClick?: () => void
  radius?: number
  color?: string
}

/**
 * 统一样式的图钉组件
 * - 标准化的图钉外观
 * - 支持点击和悬停
 * - 显示标签
 */
function Pushpin({
  latitude,
  longitude,
  label,
  onClick,
  radius = 1.01,
  color = '#ff4444'
}: PushpinProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const { x, y, z } = lonLatToVector3(longitude, latitude, radius)

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* 图钉头部（球体） */}
      <mesh
        position={[0, 0.015, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* 图钉针尖（圆锥） */}
      <mesh
        position={[0, 0.007, 0]}
        rotation={[Math.PI, 0, 0]}
        onClick={handleClick}
      >
        <coneGeometry args={[0.003, 0.015, 8]} />
        <meshStandardMaterial
          color={hovered ? '#ffaaaa' : '#ffffff'}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>

      {/* 图钉杆（细柱） */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
      >
        <cylinderGeometry args={[0.0015, 0.0015, 0.015, 8]} />
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* 悬停或有标签时显示 */}
      {(hovered || label) && label && (
        <Html distanceFactor={0.5} position={[0, 0.025, 0]} center>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

export default Pushpin
