# SmartTerminal 智能终端工具 - 整体计划

&gt; **For agentic workers:** 按照此计划逐步实现智能终端工具

**Goal:** 构建一个运行在Windows上的智能终端工具，集成AI分析能力，支持本地终端和SSH远程连接，提供命令建议和多窗口布局。

**Architecture:** Electron + React + TypeScript 桌面应用，使用 node-pty 处理伪终端，xterm.js 渲染终端界面，ssh2 实现SSH连接，通过OpenAI兼容API提供智能分析。

**Tech Stack:**
- Electron 28.x - 跨平台桌面应用框架
- React 18.x + TypeScript - UI框架
- xterm.js 5.x - 终端模拟器
- node-pty 1.x - 伪终端
- ssh2 1.x - SSH客户端
- electron-builder - 应用打包
- GitHub Actions - CI/CD

---

## 项目结构

```
/workspace/
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── .github/
│   └── workflows/
│       └── build.yml          # CI/CD 配置
├── src/
│   ├── main/                  # Electron 主进程
│   │   ├── index.ts           # 主进程入口
│   │   ├── terminal/          # 终端管理
│   │   │   ├── LocalTerminal.ts
│   │   │   ├── SSHTerminal.ts
│   │   │   └── TerminalManager.ts
│   │   ├── ai/                # AI 分析模块
│   │   │   ├── AIClient.ts
│   │   │   └── Analyzer.ts
│   │   ├── config/            # 配置管理
│   │   │   └── ConfigManager.ts
│   │   └── ipc/               # IPC 通信
│   │       └── ipcHandlers.ts
│   ├── renderer/              # 渲染进程 (React)
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Terminal/
│   │   │   │   ├── TerminalTab.tsx
│   │   │   │   └── XTermTerminal.tsx
│   │   │   ├── Layout/
│   │   │   │   └── WindowManager.tsx
│   │   │   ├── AI/
│   │   │   │   ├── SuggestionPanel.tsx
│   │   │   │   └── CommandConfirmDialog.tsx
│   │   │   └── Settings/
│   │   │       ├── SettingsDialog.tsx
│   │   │       └── APIConfigForm.tsx
│   │   ├── hooks/
│   │   │   └── useTerminal.ts
│   │   ├── store/
│   │   │   └── useAppStore.ts
│   │   └── types/
│   │       └── index.ts
│   └── shared/                # 共享类型和常量
│       └── types.ts
├── resources/                 # 静态资源
└── docs/                      # 文档
    ├── plan.md (本文件)
    ├── rules.md
    ├── progress.md
    └── agent.md
```

## 任务分解

### Task 1: 项目初始化

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.main.json`, `tsconfig.renderer.json`
- Create: `vite.config.ts`
- Create: `electron-builder.yml`
- Create: `.gitignore`
- Create: `src/main/index.ts`, `src/renderer/index.tsx`, `src/renderer/App.tsx`, `src/renderer/index.html`

- [ ] Step 1: 初始化 package.json 并安装依赖
- [ ] Step 2: 配置 TypeScript
- [ ] Step 3: 配置 Vite 和 Electron 构建
- [ ] Step 4: 创建主进程基础代码
- [ ] Step 5: 创建渲染进程基础代码
- [ ] Step 6: 验证开发环境启动

### Task 2: 本地终端实现

**Files:**
- Create: `src/main/terminal/LocalTerminal.ts`
- Create: `src/main/terminal/TerminalManager.ts`
- Create: `src/main/ipc/ipcHandlers.ts`
- Create: `src/renderer/components/Terminal/XTermTerminal.tsx`
- Create: `src/renderer/hooks/useTerminal.ts`
- Create: `src/shared/types.ts`

- [ ] Step 1: 实现 LocalTerminal 类 (node-pty)
- [ ] Step 2: 实现 TerminalManager 管理多个终端实例
- [ ] Step 3: 设置 IPC 通信通道
- [ ] Step 4: 实现 xterm.js 终端组件
- [ ] Step 5: 实现 React hook 连接终端
- [ ] Step 6: 测试本地终端基本功能

### Task 3: SSH 远程连接

**Files:**
- Create: `src/main/terminal/SSHTerminal.ts`
- Modify: `src/main/terminal/TerminalManager.ts`
- Modify: `src/main/ipc/ipcHandlers.ts`
- Create: `src/renderer/components/Terminal/SSHConnectDialog.tsx`

- [ ] Step 1: 实现 SSHTerminal 类 (ssh2 + pty)
- [ ] Step 2: 扩展 TerminalManager 支持 SSH 终端
- [ ] Step 3: 添加 SSH 连接 IPC 处理
- [ ] Step 4: 创建 SSH 连接对话框
- [ ] Step 5: 测试 SSH 连接功能

### Task 4: 多窗口布局管理

**Files:**
- Create: `src/renderer/components/Layout/WindowManager.tsx`
- Create: `src/renderer/components/Terminal/TerminalTab.tsx`
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/store/useAppStore.ts`

