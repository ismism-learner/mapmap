import { useState } from 'react'
import {
  CustomMarker,
  MarkerInfo,
  MarkerLink,
  MarkerImage,
  generateId
} from '../types/customMarker'
import { fetchBilibiliVideoInfo, isBilibiliURL } from '../utils/bilibiliUtils'
import { CloseIcon, CheckIcon, PlusIcon } from './Icons'
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
  const [videoInfo, setVideoInfo] = useState(marker.info.videoInfo)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 添加B站视频
  const handleAddBilibiliVideo = async () => {
    const url = prompt('粘贴B站视频链接:')
    if (!url) return

    if (!isBilibiliURL(url)) {
      alert('请输入有效的B站视频链接')
      return
    }

    setIsLoadingVideo(true)
    const info = await fetchBilibiliVideoInfo(url)
    setIsLoadingVideo(false)

    if (info) {
      setVideoInfo(info)
      // 自动设置标题为视频标题
      if (!title || title === '新标记') {
        setTitle(info.title)
      }
    } else {
      alert('获取视频信息失败，请检查链接是否正确')
    }
  }

  // 删除视频信息
  const handleDeleteVideo = () => {
    setVideoInfo(undefined)
  }

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

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理图片文件
  const handleImageFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      alert('请上传图片文件')
      return
    }

    for (const file of imageFiles) {
      try {
        const base64 = await fileToBase64(file)
        setImages(prev => [...prev, {
          id: generateId(),
          url: base64,
          alt: file.name
        }])
      } catch (error) {
        console.error('图片转换失败:', error)
        alert(`图片 ${file.name} 上传失败`)
      }
    }
  }

  // 拖拽进入
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  // 拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  // 拖拽放下
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await handleImageFiles(files)
    }
  }

  // 点击选择文件
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleImageFiles(files)
    }
  }

  // 添加图片（保留URL输入方式）
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
      images,
      videoInfo
    })
    setIsEditing(false)
  }

  // 取消编辑
  const handleCancel = () => {
    setTitle(marker.info.title)
    setDescription(marker.info.description)
    setLinks(marker.info.links)
    setImages(marker.info.images)
    setVideoInfo(marker.info.videoInfo)
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
        <button
          className="close-btn"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="panel-content">
        {/* 位置信息 */}
        <div className="location-info">
          <span>{marker.latitude.toFixed(4)}°, {marker.longitude.toFixed(4)}°</span>
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

        {/* B站视频 */}
        {videoInfo && (
          <div className="video-section">
            <label>B站视频:</label>
            <a
              href={videoInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="video-card"
            >
              <img
                src={videoInfo.cover}
                alt={videoInfo.title}
                className="video-cover"
              />
              <div className="video-info">
                <div className="video-title">{videoInfo.title}</div>
                <div className="video-author">UP主: {videoInfo.author}</div>
              </div>
            </a>
            {isEditing && (
              <button
                className="delete-video-btn"
                onClick={handleDeleteVideo}
              >
                删除视频
              </button>
            )}
          </div>
        )}

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
                      <CloseIcon size={16} />
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
                    {link.text}
                  </a>
                  {isEditing && (
                    <button
                      className="delete-link-btn"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <CloseIcon size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 编辑模式下的拖拽上传区域 */}
        {isEditing && (
          <div
            className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed #00ffff' : '2px dashed rgba(0, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: isDragging ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.multiple = true
              input.onchange = handleFileSelect as any
              input.click()
            }}
          >
            <div style={{ color: isDragging ? '#00ffff' : '#888', fontSize: '14px' }}>
              {isDragging ? (
                <span>📷 松开鼠标上传图片</span>
              ) : (
                <span>📷 拖拽图片到此处或点击选择文件</span>
              )}
            </div>
          </div>
        )}

        {/* 编辑模式下的添加按钮 */}
        {isEditing && (
          <div className="add-buttons">
            <button
              className="add-btn"
              onClick={handleAddBilibiliVideo}
              disabled={isLoadingVideo || !!videoInfo}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              {isLoadingVideo ? '加载中...' : videoInfo ? (
                <>
                  <CheckIcon size={14} /> 已添加视频
                </>
              ) : (
                <>
                  <PlusIcon size={14} /> 添加B站视频
                </>
              )}
            </button>
            <button className="add-btn" onClick={handleAddImage} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <PlusIcon size={14} /> 添加图片URL
            </button>
            <button className="add-btn" onClick={handleAddLink} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <PlusIcon size={14} /> 添加链接
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
