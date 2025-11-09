import { useState } from 'react'
import './LayerControl.css'
import { TextureConfig } from '../types/texture'

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
  realisticLighting?: boolean
  onLightingToggle?: () => void
  textures?: TextureConfig[]
  selectedTexture?: string
  onTextureChange?: (textureId: string) => void
  isFlatMode?: boolean
  onMapModeToggle?: () => void
}

/**
 * 图层控制面板
 * - 显示所有可用的边界线图层
 * - 允许用户切换图层的显示/隐藏
 * - 控制光照模式
 * - 选择地球底图
 */
function LayerControl({
  layers,
  onLayerToggle,
  realisticLighting = false,
  onLightingToggle,
  textures = [],
  selectedTexture,
  onTextureChange,
  isFlatMode = false,
  onMapModeToggle
}: LayerControlProps) {
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

          {/* 底图选择器 */}
          {textures.length > 0 && onTextureChange && (
            <>
              <div className="layer-divider" />
              <div className="texture-selector">
                <label className="texture-label">
                  <span>地球底图</span>
                </label>
                <select
                  className="texture-select"
                  value={selectedTexture}
                  onChange={(e) => onTextureChange(e.target.value)}
                >
                  {textures.map((texture) => (
                    <option key={texture.id} value={texture.id}>
                      {texture.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 光照模式切换 */}
          {onLightingToggle && (
            <>
              <div className="layer-divider" />
              <div className="layer-item">
                <label className="layer-label">
                  <input
                    type="checkbox"
                    checked={realisticLighting}
                    onChange={onLightingToggle}
                  />
                  <span className="layer-name">真实光照</span>
                </label>
              </div>
            </>
          )}

          {/* 地图模式切换 */}
          {onMapModeToggle && (
            <>
              <div className="layer-divider" />
              <div className="layer-item">
                <label className="layer-label">
                  <input
                    type="checkbox"
                    checked={isFlatMode}
                    onChange={onMapModeToggle}
                  />
                  <span className="layer-name">平面地图模式</span>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default LayerControl
