import { useEffect, useState } from 'react'
import './UnfoldTransition.css'

interface UnfoldTransitionProps {
  isTransitioning: boolean
  toFlatMode: boolean
  duration?: number
}

/**
 * 球形展开/平面收缩过渡效果
 * - 球形→平面：径向展开动画
 * - 平面→球形：径向收缩动画
 */
function UnfoldTransition({
  isTransitioning,
  toFlatMode,
  duration = 600
}: UnfoldTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [direction, setDirection] = useState<'unfold' | 'fold'>('unfold')

  useEffect(() => {
    if (isTransitioning) {
      setDirection(toFlatMode ? 'unfold' : 'fold')
      setIsVisible(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isTransitioning, toFlatMode, duration])

  if (!isVisible) return null

  return (
    <div
      className={`unfold-transition ${direction}`}
      style={{
        animationDuration: `${duration}ms`
      }}
    >
      <div className="unfold-overlay" />
      <div className="unfold-grid" />
    </div>
  )
}

export default UnfoldTransition
