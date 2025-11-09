import { useEffect, useState } from 'react'
import './SliceTransition.css'

interface SliceTransitionProps {
  isTransitioning: boolean
  sliceCount?: number
  duration?: number
}

/**
 * 伪3D切片过渡效果组件
 * - 在球形和平面地图切换时显示
 * - 将画面分成多个切片
 * - 每个切片以不同的时间偏移进行动画
 * - 创造出视觉上的层次感
 */
function SliceTransition({
  isTransitioning,
  sliceCount = 12,
  duration = 800
}: SliceTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true)
      // 过渡结束后隐藏
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning, duration])

  if (!isVisible) return null

  return (
    <div className="slice-transition-container">
      {Array.from({ length: sliceCount }).map((_, index) => {
        const delay = (index / sliceCount) * (duration * 0.3) // 前30%时间用于延迟
        const sliceHeight = `${100 / sliceCount}%`

        return (
          <div
            key={index}
            className="slice"
            style={{
              top: `${(index / sliceCount) * 100}%`,
              height: sliceHeight,
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}ms`,
              // 奇偶切片从不同方向进入，增强3D感
              animationName: index % 2 === 0 ? 'sliceInLeft' : 'sliceInRight'
            }}
          />
        )
      })}
    </div>
  )
}

export default SliceTransition
