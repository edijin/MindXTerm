# SmartTerminal 开发规则

## 鼓励的做法

### 代码质量
- ✅ 使用 TypeScript 严格类型，避免 `any` 类型
- ✅ 遵循 ESLint 和 Prettier 代码规范
- ✅ 每个文件职责单一，函数简洁明了
- ✅ 添加必要的注释解释复杂逻辑
- ✅ 使用一致的命名约定：
  - 组件: PascalCase (如 `TerminalTab.tsx`)
  - 工具函数/类: PascalCase (如 `ConfigManager.ts`)
  - 变量/函数: camelCase
  - 常量: UPPER_SNAKE_CASE

### 架构设计
- ✅ 主进程和渲染进程职责分离
- ✅ 通过 IPC 进行进程间通信，不直接共享内存
- ✅ 终端实例通过 TerminalManager 统一管理
- ✅ 配置通过 ConfigManager 集中管理，使用 electron-store 持久化
- ✅ AI 模块独立封装，便于替换不同模型提供商
- ✅ React 组件使用函数组件和 Hooks
- ✅ 使用 Zustand 进行轻量级状态管理

### 安全性
- ✅ SSH 密码/密钥安全存储，不明文保存敏感信息
- ✅ API Key 加密存储
- ✅ 黑名单命令必须用户确认后才能执行
- ✅ 区分用户主动输入命令和AI建议命令
- ✅ 所有外部输入进行适当验证和转义

### 用户体验
- ✅ 提供清晰的加载状态和错误提示
- ✅ 操作支持撤销/回退（适当时）
- ✅ 快捷键支持提高效率
- ✅ 终端响应流畅，无明显卡顿
- ✅ AI 建议可快速选择或忽略

### Git 提交
- ✅ 使用 Conventional Commits 规范：
  - `feat:` 新功能
  - `fix:` 修复bug
  - `docs:` 文档更新
  - `refactor:` 重构
  - `chore:` 构建/工具变更
- ✅ 原子提交，每个提交只做一件事
- ✅ 提交前更新 progress.md
- ✅ 提交信息清晰描述变更内容

## 禁止的做法

### 代码质量
- ❌ 禁止使用 `any` 类型（除非有充分理由并注释说明）
- ❌ 禁止硬编码配置值（使用配置文件或环境变量）
- ❌ 禁止在渲染进程中直接使用 Node.js API（必须通过 IPC）
- ❌ 禁止在组件中直接操作 DOM（使用 React 状态和 Refs）
- ❌ 禁止提交 console.log 调试代码（使用 electron-log）

### 架构设计
- ❌ 禁止主进程和渲染进程直接引用对方模块
- ❌ 禁止在渲染进程中直接实例化 node-pty 或 ssh2
- ❌ 禁止循环依赖
- ❌ 禁止将业务逻辑写在 React 组件中，应抽离到 hooks 或工具类

### 安全性
- ❌ 禁止在日志中输出敏感信息（API Key、密码、密钥）
- ❌ 禁止自动执行黑名单中的命令
- ❌ 禁止忽略 SSL 证书验证
- ❌ 禁止将用户配置提交到版本控制

### 用户体验
- ❌ 禁止阻塞 UI 线程的长时同步操作
- ❌ 禁止在未告知用户的情况下执行危险操作
- ❌ 禁止 AI 自动执行命令（必须用户确认选择）
- ❌ 禁止无提示的错误失败

### Git 提交
- ❌ 禁止提交 node_modules、dist、build 等构建产物
- ❌ 禁止大文件提交（&gt;10MB）
- ❌ 禁止混合不相关的变更在一个提交
- ❌ 禁止在未测试的情况下提交代码

## IPC 通信规则

所有 IPC 通道必须定义在共享类型中，使用类型安全的调用方式：

```typescript
// 通道命名规范: domain:action
// 示例:
'terminal:create'
'terminal:write'
'terminal:resize'
'ssh:connect'
'ai:analyze'
'config:get'
'config:set'
```

## 终端数据流规则

1. 用户输入 → 渲染进程捕获 → IPC 发送到主进程 → 写入 pty
2. pty 输出 → 主进程监听 → IPC 发送到渲染进程 → xterm.js 渲染
3. 命令执行完成检测 → 主进程分析输出 → 触发 AI 分析 → 返回建议到渲染进程
4. 用户选择建议 → 黑名单检查 → 写入终端执行 → 循环检测结果

## 版本管理规则

- 主版本号: 不兼容的架构变更
- 次版本号: 新功能添加
- 修订号: Bug修复
- 版本号格式: vMAJOR.MINOR.PATCH (如 v1.0.0)

## 文件组织规则

```
src/main/        - 主进程代码（Node.js 环境）
src/renderer/    - 渲染进程代码（浏览器环境 + React）
src/shared/      - 共享类型定义和常量
resources/       - 静态资源（图标、模板等）
build/           - 构建相关脚本和配置
.github/         - GitHub Actions 和相关配置
docs/            - 项目文档（plan.md, rules.md, progress.md, agent.md）
```
