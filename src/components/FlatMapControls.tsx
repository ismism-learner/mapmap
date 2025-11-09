import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface FlatMapControlsProps {
  mapWidth?: number
  mapHeight?: number
  minZoom?: number
  maxZoom?: number
  onChange?: () => void
}

/**
 * 平面地图专用控制器
 * - 限制缩放范围（minZoom/maxZoom）
 * - 限制平移边界（防止移出地图）
 * - 平滑的缩放体验
 */
function FlatMapControls({
  mapWidth = 4,
  mapHeight = 2,
  minZoom = 1.5,   // 最小缩放：完整显示地图
  maxZoom = 12,    // 最大缩放：可以看到细节
  onChange
}: FlatMapControlsProps) {
  const controlsRef = useRef<any>(null)
  const { camera, gl, size } = useThree()

  // 初始化相机位置和限制
  useEffect(() => {
    if (controlsRef.current && 'fov' in camera) {
      const controls = controlsRef.current
      const perspCamera = camera as THREE.PerspectiveCamera

      // 计算距离限制（基于缩放级别）
      const maxDistance = mapHeight / (2 * Math.tan((perspCamera.fov * Math.PI) / 360)) * (1 / minZoom)
      const minDistance = mapHeight / (2 * Math.tan((perspCamera.fov * Math.PI) / 360)) * (1 / maxZoom)

      controls.minDistance = minDistance
      controls.maxDistance = maxDistance

      // 重置相机到默认位置
      camera.position.set(0, 0, maxDistance)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }, [camera, mapWidth, mapHeight, minZoom, maxZoom])

  // 每帧检查并限制平移范围
  useFrame(() => {
    if (!controlsRef.current || !('fov' in camera)) return

    const controls = controlsRef.current
    const perspCamera = camera as THREE.PerspectiveCamera

    // 计算当前视口大小
    const distance = Math.abs(perspCamera.position.z)
    const vFov = perspCamera.fov * (Math.PI / 180)
    const viewportHeight = 2 * Math.tan(vFov / 2) * distance
    const viewportWidth = viewportHeight * (size.width / size.height)

    // 计算允许的最大平移距离
    const maxX = Math.max(0, (mapWidth - viewportWidth) / 2)
    const maxY = Math.max(0, (mapHeight - viewportHeight) / 2)

    // 获取当前target位置
    const target = controls.target

    // 限制并更新target位置
    let changed = false

    if (Math.abs(target.x) > maxX) {
      target.x = Math.sign(target.x) * maxX
      changed = true
    }

    if (Math.abs(target.y) > maxY) {
      target.y = Math.sign(target.y) * maxY
      changed = true
    }

    // 如果有变化，手动更新控制器
    if (changed) {
      controls.target.copy(target)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableRotate={false}
      enablePan={true}
      enableZoom={true}
      zoomSpeed={0.8}
      panSpeed={0.5}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      screenSpacePanning={true}
      dampingFactor={0.1}
      enableDamping={true}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 2}
      onChange={onChange}
    />
  )
}

export default FlatMapControls
