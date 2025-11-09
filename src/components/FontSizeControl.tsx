import './FontSizeControl.css'

interface FontSizeControlProps {
  labelFontSize: number
  dollarFontSize: number
  onLabelFontSizeChange: (size: number) => void
  onDollarFontSizeChange: (size: number) => void
  onClose: () => void
}

/**
 * 字体大小控制面板
 * - 调整标签字体大小
 * - 调整美元符号字体大小
 */
function FontSizeControl({
  labelFontSize,
  dollarFontSize,
  onLabelFontSizeChange,
  onDollarFontSizeChange,
  onClose
}: FontSizeControlProps) {
  return (
    <div className="font-size-control">
      <div className="font-size-header">
        <h3>字体大小</h3>
        <button className="font-size-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="font-size-content">
        {/* 标签字体大小 */}
        <div className="font-size-section">
          <label className="font-size-label">
            <span>标签字体</span>
            <span className="font-size-value">{labelFontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="32"
            step="1"
            value={labelFontSize}
            onChange={(e) => onLabelFontSizeChange(Number(e.target.value))}
            className="font-size-slider"
          />
          <div className="font-size-marks">
            <span>12</span>
            <span>20</span>
            <span>32</span>
          </div>
        </div>

        {/* 美元符号字体大小 */}
        <div className="font-size-section">
          <label className="font-size-label">
            <span>美元符号</span>
            <span className="font-size-value">{dollarFontSize}px</span>
          </label>
          <input
            type="range"
            min="16"
            max="40"
            step="1"
            value={dollarFontSize}
            onChange={(e) => onDollarFontSizeChange(Number(e.target.value))}
            className="font-size-slider"
          />
          <div className="font-size-marks">
            <span>16</span>
            <span>25</span>
            <span>40</span>
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="font-size-actions">
          <button
            className="font-size-reset"
            onClick={() => {
              onLabelFontSizeChange(20)
              onDollarFontSizeChange(25)
            }}
          >
            重置为默认
          </button>
        </div>
      </div>
    </div>
  )
}

export default FontSizeControl
