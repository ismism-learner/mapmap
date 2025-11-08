#!/bin/bash

# 下载高质量地球纹理的脚本

echo "正在下载高质量地球纹理..."

# 尝试从多个源下载
# 源 1: 8K 地球纹理 (较大但高质量)
curl -L -o public/earth_8k.jpg "https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg" 2>/dev/null

if [ ! -f public/earth_8k.jpg ] || [ ! -s public/earth_8k.jpg ]; then
    echo "8K 纹理下载失败，尝试 4K 版本..."
    # 源 2: 4K 地球纹理
    curl -L -o public/earth_4k.jpg "https://www.solarsystemscope.com/textures/download/4k_earth_daymap.jpg" 2>/dev/null
fi

if [ ! -f public/earth_4k.jpg ] || [ ! -s public/earth_4k.jpg ]; then
    echo "4K 纹理下载失败，尝试 2K 版本..."
    # 源 3: 2K 地球纹理
    curl -L -o public/earth_2k.jpg "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg" 2>/dev/null
fi

echo "纹理下载完成！"
echo "请运行 'npm run dev' 启动应用"
