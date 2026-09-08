# 实用小工具集

纯前端本地小工具集合，数据不上传服务器。打开首页即可浏览全部工具。

## 使用方式

1. 浏览器打开 `index.html` 进入工具首页
2. 或通过本地 HTTP 服务访问：

```bash
cd D:\guandq\image-converter
python -m http.server 8080
```

访问：http://localhost:8080

## 目录结构

```
image-converter/
├── index.html                  # 工具首页（工具列表）
├── tools/
│   └── image-converter.html    # 图片格式转换
├── css/
│   ├── common.css              # 公共样式
│   ├── home.css                # 首页样式
│   └── tool.css                # 工具页通用样式
├── js/
│   ├── tools-config.js         # 工具注册表（新增工具在此配置）
│   ├── home.js                 # 首页列表渲染
│   ├── image-converter.js      # 图片转换逻辑
│   └── zip.js                  # 本地 ZIP 打包
└── README.md
```

## 新增工具

只需两步：

**1. 在 `js/tools-config.js` 追加配置：**

```javascript
{
  id: 'your-tool-id',
  name: '工具名称（以作用命名）',
  desc: '工具功能描述',
  path: 'tools/your-tool.html',
  tags: ['标签1', '标签2'],
}
```

**2. 创建对应页面 `tools/your-tool.html`**

可参考 `tools/image-converter.html` 的结构，引入 `../css/common.css` 及工具专用样式/脚本，并加上返回首页链接。

## 当前工具

| 名称 | 说明 |
|------|------|
| 图片格式转换 | 本地图片转 PNG / JPG，支持调整尺寸与批量处理 |

## 依赖

无外部 CDN 依赖，ZIP 打包由内置 `js/zip.js` 实现，支持离线 / `file://` 直接打开。
