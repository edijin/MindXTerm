# SmartTerminal 项目状态指南

## 项目概述

SmartTerminal 是一个运行在 Windows 上的智能终端工具，集成 AI 分析能力，支持本地终端和 SSH 远程连接，能够分析用户命令执行情况并提供下一步建议。

## 文档说明

本项目使用以下文档进行管理，每次提交前必须根据当前状态更新这些文件：

### 1. plan.md - 整体计划
**用途**: 存储项目的整体开发计划，包括技术栈选择、项目结构、任务分解。
**使用方式**:
- 项目开始时制定
- 开发过程中如果有重大架构调整需要更新
- 任务完成后标记对应步骤
- 作为新加入开发者的快速上手指南

### 2. rules.md - 开发规则
**用途**: 说明开发过程中鼓励的做法和禁止的事项。
**使用方式**:
- 编码前阅读，确保符合规范
- 代码评审时作为检查依据
- 发现新的规则时及时补充

### 3. progress.md - 开发进度
**用途**: 记录当前开发进度，跟踪任务完成状态。
**使用方式**:
- **每次提交前必须更新**
- 更新对应任务的完成状态
- 在开发日志中记录本次变更
- 更新已知问题列表

### 4. agent.md - 本文件
**用途**: 项目状态总览和文档使用指南。
**使用方式**:
- 每次开始工作前阅读，了解当前状态
- 记录重要的架构决策
- 记录环境配置要求
- 记录构建和运行方式

---

## 当前状态

**最新更新**: 2026-06-25
**当前阶段**: 项目初始化
**完成度**: 5% (文档完成)
**阻塞项**: 无

### 已完成
- ✅ 项目规划和技术栈选型
- ✅ 创建 plan.md 开发计划
- ✅ 创建 rules.md 开发规则
- ✅ 创建 progress.md 进度跟踪
- ✅ 创建 agent.md 状态指南

### 进行中
- 🔄 Task 1: 项目初始化

### 待开始
- Task 2 ~ Task 10 (详见 plan.md 和 progress.md)

---

## 快速开始

### 环境要求
- Node.js &gt;= 18.x
- npm &gt;= 9.x 或 yarn &gt;= 1.22.x 或 pnpm &gt;= 8.x
- Windows 10/11 (运行环境)
- Windows Build Tools (node-pty 编译需要)
  - `npm install --global windows-build-tools` (管理员模式)
  - 或安装 Visual Studio Build Tools 2019/2022

### 开发流程

1. **首次克隆后**
```bash
# 安装依赖
npm install

# 启动开发模式 (主进程 + 渲染进程热重载)
npm run dev
```

2. **日常开发**
```bash
npm run dev          # 启动开发环境
npm run lint         # 代码检查
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试 (如果有)
```

3. **提交前检查清单**
- [ ] 代码通过 lint 和 typecheck
- [ ] 功能已手动测试
- [ ] 更新 progress.md 记录进度
- [ ] 如有必要更新 plan.md / rules.md
- [ ] 提交信息符合 Conventional Commits 规范

4. **打包构建**
```bash
npm run build        # 构建
npm run dist         # 打包 Windows 安装包
```

---

## 架构决策记录

### ADR-001: 技术栈选择 - Electron + React + TypeScript
**日期**: 2026-06-25
**状态**: 采纳
**背景**: 需要开发 Windows 桌面终端应用，需要本地终端能力和现代 UI。
**决策**: 使用 Electron 作为桌面框架，React 作为 UI 库，TypeScript 保证类型安全。
**理由**:
- Electron 成熟稳定，生态丰富，有大量终端相关库支持
- React 组件化开发效率高，社区活跃
- TypeScript 类型安全减少运行时错误
- node-pty + xterm.js 是 Electron 终端的标准组合

**备选方案**:
- Tauri: 更轻量，但 Rust 学习成本高，node-pty 集成复杂
- WPF + .NET: Windows 原生，但跨平台能力弱，前端生态不如图 React

### ADR-002: 状态管理 - Zustand
**日期**: 2026-06-25
**状态**: 采纳
**背景**: 需要管理多终端标签、窗口布局、设置等状态。
**决策**: 使用 Zustand 作为状态管理库。
**理由**:
- 轻量简单，API 简洁
- 对 TypeScript 支持好
- 适合中等复杂度的应用状态管理，无需 Redux 的繁琐

### ADR-003: AI 接口 - OpenAI 兼容协议
**日期**: 2026-06-25
**状态**: 采纳
**背景**: 用户需要自定义模型 API 配置。
**决策**: 使用 OpenAI Chat Completions 兼容协议。
**理由**:
- 事实上的标准，大多数模型提供商都兼容
- 用户可以灵活接入各种模型服务
- 实现简单，维护成本低

---

## 目录结构说明

```
/workspace/
├── .github/workflows/    # CI/CD 配置
├── docs/                 # 项目文档 (本目录)
│   ├── plan.md
│   ├── rules.md
│   ├── progress.md
│   └── agent.md
├── src/
│   ├── main/             # Electron 主进程 (Node.js)
│   │   ├── terminal/     # 终端相关 (Local/SSH)
│   │   ├── ai/           # AI 分析模块
│   │   ├── config/       # 配置管理
│   │   └── ipc/          # IPC 通信处理
│   ├── renderer/         # React 渲染进程
│   │   ├── components/   # React 组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   └── store/        # Zustand 状态
│   └── shared/           # 主/渲染进程共享类型
├── resources/            # 图标等静态资源
└── build/                # 构建配置和脚本
```

---

## IPC 通道设计 (预定义)

| 通道 | 方向 | 说明 |
|------|------|------|
| `terminal:create-local` | Renderer → Main | 创建本地终端 |
| `terminal:create-ssh` | Renderer → Main | 创建 SSH 终端 |
| `terminal:write` | Renderer → Main | 向终端写入数据 |
| `terminal:resize` | Renderer → Main | 调整终端大小 |
| `terminal:close` | Renderer → Main | 关闭终端 |
| `terminal:data` | Main → Renderer | 终端输出数据 |
| `ssh:connect` | Renderer → Main | 发起 SSH 连接 |
| `ssh:disconnect` | Renderer → Main | 断开 SSH 连接 |
| `ai:analyze` | Renderer → Main | 请求 AI 分析 |
| `config:get` | Renderer → Main | 获取配置 |
| `config:set` | Renderer → Main | 保存配置 |
| `config:test-api` | Renderer → Main | 测试 API 连接 |

---

## 命令执行流程

```
用户输入命令
    ↓
写入终端 (node-pty / ssh2)
    ↓
捕获命令执行输出 (等待 shell 提示符返回)
    ↓
发送到 AI 分析 (命令 + 输出 + 上下文历史)
    ↓
AI 返回下一步建议 (多个选项)
    ↓
显示建议面板给用户选择
    ↓
用户选择建议?
    ├─ 是 → 检查是否黑名单命令
    │       ├─ 是黑名单 → 弹出确认对话框 → 用户确认后执行
    │       └─ 非黑名单 → 直接写入终端执行
    └─ 否 → 继续等待用户输入
    ↓
捕获执行结果 → 判断是否达到预期 → 继续循环...
```

---

## 更新日志

- 2026-06-25: 项目初始化，创建所有规划文档
