# AGENTS.md

本文档为 AI 助手提供项目迭代规则和开发规范。

## 项目概述

这是一个纯前端静态网站，由侧边导航和主内容区域组成。

**核心特点：**

- 主内容通过 **iframe + srcdoc** 加载，实现 CSS 和 JS 完全隔离
- 导航数据和页面内容从**远程 Gist** 同步
- 每个子页面是**完整独立的 HTML**，可单独访问运行

## 技术规范

### 核心原则

- **零框架**：不使用任何 JavaScript 框架
- **零构建**：不使用任何构建工具
- **浏览器直接运行**：所有代码必须能直接在现代浏览器中运行
- **最新标准**：使用 HTML5、CSS3、ES2022+ 特性

### JavaScript 规范

- **JSDoc 类型注解**：所有函数必须包含完整的 JSDoc 注释
- **ES Modules**：使用 `<script type="module">` 和 `import`/`export`
- **共享常量**：跨环境（Node/Browser）共享的常量放在 `shared.js`

## 文件结构

```
/
├── AGENTS.md           # AI 迭代规则
├── index.html          # 主页面入口
├── index.css           # 全局样式
├── index.js            # 主逻辑（导航渲染、iframe 内容加载）
├── shared.js           # 共享常量（NAV_DATA_URL 等）
├── dev.mjs             # 开发启动脚本
├── .gitignore          # Git 忽略规则
├── nav_data.json       # 导航数据（从远程同步，已 gitignore）
└── pages/              # 子页面目录（从远程同步，已 gitignore）
```

## 开发流程

### 启动项目

```bash
node dev.mjs          # 同步资源 + 启动服务器
node dev.mjs --sync   # 仅同步资源
node dev.mjs --serve  # 仅启动服务器
```

### 资源加载策略

| 环境                 | nav_data.json 来源     |
| -------------------- | ---------------------- |
| 开发环境 (localhost) | 优先本地，失败回退远程 |
| 生产环境             | 直接使用远程           |

### 远程资源

- **nav_data.json**: Gist 上的 JSON 文件
- **页面内容**: 根据 nav_data.json 中的 uri 自动同步

## 架构说明

### 侧边导航

- 数据由 `nav_data.json` 驱动
- 每项包含 `title`（标题）和 `uri`（资源 URL）

### 主内容区域

- 使用 **iframe** 加载内容
- 通过 **`srcdoc`** 属性渲染 fetch 获取的 HTML 文本
- 每个子页面拥有独立的 `window` 对象，CSS/JS 完全隔离

### 为什么用 iframe 而非 Shadow DOM

| 特性            | Shadow DOM | iframe   |
| --------------- | ---------- | -------- |
| CSS 隔离        | ✅         | ✅       |
| JS 隔离         | ❌         | ✅       |
| 子页面独立运行  | ❌         | ✅       |
| script 标签执行 | 需手动处理 | 自动执行 |

## 迭代规则

### 添加/修改页面

1. 在远程 Gist 中创建或编辑 HTML 文件
2. 更新 Gist 中的 `nav_data.json`
3. 运行 `node dev.mjs --sync` 同步到本地测试

### 修改共享配置

修改 `shared.js` 中的常量（如 `NAV_DATA_URL`）

### 代码审查要点

- [ ] 是否使用了 JSDoc 注解？
- [ ] 是否能在浏览器中直接运行？
- [ ] 子页面是否为完整独立的 HTML？
- [ ] 共享常量是否放在 shared.js？