- [ ] Step 1: 设计状态管理 (Zustand)
- [ ] Step 2: 实现 WindowManager 多分栏布局
- [ ] Step 3: 实现终端标签页管理
- [ ] Step 4: 支持拖拽调整窗口大小
- [ ] Step 5: 支持新建/关闭终端窗口

### Task 5: AI 模型配置

**Files:**
- Create: `src/main/config/ConfigManager.ts`
- Create: `src/main/ai/AIClient.ts`
- Create: `src/renderer/components/Settings/SettingsDialog.tsx`
- Create: `src/renderer/components/Settings/APIConfigForm.tsx`
- Modify: `src/main/ipc/ipcHandlers.ts`

- [ ] Step 1: 实现 ConfigManager (electron-store)
- [ ] Step 2: 实现 AIClient (OpenAI兼容API)
- [ ] Step 3: 添加配置 IPC 通道
- [ ] Step 4: 创建设置对话框
- [ ] Step 5: 实现 API 配置表单
- [ ] Step 6: 测试 API 连接功能

### Task 6: 智能分析与建议

**Files:**
- Create: `src/main/ai/Analyzer.ts`
- Create: `src/renderer/components/AI/SuggestionPanel.tsx`
- Modify: `src/renderer/components/Terminal/XTermTerminal.tsx`
- Modify: `src/shared/types.ts`

- [ ] Step 1: 实现 Analyzer 核心逻辑
- [ ] Step 2: 设计 Prompt 工程 (命令分析、建议生成)
- [ ] Step 3: 实现输出捕获和上下文管理
- [ ] Step 4: 创建建议面板 UI
- [ ] Step 5: 实现建议选择和执行流程
- [ ] Step 6: 实现循环反馈机制 (判断执行结果)

### Task 7: 命令黑名单

**Files:**
- Create: `src/renderer/components/AI/CommandConfirmDialog.tsx`
- Modify: `src/main/ai/Analyzer.ts`
- Modify: `src/main/config/ConfigManager.ts`
- Modify: `src/renderer/components/Settings/SettingsDialog.tsx`

- [ ] Step 1: 黑名单配置管理
- [ ] Step 2: 实现命令检测逻辑
- [ ] Step 3: 创建确认对话框
- [ ] Step 4: 区分AI建议命令和用户输入命令
- [ ] Step 5: 测试黑名单拦截和用户确认流程

### Task 8: UI 完善与优化

**Files:**
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/components/Layout/Toolbar.tsx`
- Create: `src/renderer/styles/global.css`
- Modify: 所有组件样式

- [ ] Step 1: 实现顶部工具栏
- [ ] Step 2: 优化终端样式
- [ ] Step 3: 添加加载状态和错误提示
- [ ] Step 4: 响应式布局优化
- [ ] Step 5: 添加快捷键支持

### Task 9: GitHub CI/CD 配置

**Files:**
- Create: `.github/workflows/build.yml`
- Modify: `electron-builder.yml`
- Create: `build/installer.nsh` (可选)

- [ ] Step 1: 配置 GitHub Actions workflow
- [ ] Step 2: 配置 Windows 构建环境
- [ ] Step 3: 配置代码签名 (可选)
- [ ] Step 4: 配置自动发布到 GitHub Releases
- [ ] Step 5: 测试 CI/CD 流程

### Task 10: 测试与打包验证

- [ ] Step 1: 本地功能测试
- [ ] Step 2: Windows 打包测试
- [ ] Step 3: 安装包测试
- [ ] Step 4: 问题修复和优化
