import { useState, useRef } from 'react'
import './ImageUpload.css'

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onClose: () => void
}

/**
 * 图片上传组件 - 磨砂玻璃风格
 * 支持本地图片上传和预览
 */
function ImageUpload({ onImageUpload, onClose }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 创建预览URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreviewUrl(result)
    }
    reader.readAsDataURL(file)
  }

  // 处理文件输入
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // 确认上传
  const handleConfirm = () => {
    if (previewUrl) {
      onImageUpload(previewUrl)
      onClose()
    }
  }

  return (
    <div className="image-upload-panel glass-panel">
      <div className="panel-header">
        <h3>图片上传</h3>
        <button className="close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-content">
        {!previewUrl ? (
          /* 上传区域 */
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="upload-hint">点击或拖放图片到这里</p>
            <p className="upload-subhint">支持 JPG, PNG, GIF 格式</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          /* 预览区域 */
          <div className="preview-area">
            <img src={previewUrl} alt="预览" className="preview-image" />
            <div className="preview-actions">
              <button
                className="action-btn secondary"
                onClick={() => {
                  setPreviewUrl(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                重新选择
              </button>
              <button className="action-btn primary" onClick={handleConfirm}>
                确认上传
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageUpload
