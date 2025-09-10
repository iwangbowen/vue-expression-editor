# Copilot 指令

## 项目概述

这是一个 Vue 3 数学表达式编辑器组件库，导出单个 `ExpressionEditor` 组件，具备完整的公式编辑功能。

## 架构与核心组件

### 核心结构
- **主入口**: `src/index.ts` - 导出 `ExpressionEditor` 组件并提供 Vue 插件接口的入口点
- **主要组件**: `src/components/ExpressionEditor.vue` - 约1800行代码，包含主要编辑器逻辑
- **服务层**: `src/services/` - 四个专门的服务处理不同方面：
  - `expressionService.ts` - 表达式验证和解析逻辑
  - `variableService.ts` - 变量插入和格式化
  - `inputService.ts` - 输入处理和光标管理
  - `expressionCalculationService.ts` - 数学运算

### 数据流模式
编辑器使用双模型方法：
1. **内部表达式**: 使用变量代码的原始公式 (`sales + cost`)
2. **显示表达式**: 用户友好的变量名称公式 (`销售额 + 成本`)

变量流转: `Variable[]` → 变量选择 → 格式插入 → 表达式更新 → 显示转换

## 开发工作流

### 构建命令
- `npm run dev` - 用于组件开发的 Vite 开发服务器
- `npm run build` - 库构建 (双重 CJS/ESM + TypeScript 声明)
- `npm run build:demo` - GitHub Pages 演示页面构建
- `npm run preview` - 本地预览演示构建

### 部署策略
- **演示部署**: 在提交信息中包含 `[deploy]` 时自动触发或手动调度
- **NPM 发布**: 由 GitHub releases 触发或带版本输入的手动工作流
- 使用两个独立的 GitHub Actions 工作流，具有正确的 npm 注册表配置

## 项目特定模式

### 变量系统
变量使用 `{ name: string, code: string }` 接口，其中：
- `name` 是显示文本 (支持中文/英文)
- `code` 是用于实际计算的标识符
- 变量插入由 `@` 字符触发，带自动完成功能

### 基于标记的表达式解析
显示层使用标记化进行语法高亮：
```typescript
Token { type: 'bracket' | 'variable' | 'operator' | 'text', bracketStatus: 'matched' | 'unmatched', bracketIndex: number }
```

### 国际化集成
- 语言文件: `src/locales/zh.ts` 和 `src/locales/en.ts`
- 通过 `language` 属性进行组件级语言切换
- 所有面向用户的字符串必须可翻译

### Element Plus 依赖
组件需要特定的 Element Plus 组件：
`ElButton`, `ElInput`, `ElPopover`, `ElDialog`, `ElSwitch`, `ElTooltip`
采用对等依赖方式 - 消费者必须提供 Element Plus

### 样式架构
- `src/styles/` 和 `src/components/styles/` 中的 SCSS 模块
- 用于主题化的 CSS 自定义属性 (`--editor-bg`, `--editor-text` 等)
- 通过 CSS 类切换支持暗色模式

## 关键集成点

### Vite 配置
- 双重构建模式: 通过 `mode` 参数区分库构建与演示构建
- 在库构建中使用 CSS 注入插件处理组件样式
- 使用 `vite-plugin-dts` 生成 TypeScript 声明文件

### 表达式验证链
1. 括号匹配验证
2. 字符白名单检查 (`ALLOWED_CHARS` 常量)
3. 根据提供的 Variable 数组验证变量代码
4. 为计算就绪性进行数学语法解析

## 开发指南

### 文档同步
- **始终同时维护** `README.md` (中文) 和 `README.en.md` (英文) 的相同内容
- 版本变更需要更新两个文件

### 组件 API 接口
通过模板引用公开方法: `validateExpression()`, `clearAll()`, `focusInput()`, `getExpression()` 等
事件系统: `@update:modelValue`, `@validation-change`, `@change` 等

### 服务层修改
修改服务时，确保维护静态方法模式 - 所有服务都使用静态方法进行无状态操作

### 类型安全
在 `src/types.ts` 和 `src/types/index.ts` 中维护 TypeScript 接口 - 为了兼容性存在一些重复
