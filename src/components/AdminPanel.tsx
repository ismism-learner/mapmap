import { useState } from 'react'
import { CustomMarker, MarkerConnection } from '../types/customMarker'
import './AdminPanel.css'

interface AdminPanelProps {
  isAdminMode: boolean
  onToggleAdminMode: () => void
  customMarkers: CustomMarker[]
  connections: MarkerConnection[]
  onImportData: (data: { markers: CustomMarker[], connections: MarkerConnection[] }) => void
}

/**
 * 管理员面板
 * - 切换管理员/用户模式
 * - 导出数据到JSON
 * - 从JSON导入数据
 */
function AdminPanel({
  isAdminMode,
  onToggleAdminMode,
  customMarkers,
  connections,
  onImportData
}: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 导出数据到JSON文件
  const handleExport = () => {
    const data = {
      markers: customMarkers,
      connections: connections,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapmap-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log(`✅ 导出成功：${customMarkers.length} 个标记，${connections.length} 个连接`)
  }

  // 从JSON文件导入数据
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)

          if (!data.markers || !Array.isArray(data.markers)) {
            alert('无效的数据格式：缺少markers字段')
            return
          }

          if (!data.connections || !Array.isArray(data.connections)) {
            alert('无效的数据格式：缺少connections字段')
            return
          }

          const confirmed = confirm(
            `确认导入？\n` +
            `标记数量：${data.markers.length}\n` +
            `连接数量：${data.connections.length}\n` +
            `这将替换当前所有数据！`
          )

          if (confirmed) {
            onImportData({
              markers: data.markers,
              connections: data.connections
            })
            console.log(`✅ 导入成功：${data.markers.length} 个标记，${data.connections.length} 个连接`)
          }
        } catch (error) {
          alert('解析JSON文件失败：' + error)
          console.error('导入错误:', error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  if (!isOpen) {
    return (
      <button className="admin-toggle" onClick={() => setIsOpen(true)}>
        ⚙️
      </button>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h3>管理面板</h3>
        <button className="admin-close" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="admin-content">
        {/* 模式切换 */}
        <div className="admin-section">
          <label className="admin-mode-label">
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={onToggleAdminMode}
            />
            <span>管理员模式</span>
          </label>
          <p className="admin-mode-hint">
            {isAdminMode
              ? '🔓 当前可以编辑和修改内容'
              : '🔒 当前为只读模式，无法编辑'}
          </p>
        </div>

        {/* 数据管理 */}
        <div className="admin-section">
          <h4>数据管理</h4>
          <div className="admin-stats">
            <p>标记数量: {customMarkers.length}</p>
            <p>连接数量: {connections.length}</p>
          </div>

          <div className="admin-actions">
            <button
              className="admin-btn admin-btn-export"
              onClick={handleExport}
              disabled={customMarkers.length === 0}
            >
              📥 导出数据
            </button>
            <button
              className="admin-btn admin-btn-import"
              onClick={handleImport}
              disabled={!isAdminMode}
            >
              📤 导入数据
            </button>
          </div>

          {!isAdminMode && (
            <p className="admin-warning">
              ⚠️ 需要开启管理员模式才能导入数据
            </p>
          )}
        </div>

        {/* 使用说明 */}
        <div className="admin-section">
          <h4>使用说明</h4>
          <ul className="admin-help">
            <li><strong>管理员模式：</strong>可以创建、编辑、删除标记</li>
            <li><strong>用户模式：</strong>只能查看，无法修改</li>
            <li><strong>导出：</strong>保存当前所有数据到JSON文件</li>
            <li><strong>导入：</strong>从JSON文件加载数据（会覆盖当前数据）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
