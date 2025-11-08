import { useState } from 'react'
import './LayerControl.css'

export interface LayerConfig {
  id: string
  name: string
  shpPath: string
  color: string
  visible: boolean
}

interface LayerControlProps {
  layers: LayerConfig[]
  onLayerToggle: (layerId: string) => void
}

/**
 * 图层控制面板
 * - 显示所有可用的边界线图层
 * - 允许用户切换图层的显示/隐藏
 */
function LayerControl({ layers, onLayerToggle }: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="layer-control">
      <div className="layer-control-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>图层控制</h3>
        <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="layer-control-body">
          {layers.map((layer) => (
            <div key={layer.id} className="layer-item">
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => onLayerToggle(layer.id)}
                />
                <span
                  className="layer-color"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="layer-name">{layer.name}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LayerControl
