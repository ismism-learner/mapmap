import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { AnchoredEvent } from './AnchoredEventPanel'
import { ConnectorLine } from './DynamicConnector'
import { lonLatToVector3, lonLatToFlatPosition } from '../utils/geoUtils'

interface ConnectorCalculatorProps {
  events: AnchoredEvent[]
  onUpdate: (lines: ConnectorLine[]) => void
  isFlatMode: boolean
  radius?: number
  mapWidth?: number
  mapHeight?: number
}

/**
 * 连接线坐标计算器
 * - 在 Scene 内部运行，每帧计算连接线坐标
 * - 将 3D 坐标投影到 2D 屏幕坐标
 * - 通过回调函数传递给外部组件
 */
function ConnectorCalculator({
  events,
  onUpdate,
  isFlatMode,
  radius = 1.01,
  mapWidth = 4,
  mapHeight = 2,
}: ConnectorCalculatorProps) {
  const { camera, size } = useThree()

  useFrame(() => {
    if (events.length === 0) {
      onUpdate([])
      return
    }

    const newLines: ConnectorLine[] = []

    events.forEach((event) => {
      // 获取卡片锚点的 DOM 元素
      const anchorElement = document.querySelector(`[data-anchor-id="${event.id}"]`)
      if (!anchorElement) return

      // 获取锚点的屏幕坐标
      const anchorRect = anchorElement.getBoundingClientRect()
      const startX = event.side === 'left' ? anchorRect.right : anchorRect.left
      const startY = anchorRect.top + anchorRect.height / 2

      // 计算图钉的 3D 位置
      let markerPos: Vector3
      if (isFlatMode) {
        const flatPos = lonLatToFlatPosition(
          event.marker.longitude,
          event.marker.latitude,
          mapWidth,
          mapHeight
        )
        markerPos = new Vector3(flatPos.x, flatPos.y, flatPos.z)
      } else {
        const spherePos = lonLatToVector3(
          event.marker.longitude,
          event.marker.latitude,
          radius
        )
        markerPos = new Vector3(spherePos.x, spherePos.y, spherePos.z)
      }

      // 将 3D 坐标投影到 2D 屏幕坐标
      const projected = markerPos.clone()
      projected.project(camera)

      // 转换为屏幕像素坐标
      const endX = (projected.x * 0.5 + 0.5) * size.width
      const endY = (-(projected.y * 0.5) + 0.5) * size.height

      // 检查图钉是否在视口内且可见
      // z < 1 表示在相机前方，z > -1 表示在近裁剪面之后
      const visible = projected.z < 1 && projected.z > -1

      // 在球形模式下，还需要检查是否在地球背面
      if (!isFlatMode && visible) {
        // 计算法线向量（从地球中心指向图钉）
        const normal = markerPos.clone().normalize()
        // 计算从图钉到相机的方向
        const toCamera = camera.position.clone().sub(markerPos).normalize()
        // 点积 > 0 表示面向相机
        const facingCamera = normal.dot(toCamera) > 0.1

        if (!facingCamera) {
          // 在背面，不显示连接线
          return
        }
      }

      newLines.push({
        eventId: event.id,
        startX,
        startY,
        endX,
        endY,
        visible,
      })
    })

    onUpdate(newLines)
  })

  return null
}

export default ConnectorCalculator
