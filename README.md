# 图片格式转换工具

纯前端本地图片转换小工具，支持 PNG / JPG 格式互转、自定义尺寸、单张或批量处理。

## 功能

- 选择本地图片（点击或拖拽，支持多选）
- 输出格式：PNG、JPG
- JPG 质量可调（10% ~ 100%）
- 尺寸：保持原尺寸 / 自定义宽高（可保持宽高比）
- 批量转换，单张下载或 ZIP 打包下载
- 全部在浏览器本地处理，不上传服务器

## 使用方式

1. 直接用浏览器打开 `index.html`
2. 或通过本地 HTTP 服务访问（推荐，避免部分浏览器 file:// 限制）：

```bash
# Python 3
cd D:\guandq\image-converter
python -m http.server 8080
```

浏览器访问：http://localhost:8080

## 目录结构

```
image-converter/
├── index.html      # 主页面
├── css/style.css   # 样式
├── js/app.js       # 转换逻辑
├── js/zip.js       # 本地 ZIP 打包（无 CDN 依赖）
└── README.md
```

## 支持输入格式

JPG、PNG、GIF、WebP、BMP 等浏览器可解码的图片格式。

## 依赖

无外部依赖，ZIP 打包由内置 `js/zip.js` 纯 JS 实现，支持离线 / `file://` 直接打开。
