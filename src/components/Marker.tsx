import { useRef, useState } from 'react'
import { Mesh } from 'three'
import { Html } from '@react-three/drei'
import { lonLatToVector3 } from '../utils/geoUtils'
import { City } from '../utils/cityUtils'

interface MarkerProps {
  city: City
  onClick?: (city: City) => void
  radius?: number
}

/**
 * 地图标记点组件
 * - 在地球表面显示图钉
 * - 支持点击和悬停
 */
function Marker({ city, onClick, radius = 1.01 }: MarkerProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const lat = parseFloat(city.latitude)
  const lon = parseFloat(city.longitude)
  const { x, y, z } = lonLatToVector3(lon, lat, radius)

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick(city)
    }
  }

  return (
    <group position={[x, y, z]}>
      {/* 图钉球体 */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : '#ff0000'}
          emissive={hovered ? '#ff0000' : '#cc0000'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* 图钉杆 */}
      <mesh position={[0, -0.01, 0]} onClick={handleClick}>
        <cylinderGeometry args={[0.001, 0.001, 0.02, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 悬停时显示城市名 */}
      {hovered && (
        <Html distanceFactor={0.5} position={[0, 0.02, 0]}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {city.name}
          </div>
        </Html>
      )}
    </group>
  )
}

export default Marker
