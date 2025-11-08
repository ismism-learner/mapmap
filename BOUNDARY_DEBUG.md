# 边界线调试指南

如果您看不到边界线，请按照以下步骤调试：

## 1. 打开浏览器开发者工具

- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: 按 `F12` 或 `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

## 2. 查看控制台日志

启动应用后，您应该在控制台中看到以下日志序列：

### 正常加载序列

```
📂 loadShapefile called with path: /shapefiles/ne_110m_admin_0_countries.shp
📂 Base path: /shapefiles/ne_110m_admin_0_countries
📥 Fetch responses: { shp: { ok: true, status: 200 }, dbf: { ok: true, status: 200 } }
✅ Files fetched successfully
✅ Buffers loaded: { shpSize: 180924, dbfSize: 531808 }
📊 Parsed data: { shpFeatures: XXX, dbfRecords: XXX }
✅ GeoJSON created: { type: 'FeatureCollection', featuresCount: 177 }
📝 Sample feature: { type: 'MultiPolygon', properties: [...] }

🔄 [BoundaryLayer] Loading shapefile: /shapefiles/ne_110m_admin_0_countries.shp
📊 [BoundaryLayer] Processing 177 features
🔍 [BoundaryLayer] Line 1: { featureIdx: 0, polygonIdx: 0, ringIdx: 0, pointsCount: XXX, ... }
🔍 [BoundaryLayer] Line 2: ...
🔍 [BoundaryLayer] Line 3: ...
✅ [BoundaryLayer] Created XXX boundary lines from XXX rings
🎨 [BoundaryLayer] Rendering XXX lines with color #FFD700
🖊️ [BoundaryLayer] Rendering line 0/XXX
🖊️ [BoundaryLayer] Rendering line 100/XXX
...
```

## 3. 常见错误及解决方法

### 错误 1: 404 Not Found

**日志**:
```
❌ Failed to fetch SHP file: 404 Not Found
```

**原因**: Shapefile 文件不在 public 目录中

**解决**:
```bash
# 检查文件是否存在
ls -la public/shapefiles/

# 应该看到：
# ne_110m_admin_0_countries.shp
# ne_110m_admin_0_countries.dbf
# ne_110m_admin_0_countries.shx
```

### 错误 2: CORS 错误

**日志**:
```
Access to fetch at '...' has been blocked by CORS policy
```

**解决**: 确保使用开发服务器运行 (`npm run dev`)，而不是直接打开 HTML 文件

### 错误 3: shp.combine is not a function

**日志**:
```
TypeError: shp.combine is not a function
```

**解决**:
```bash
# 重新安装 shpjs
npm uninstall shpjs
npm install shpjs
```

### 错误 4: 边界线加载成功但看不见

**可能原因**:
1. **颜色问题**: 边界线颜色可能与背景混淆
   - 尝试更改颜色：在 `src/App.tsx` 中修改 `color: '#FF0000'` (红色)

2. **半径问题**: 边界线可能在地球内部或太远
   - 检查控制台中 `firstPoint` 的坐标值
   - 坐标应该接近 1.005 左右

3. **相机位置**: 相机可能看向错误的方向
   - 尝试用鼠标拖动地球旋转查看不同角度

4. **线条太细**: WebGL 的 lineWidth 限制
   - 已设置为 `lineWidth: 2`
   - @react-three/drei 的 Line 组件应该能正确处理

## 4. 手动测试步骤

### 测试 1: 验证文件加载

打开浏览器访问：
```
http://localhost:5173/shapefiles/ne_110m_admin_0_countries.shp
```

应该能下载文件（不是 404）

### 测试 2: 检查渲染对象

在浏览器控制台输入：
```javascript
// 查看场景中的对象
console.log(window.scene)  // 可能需要在开发者工具中查找 Three.js scene
```

### 测试 3: 临时增加边界线颜色和宽度

编辑 `src/App.tsx`:
```tsx
{
  id: 'countries',
  name: '国界 (110m)',
  shpPath: '/shapefiles/ne_110m_admin_0_countries.shp',
  color: '#FF0000',  // 改为亮红色
  visible: true,
}
```

编辑 `src/components/BoundaryLayer.tsx`:
```tsx
lineWidth = 5,  // 改为 5（更粗）
```

## 5. 检查清单

- [ ] `npm run dev` 正在运行
- [ ] 浏览器开发者工具已打开
- [ ] 控制台没有红色错误信息
- [ ] 看到 "✅ [BoundaryLayer] Created XXX boundary lines" 日志
- [ ] 看到 "🎨 [BoundaryLayer] Rendering XXX lines" 日志
- [ ] 文件 `public/shapefiles/ne_110m_admin_0_countries.shp` 存在
- [ ] 文件 `public/shapefiles/ne_110m_admin_0_countries.dbf` 存在

## 6. 获取帮助

如果以上步骤都无法解决问题，请提供：

1. 完整的控制台日志（复制所有内容）
2. 浏览器版本
3. 操作系统
4. `ls -la public/shapefiles/` 的输出

## 预期结果

成功时，您应该看到：
- 一个带有高质量纹理的地球
- 金色（#FFD700）的国界边界线
- 图层控制面板在左侧
- 可以用鼠标拖动旋转地球
- 可以用滚轮缩放
