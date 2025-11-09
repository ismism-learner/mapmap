import { useState } from 'react'
import './EventInput.css'
import { parseEventText } from '../utils/eventParser'

interface EventInputProps {
  onCreateEvents: (eventText: string) => void
}

/**
 * 事件输入组件
 * 支持通过分号分隔的格式批量创建图钉和连接线
 *
 * 格式：
 * - 连接线：时间;事件名;地点1;关系;地点2
 * - 图钉：;时间;事件名;地点;描述
 */
function EventInput({ onCreateEvents }: EventInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      // 解析事件以验证格式
      const events = parseEventText(text)
      if (events.length > 0) {
        onCreateEvents(text)
        setText('')
        setIsOpen(false)
        console.log(`✅ 成功解析 ${events.length} 个事件`)
      } else {
        alert('未能解析任何事件，请检查格式是否正确')
      }
    }
  }

  const handleExample = () => {
    const example = `2023-01-01;国事访问;美国,San Francisco;会见;中国,北京
2024-03-15;经贸合作;德国,Berlin;协议;日本,Tokyo
;2024-05-20;科技峰会;中国,上海;发布新AI模型
中国,北京;https://www.bilibili.com/video/BV1xx411c7mu
美国,纽约;BV1Ab411q7kE`
    setText(example)
  }

  if (!isOpen) {
    return (
      <button className="event-input-toggle" onClick={() => setIsOpen(true)}>
        📝 批量创建事件
      </button>
    )
  }

  return (
    <div className="event-input-panel">
      <div className="event-input-header">
        <h3>批量创建事件</h3>
        <button className="event-input-close" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="event-input-help">
        <p><strong>连接线格式：</strong> 时间;事件名;地点1;关系;地点2</p>
        <p><strong>图钉格式：</strong> ;时间;事件名;地点;描述</p>
        <p><strong>视频图钉：</strong> 地点;B站链接</p>
        <button className="event-input-example" onClick={handleExample}>
          填入示例
        </button>
      </div>

      <textarea
        className="event-input-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="每行一个事件，使用分号分隔各字段..."
        rows={8}
      />

      <div className="event-input-actions">
        <button className="event-input-submit" onClick={handleSubmit}>
          创建事件
        </button>
        <button className="event-input-cancel" onClick={() => setIsOpen(false)}>
          取消
        </button>
      </div>
    </div>
  )
}

export default EventInput
