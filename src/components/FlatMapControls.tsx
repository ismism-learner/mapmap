import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface FlatMapControlsProps {
  mapWidth?: number
  mapHeight?: number
  minZoom?: number
  maxZoom?: number
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
  maxZoom = 12     // 最大缩放：可以看到细节
}: FlatMapControlsProps) {
  const controlsRef = useRef<any>(null)
  const { camera, gl } = useThree()

  // 初始化相机位置和限制
  useEffect(() => {
    if (controlsRef.current && 'fov' in camera) {
      const controls = controlsRef.current
      const perspCamera = camera as THREE.PerspectiveCamera

      // 计算距离限制（基于缩放级别）
      // 距离越小 = 缩放越大
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
    if (controlsRef.current && 'fov' in camera) {
      const controls = controlsRef.current
      const target = controls.target
      const perspCamera = camera as THREE.PerspectiveCamera

      // 计算当前缩放级别（基于相机距离）
      const distance = perspCamera.position.z
      const fov = perspCamera.fov * (Math.PI / 180)
      const viewportHeight = 2 * Math.tan(fov / 2) * distance
      const viewportWidth = viewportHeight * perspCamera.aspect

      // 计算平移边界
      // 如果视口大于地图，则锁定在中心
      // 如果视口小于地图，则允许平移但不超出地图边界
      const maxX = Math.max(0, (mapWidth - viewportWidth) / 2)
      const maxY = Math.max(0, (mapHeight - viewportHeight) / 2)

      // 限制X轴平移
      if (target.x > maxX) {
        target.x = maxX
      } else if (target.x < -maxX) {
        target.x = -maxX
      }

      // 限制Y轴平移
      if (target.y > maxY) {
        target.y = maxY
      } else if (target.y < -maxY) {
        target.y = -maxY
      }

      controls.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableRotate={false}      // 禁止旋转
      enablePan={true}           // 启用平移
      enableZoom={true}          // 启用缩放
      zoomSpeed={0.8}            // 缩放速度
      panSpeed={0.5}             // 平移速度
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,   // 左键平移
        MIDDLE: THREE.MOUSE.DOLLY, // 中键缩放
        RIGHT: THREE.MOUSE.PAN   // 右键也是平移
      }}
      screenSpacePanning={true}  // 屏幕空间平移（更直观）
      dampingFactor={0.05}       // 阻尼系数
      enableDamping={true}       // 启用阻尼（平滑效果）
    />
  )
}

export default FlatMapControls
