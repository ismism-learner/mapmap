# 地球纹理下载指南

## 推荐的高质量地球纹理

### 方法 1: 使用 NASA 可见地球纹理

1. 访问 [NASA Visible Earth](https://visibleearth.nasa.gov/)
2. 下载 "Blue Marble" 系列纹理
3. 推荐下载链接（直接下载）:
   - 2K 版本: https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
   - 高分辨率版本: https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200409.3x5400x2700.jpg

### 方法 2: 使用 Solar System Scope 纹理

1. 访问 [Solar System Scope Textures](https://www.solarsystemscope.com/textures/)
2. 下载 "Earth Daymap" 纹理:
   - 2K: https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
   - 4K: https://www.solarsystemscope.com/textures/download/4k_earth_daymap.jpg
   - 8K: https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg

### 方法 3: 使用命令行下载

```bash
# 下载 NASA Blue Marble (推荐)
cd public
curl -o earth_hq.jpg "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg"

# 或者下载 Solar System Scope 2K 版本
curl -o earth_hq.jpg "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg"
```

## 安装纹理

下载后，将文件重命名为 `earth_hq.jpg` 并放入 `public/` 目录：

```bash
mv downloaded_texture.jpg public/earth_hq.jpg
```

## 纹理要求

- **格式**: JPG 或 PNG
- **最小分辨率**: 2048x1024 (2:1 宽高比)
- **推荐分辨率**: 4096x2048 或 8192x4096
- **投影方式**: 等距圆柱投影（Equirectangular）

## 使用纹理

纹理文件应放置在 `public/` 目录，应用会自动加载。
