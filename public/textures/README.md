# 地球底图使用说明

这个文件夹用于存放地球底图纹理。

## 📁 文件夹结构

```
public/textures/
├── earth_hq.jpg          # 默认地球纹理
├── textures.json         # 底图配置文件
├── your_custom_map.jpg   # 你的自定义底图
└── README.md            # 本说明文档
```

## 🎨 添加自定义底图

### 步骤1：准备底图文件

将你的底图图片文件（JPG、PNG等）放入这个文件夹。

**推荐规格：**
- 格式：JPG 或 PNG
- 分辨率：2048x1024 或更高（2:1 比例）
- 投影方式：等距圆柱投影（Equirectangular Projection）
- 文件大小：建议小于10MB以保证加载速度

### 步骤2：更新配置文件

编辑 `textures.json` 文件，添加你的底图配置：

```json
[
  {
    "id": "earth_hq",
    "name": "默认地球",
    "path": "/textures/earth_hq.jpg",
    "description": "高质量地球纹理"
  },
  {
    "id": "my_custom_map",
    "name": "我的自定义地图",
    "path": "/textures/your_custom_map.jpg",
    "description": "这是我的自定义底图"
  }
]
```

**配置字段说明：**
- `id`: 唯一标识符（英文，不含空格）
- `name`: 显示在下拉菜单中的名称
- `path`: 文件路径（相对于 public 文件夹）
- `description`: 可选的描述信息

### 步骤3：使用底图

1. 刷新页面
2. 打开左上角的"图层控制"面板
3. 在"🗺️ 地球底图"下拉菜单中选择你的底图

## 🌍 推荐底图资源

### 免费资源：
- **Natural Earth**: https://www.naturalearthdata.com/
- **NASA Visible Earth**: https://visibleearth.nasa.gov/
- **Blue Marble**: https://visibleearth.nasa.gov/collection/1484/blue-marble

### 商业资源：
- **Mapbox**: https://www.mapbox.com/
- **Google Earth Engine**: https://earthengine.google.com/

## 💡 技巧和建议

1. **性能优化**：使用适当压缩的图片以加快加载速度
2. **颜色校正**：确保底图颜色与光照效果协调
3. **多版本**：可以准备白天、夜晚、地形等多个版本
4. **测试**：添加新底图后建议清除浏览器缓存测试

## ⚠️ 注意事项

- 确保底图文件名不含中文或特殊字符
- 图片比例应为 2:1（宽度是高度的2倍）
- 配置文件必须是有效的 JSON 格式
- 修改配置后需要刷新页面才能看到更改

## 🔧 故障排除

**问题：底图没有出现在下拉菜单中**
- 检查 `textures.json` 的 JSON 格式是否正确
- 确认文件路径是否正确
- 打开浏览器控制台查看错误信息

**问题：底图加载失败或显示错误**
- 检查图片文件是否存在
- 确认图片格式是否支持
- 检查图片是否损坏

**问题：底图显示扭曲**
- 确保使用等距圆柱投影（Equirectangular）
- 检查图片比例是否为 2:1

---

如有问题，请查看控制台日志或提交 Issue。
