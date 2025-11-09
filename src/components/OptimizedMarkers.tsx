import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'
import { CustomMarker } from '../types/customMarker'
import { City } from '../utils/cityUtils'

/**
 * 标记数据接口
 */
interface MarkerData {
  id: string
  latitude: number
  longitude: number
  label: string
  onClick: () => void
  color?: string
  type: 'custom' | 'city'
}

interface OptimizedMarkersProps {
  customMarkers: CustomMarker[]
  cityMarkers: City[]
  onCustomMarkerClick: (marker: CustomMarker) => void
  onCityMarkerClick: (city: City) => void
  radius?: number
  isFlat?: boolean
  mapWidth?: number
  mapHeight?: number
  selectedMarkerId?: string | null
  globeRef?: React.RefObject<THREE.Mesh>
}

/**
 * 优化的标记渲染组件
 *
 * 性能优化策略：
 * 1. InstancedMesh - 批量渲染所有标记，减少draw calls
 * 2. 视锥剔除 - 只渲染可见标记
 * 3. LOD系统 - 根据距离使用不同细节级别
 * 4. 优化交互 - 高效的raycasting
 * 5. 延迟渲染 - 只在悬停时显示标签
 */
function OptimizedMarkers({
  customMarkers,
  cityMarkers,
  onCustomMarkerClick,
  onCityMarkerClick,
  radius = 1.01,
  isFlat = false,
  mapWidth = 4,
  mapHeight = 2,
  selectedMarkerId = null,
  globeRef
}: OptimizedMarkersProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const hoveredIndexRef = useRef<number | null>(null)
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null)
  const { camera, raycaster, pointer } = useThree()

  // 合并所有标记数据
  const allMarkers = useMemo<MarkerData[]>(() => {
    const custom: MarkerData[] = customMarkers.map(m => ({
      id: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      label: m.info.title,
      onClick: () => onCustomMarkerClick(m),
      color: m.id === selectedMarkerId ? '#00ff00' : '#ff4444',
      type: 'custom' as const
    }))

    const cities: MarkerData[] = cityMarkers.map(c => ({
      id: c.id.toString(),
      latitude: parseFloat(c.latitude),
      longitude: parseFloat(c.longitude),
      label: c.name,
      onClick: () => onCityMarkerClick(c),
      color: '#ff0000',
      type: 'city' as const
    }))

    return [...custom, ...cities]
  }, [customMarkers, cityMarkers, onCustomMarkerClick, onCityMarkerClick, selectedMarkerId])

  // 计算所有标记的位置
  const positions = useMemo(() => {
    return allMarkers.map(marker => {
      if (isFlat) {
        return lonLatToFlatPosition(marker.longitude, marker.latitude, mapWidth, mapHeight)
      } else {
        return lonLatToVector3(marker.longitude, marker.latitude, radius)
      }
    })
  }, [allMarkers, isFlat, radius, mapWidth, mapHeight])

  // 初始化InstancedMesh的变换矩阵
  useEffect(() => {
    if (!instancedMeshRef.current) return

    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()

    positions.forEach((pos, i) => {
      // 设置位置
      matrix.setPosition(pos.x, pos.y, pos.z)
      instancedMeshRef.current!.setMatrixAt(i, matrix)

      // 设置颜色
      color.set(allMarkers[i].color || '#ff4444')
      instancedMeshRef.current!.setColorAt(i, color)
    })

    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true
    }
  }, [positions, allMarkers])

  // 视锥剔除和LOD系统
  useFrame(() => {
    if (!instancedMeshRef.current) return

    const frustum = new THREE.Frustum()
    const projScreenMatrix = new THREE.Matrix4()
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(projScreenMatrix)

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const cameraPosition = camera.position

    positions.forEach((_, i) => {
      instancedMeshRef.current!.getMatrixAt(i, matrix)
      position.setFromMatrixPosition(matrix)

      // 视锥剔除：不在视野内的标记隐藏（缩放为0）
      const inFrustum = frustum.containsPoint(position)

      if (inFrustum) {
        // 计算距离
        const distance = cameraPosition.distanceTo(position)

        // LOD系统：根据距离调整大小
        let lodScale = 1.0
        if (distance > 5) {
          lodScale = 0.5 // 远距离：缩小
        } else if (distance > 3) {
          lodScale = 0.7 // 中距离：稍微缩小
        } else {
          lodScale = 1.0 // 近距离：正常大小
        }

        scale.set(lodScale, lodScale, lodScale)
      } else {
        // 不在视野内：隐藏
        scale.set(0, 0, 0)
      }

      matrix.scale(scale)
      instancedMeshRef.current!.setMatrixAt(i, matrix)
    })

    instancedMeshRef.current.instanceMatrix.needsUpdate = true
  })

  // 处理鼠标交互（点击和悬停）
  useEffect(() => {
    const handlePointerMove = () => {
      if (!instancedMeshRef.current) return

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(instancedMeshRef.current)

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId
        if (instanceId !== undefined && instanceId !== hoveredIndexRef.current) {
          hoveredIndexRef.current = instanceId
          setHoveredMarker(allMarkers[instanceId])
        }
      } else {
        if (hoveredIndexRef.current !== null) {
          hoveredIndexRef.current = null
          setHoveredMarker(null)
        }
      }
    }

    const handleClick = () => {
      if (hoveredIndexRef.current !== null) {
        const marker = allMarkers[hoveredIndexRef.current]
        marker.onClick()
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('click', handleClick)
    }
  }, [allMarkers, camera, raycaster, pointer])

  // 悬停标记的位置
  const hoveredPosition = useMemo(() => {
    if (hoveredIndexRef.current !== null) {
      return positions[hoveredIndexRef.current]
    }
    return null
  }, [positions, hoveredMarker])

  return (
    <>
      {/* 批量渲染的标记 */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, allMarkers.length]}
        frustumCulled={false} // 我们手动处理视锥剔除
      >
        {/* 简化的球体几何体 - 减少段数以提高性能 */}
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial
          vertexColors
          emissive="#cc0000"
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      {/* 悬停时显示标签 */}
      {hoveredMarker && hoveredPosition && (
        <Html
          position={[hoveredPosition.x, hoveredPosition.y, hoveredPosition.z]}
          center
          distanceFactor={0.5}
          occlude={globeRef ? [globeRef] : undefined}
          style={{
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {hoveredMarker.label}
          </div>
        </Html>
      )}
    </>
  )
}

export default OptimizedMarkers
