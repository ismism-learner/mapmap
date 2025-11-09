import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
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
 * 连接线坐标计算器（性能优化版）
 * - 每3帧更新一次，减少计算频率
 * - 缓存DOM查询结果
 * - 坐标差异检测，只在变化超过阈值时更新
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
  const frameCountRef = useRef(0)
  const lastLinesRef = useRef<ConnectorLine[]>([])
  const anchorCacheRef = useRef<Map<string, HTMLElement>>(new Map())

  useFrame(() => {
    // 帧节流：每3帧更新一次
    frameCountRef.current++
    if (frameCountRef.current % 3 !== 0) {
      return
    }

    // 清理无效缓存（每次更新时顺带执行）
    const currentEventIds = new Set(events.map(e => e.id))
    const cachedIds = Array.from(anchorCacheRef.current.keys())
    cachedIds.forEach(id => {
      if (!currentEventIds.has(id)) {
        anchorCacheRef.current.delete(id)
      }
    })

    // 如果没有事件，清空连接线
    if (events.length === 0) {
      if (lastLinesRef.current.length > 0) {
        onUpdate([])
        lastLinesRef.current = []
      }
      return
    }

    const newLines: ConnectorLine[] = []

    events.forEach((event) => {
      // 从缓存获取或查询锚点元素
      let anchorElement = anchorCacheRef.current.get(event.id)
      if (!anchorElement) {
        const element = document.querySelector(`[data-anchor-id="${event.id}"]`) as HTMLElement
        if (!element) return
        anchorCacheRef.current.set(event.id, element)
        anchorElement = element
      }

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
      let visible = projected.z < 1 && projected.z > -1

      // 在球形模式下，还需要检查是否在地球背面
      if (!isFlatMode && visible) {
        const normal = markerPos.clone().normalize()
        const toCamera = camera.position.clone().sub(markerPos).normalize()
        const facingCamera = normal.dot(toCamera) > 0.1

        if (!facingCamera) {
          visible = false
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

    // 坐标差异检测：只在变化超过阈值时更新
    let shouldUpdate = lastLinesRef.current.length !== newLines.length

    if (!shouldUpdate) {
      for (let i = 0; i < newLines.length; i++) {
        const oldLine = lastLinesRef.current[i]
        const newLine = newLines[i]

        if (!oldLine ||
            oldLine.eventId !== newLine.eventId ||
            oldLine.visible !== newLine.visible ||
            Math.abs(oldLine.startX - newLine.startX) > 2 ||
            Math.abs(oldLine.startY - newLine.startY) > 2 ||
            Math.abs(oldLine.endX - newLine.endX) > 2 ||
            Math.abs(oldLine.endY - newLine.endY) > 2) {
          shouldUpdate = true
          break
        }
      }
    }

    if (shouldUpdate) {
      onUpdate(newLines)
      lastLinesRef.current = newLines
    }
  })

  return null
}

export default ConnectorCalculator
