import { useState } from 'react'
import {
  CustomMarker,
  MarkerInfo,
  MarkerLink,
  MarkerImage,
  generateId
} from '../types/customMarker'
import './EditableInfoPanel.css'

interface EditableInfoPanelProps {
  marker: CustomMarker
  onSave: (updatedInfo: MarkerInfo) => void
  onClose: () => void
  onDelete?: () => void
}

/**
 * 可编辑的信息面板
 * - 显示和编辑图钉信息
 * - 支持添加超链接和图片
 */
function EditableInfoPanel({
  marker,
  onSave,
  onClose,
  onDelete
}: EditableInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(marker.info.title)
  const [description, setDescription] = useState(marker.info.description)
  const [links, setLinks] = useState<MarkerLink[]>(marker.info.links)
  const [images, setImages] = useState<MarkerImage[]>(marker.info.images)

  // 添加超链接
  const handleAddLink = () => {
    const text = prompt('链接文本:')
    const url = prompt('链接地址 (URL):')
    if (text && url) {
      setLinks([...links, { id: generateId(), text, url }])
    }
  }

  // 删除超链接
  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id))
  }

  // 添加图片
  const handleAddImage = () => {
    const url = prompt('图片地址 (URL):')
    const alt = prompt('图片描述:') || '图片'
    if (url) {
      setImages([...images, { id: generateId(), url, alt }])
    }
  }

  // 删除图片
  const handleDeleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id))
  }

  // 保存更改
  const handleSave = () => {
    onSave({
      title,
      description,
      links,
      images
    })
    setIsEditing(false)
  }

  // 取消编辑
  const handleCancel = () => {
    setTitle(marker.info.title)
    setDescription(marker.info.description)
    setLinks(marker.info.links)
    setImages(marker.info.images)
    setIsEditing(false)
  }

  return (
    <div className="editable-info-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题"
              className="title-input"
            />
          ) : (
            title || '未命名标记'
          )}
        </h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        {/* 位置信息 */}
        <div className="location-info">
          <span>📍 {marker.latitude.toFixed(4)}°, {marker.longitude.toFixed(4)}°</span>
        </div>

        {/* 描述 */}
        <div className="description-section">
          <label>描述:</label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述..."
              className="description-input"
              rows={4}
            />
          ) : (
            <p className="description-text">
              {description || '暂无描述'}
            </p>
          )}
        </div>

        {/* 图片列表 */}
        {images.length > 0 && (
          <div className="images-section">
            <label>图片:</label>
            <div className="images-grid">
              {images.map((img) => (
                <div key={img.id} className="image-item">
                  <img src={img.url} alt={img.alt} />
                  {isEditing && (
                    <button
                      className="delete-image-btn"
                      onClick={() => handleDeleteImage(img.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 链接列表 */}
        {links.length > 0 && (
          <div className="links-section">
            <label>链接:</label>
            <ul className="links-list">
              {links.map((link) => (
                <li key={link.id} className="link-item">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    🔗 {link.text}
                  </a>
                  {isEditing && (
                    <button
                      className="delete-link-btn"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 编辑模式下的添加按钮 */}
        {isEditing && (
          <div className="add-buttons">
            <button className="add-btn" onClick={handleAddImage}>
              + 添加图片
            </button>
            <button className="add-btn" onClick={handleAddLink}>
              + 添加链接
            </button>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="panel-footer">
        {isEditing ? (
          <>
            <button className="save-btn" onClick={handleSave}>
              保存
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              取消
            </button>
          </>
        ) : (
          <>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              编辑
            </button>
            {onDelete && (
              <button className="delete-btn" onClick={onDelete}>
                删除
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default EditableInfoPanel
