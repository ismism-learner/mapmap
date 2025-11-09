import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { lonLatToVector3 } from '../utils/geoUtils'

/**
 * 相机控制 hook
 * 提供平滑的相机动画功能
 */
export function useCameraControls() {
  const { camera } = useThree()
  const targetPosition = useRef<Vector3 | null>(null)
  const animating = useRef(false)
  const startPosition = useRef<Vector3>(new Vector3())
  const progress = useRef(0)

  useFrame(() => {
    if (!animating.current || !targetPosition.current) return

    progress.current += 0.02

    if (progress.current >= 1) {
      camera.position.copy(targetPosition.current)
      camera.lookAt(0, 0, 0)
      animating.current = false
      progress.current = 0
      return
    }

    // 使用 ease-in-out 插值
    const t = easeInOutCubic(progress.current)
    camera.position.lerpVectors(startPosition.current, targetPosition.current, t)
    camera.lookAt(0, 0, 0)
  })

  /**
   * 飞向指定的经纬度位置
   */
  const flyTo = (lon: number, lat: number, distance: number = 2) => {
    const { x, y, z } = lonLatToVector3(lon, lat, distance)
    startPosition.current.copy(camera.position)
    targetPosition.current = new Vector3(x, y, z)
    progress.current = 0
    animating.current = true
  }

  return { flyTo }
}

/**
 * 缓动函数：ease-in-out cubic
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
