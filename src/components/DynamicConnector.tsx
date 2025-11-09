import './DynamicConnector.css'

export interface ConnectorLine {
  eventId: string
  startX: number
  startY: number
  endX: number
  endY: number
  visible: boolean
}

interface DynamicConnectorProps {
  lines: ConnectorLine[]
}

/**
 * 动态连接线 SVG 覆盖层
 * - 在事件卡片和图钉之间绘制连接线
 * - 线条数据由 Scene 组件计算并传入
 */
function DynamicConnector({ lines }: DynamicConnectorProps) {
  if (lines.length === 0) {
    return null
  }

  return (
    <svg className="dynamic-connector-overlay">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00ffff" stopOpacity="0.3" />
        </linearGradient>

        {/* 发光滤镜 */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lines.map((line) =>
        line.visible ? (
          <g key={line.eventId}>
            {/* 发光背景 */}
            <line
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeDasharray="5,5"
              opacity="0.3"
              filter="url(#glow)"
            />
            {/* 主线条 */}
            <line
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="#00ffff"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity="0.7"
            />
            {/* 终点圆点 */}
            <circle
              cx={line.endX}
              cy={line.endY}
              r="4"
              fill="#00ffff"
              opacity="0.8"
            />
          </g>
        ) : null
      )}
    </svg>
  )
}

export default DynamicConnector
