# JSON 格式化工具 v2.0

> 一个现代化、简约、功能丰富的 JSON 在线格式化和验证工具

基于 React + TypeScript + Vite 构建，使用 Monaco Editor 提供专业的编辑体验。

![Version](https://img.shields.io/badge/version-2.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6)

## 📸 预览

![JSON 格式化工具截图](images/screenshot.png)

## ✨ 主要特性

- 🎨 **Monaco Editor** - VS Code 同款编辑器，提供专业的代码编辑体验
- ⚡ **自动格式化** - 输入后 500ms 自动格式化，无需手动点击
- 🌙 **深色模式** - 支持浅色/深色主题切换，护眼舒适
- 📱 **响应式设计** - 完美适配桌面、平板和移动设备
- 🚀 **实时处理** - JSON 格式化、压缩、验证
- 🔗 **嵌套解析** - 智能解析嵌套的 JSON 字符串
- 💾 **智能缓存** - 自动保存输入内容，刷新页面不丢失

## 🚀 快速开始

### 在线使用

直接访问部署的网站即可使用，无需安装任何软件。

### 本地开发

```bash
# 克隆项目
git clone https://github.com/crazykun/json-format.git
cd json-format

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:8000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 部署 dist/ 目录到服务器
```

## 📖 使用说明

### 基本操作

1. **输入 JSON** - 在左侧编辑器输入或粘贴 JSON 数据
2. **自动格式化** - 系统会在停止输入 500ms 后自动格式化
3. **手动操作** - 使用顶部工具栏进行格式化、压缩、验证等操作
4. **查看结果** - 右侧编辑器显示处理后的 JSON
5. **导出数据** - 点击"复制"或"下载"按钮保存结果

### 工具栏功能

| 按钮 | 图标 | 功能说明 |
|------|------|----------|
| 格式化 | 🎨 | 美化 JSON，添加缩进和换行 |
| 压缩 | 📦 | 移除空格和换行，压缩 JSON |
| 验证 | ✓ | 检查 JSON 语法是否正确 |
| 清空 | 🗑️ | 清空所有内容 |
| 复制 | 📋 | 复制输出结果到剪贴板 |
| 下载 | 💾 | 下载为 JSON 文件 |
| 嵌套解析 | 🔗 | 智能解析嵌套的 JSON 字符串 |
| 深色模式 | 🌙/☀️ | 切换浅色/深色主题 |

### 拖拽上传

直接将 `.json` 文件拖拽到左侧编辑器即可自动加载。

### 键盘快捷键

- `Ctrl/Cmd + Enter` - 手动触发格式化

## 🛠️ 技术栈

### 核心框架

- **React 18** - 现代化的 UI 框架
- **TypeScript 5.3** - 类型安全的 JavaScript
- **Vite 5** - 快速的现代构建工具

### 主要依赖

- **Monaco Editor** - VS Code 的编辑器核心
- **Zustand** - 轻量级状态管理（<1KB）
- **Tailwind CSS** - 实用优先的 CSS 框架（支持深色模式）
- **file-saver** - 文件下载工具
- **clsx** - 条件类名工具

## 📁 项目结构

```text
json-format/
├── src/
│   ├── components/           # React 组件
│   │   ├── Header.tsx        # 顶部工具栏
│   │   ├── JsonEditor.tsx    # JSON 编辑器（含自动格式化）
│   │   ├── Footer.tsx        # 页脚
│   │   └── Notification.tsx  # 通知组件
│   ├── store/               # 状态管理
│   │   └── useJsonStore.ts  # Zustand store
│   ├── utils/               # 工具函数
│   │   ├── fileUtils.ts     # 文件操作
│   │   ├── storage.ts       # 本地存储工具
│   │   └── monacoTheme.ts   # Monaco 编辑器主题
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── config.ts            # 应用配置
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式（含深色模式）
├── public/                  # 静态资源
│   ├── favicon.ico
│   └── sample.json          # 示例数据
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── tailwind.config.js       # Tailwind 配置
├── postcss.config.js        # PostCSS 配置
├── .eslintrc.cjs            # ESLint 配置
├── package.json             # 项目依赖
├── README.md                # 本文件
└── LICENSE                  # MIT 许可证
```

## 🎨 自定义配置

在 `src/config.ts` 中可以自定义应用配置：

```typescript
export const config: AppConfig = {
  version: '2.0.0',
  features: {
    enableDragDrop: true,           // 启用拖拽上传
    enableKeyboardShortcuts: true,  // 启用键盘快捷键
    enableNotifications: true,      // 启用通知提示
    enableAutoFormat: true,         // 启用自动格式化
    enableNestedParse: true,        // 启用嵌套解析
    enableDarkMode: true,           // 启用深色模式
    // ...
  },
  ui: {
    theme: 'light',                 // 默认主题 ('light' | 'dark')
    maxFileSize: 10 * 1024 * 1024, // 最大文件 10MB
    debounceDelay: 300,            // 防抖延迟
  },
  // 备案信息（可选）
  icp: {
    number: '京ICP备12345678号-1',
    link: 'https://beian.miit.gov.cn/',
  },
  policeRegistration: {
    number: '京公网安备 11010802012345号',
    link: 'http://www.beian.gov.cn/',
  },
};
```

### 深色模式配置

深色模式通过 Tailwind CSS 的 `dark:` 前缀实现，配置在 `tailwind.config.js` 中：

```javascript
export default {
  darkMode: 'class', // 基于 class 的深色模式
  // ...
}
```

主题状态保存在 localStorage 中，页面刷新时会自动恢复用户的主题偏好。

## 🚀 部署

### 静态网站托管

构建后将 `dist/` 目录部署到任何静态网站托管服务：

- **Vercel** - `vercel --prod`
- **Netlify** - 直接拖拽 dist 目录
- **GitHub Pages** - 推送到 gh-pages 分支
- **传统服务器** - 上传 dist 目录到网站根目录

### 环境要求

- Node.js ≥ 16
- npm ≥ 8 或 yarn ≥ 1.22

## 🎉 更新日志

### v2.0.0 (2025-12-11)

#### 🎨 全新设计

- 简约绿色配色方案
- 深色模式支持，护眼舒适
- 最大化编辑器显示空间
- 优化移动端适配

#### ⚡ 新功能

- 🌙 **深色模式** - 支持浅色/深色主题切换
- 🔗 **嵌套解析** - 智能解析嵌套的 JSON 字符串
- ⚡ **自动格式化** - 输入 500ms 后自动触发
- 💾 **智能缓存** - 自动保存输入内容和设置
- 📱 **完整响应式** - 完美适配所有设备
- 🎯 **按钮图标优化** - 更直观的操作界面

#### 🔧 技术升级

- 完全重构：React + TypeScript + Vite
- Monaco Editor 提供专业编辑体验
- Zustand 轻量级状态管理
- Tailwind CSS 现代化样式系统（支持深色模式）
- 优化的主题预加载，避免白屏闪动

#### 📦 优化

- 更好的类型安全
- 更快的构建速度
- 更小的包体积
- 更好的代码组织
- 修复 StrictMode 下的重复执行问题

### v1.0.0

- 初始版本：基于原生 JavaScript

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议发布。

## ⭐ Star History

如果这个项目对你有帮助，请给一个 Star ⭐️

---

**感谢使用 JSON 格式化工具！** 🎉

Made with ❤️ by JSON Tool Team
