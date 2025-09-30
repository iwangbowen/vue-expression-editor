# Copilot 指令

## 项目概述

这是一个 Vue 3 数学表达式编辑器组件库，导出单个 `ExpressionEditor` 组件，具备完整的公式编辑功能。项目处于**快速开发阶段**，会定期更新。

## 架构与核心组件

### 核心结构
- **入口文件**：`src/index.ts` - 导出 `ExpressionEditor` 和 `VariableItem` 组件，提供 Vue 插件接口
- **主组件**：`src/components/ExpressionEditor.vue` - 约 1800 行代码，包含主要编辑器逻辑
- **服务层**：`src/services/` - 四个专门的无状态服务：
  - `expressionService.ts` - 表达式验证和解析逻辑
  - `variableService.ts` - 变量插入和格式化
  - `inputService.ts` - 输入处理和光标管理
  - `expressionCalculationService.ts` - 数学运算
- **常量定义**：`src/constants/editor.ts` - 定义了 `ALLOWED_CHARS`、`BRACKET_COLORS`、字体大小和控制键

### 数据流模式
编辑器使用**双模型方法**：
1. **内部表达式**：使用变量代码的原始公式（`sales + cost`）
2. **显示表达式**：用户友好的变量名称公式（`销售额 + 成本`）

变量流转：`Variable[]` → 变量选择 → 格式化插入 → 表达式更新 → 显示转换

**基于标记的渲染**：显示层对表达式进行标记化以实现语法高亮，类型包括：`'bracket' | 'variable' | 'operator' | 'text'`

## 开发工作流

### 构建命令
```bash
npm run dev              # 组件开发的 Vite 开发服务器（端口 5173）
npm run build            # 库构建（双重 CJS/ESM + TypeScript 声明）
npm run build:demo       # 构建 GitHub Pages 演示页面
npm run preview          # 本地预览演示构建
npm run type-check       # TypeScript 类型检查（CI 中可选）
```

### 部署策略
- **演示部署**：提交信息包含 `[deploy]` 时自动触发，或手动调度
  - 工作流：`.github/workflows/deploy-demo.yml`
  - 仅在 `src/`、`public/`、`index.html`、`vite.config.ts`、`package.json` 变更时触发
  - 排除：`*.md`、`.gitignore`、`.editorconfig`、`LICENSE`
  - **关键**：使用 npm 官方源，带重试机制（最多 3 次）和 yarn 降级
- **NPM 发布**：由 GitHub releases 触发，或带版本输入的手动工作流
  - 工作流：`.github/workflows/npm-publish.yml`
  - 需要在仓库设置中配置 `NPM_TOKEN` 密钥
  - 手动发布：通过 workflow dispatch 提供版本号（如 1.0.0）

### CI 配置模式
两个工作流使用相同的 npm 配置以确保可靠性：
```bash
# .npmrc 设置，包含重试逻辑和网络优化
registry=https://registry.npmjs.org/
fetch-retries=10
network-timeout=600000
# npm 失败 3 次后降级到 yarn
```

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

### 国际化（i18n）
- 语言文件：`src/locales/zh.ts` 和 `src/locales/en.ts`
- 通过 `language` 属性进行组件级语言切换
- **所有面向用户的字符串必须可翻译** - 组件中不能有硬编码文本
- 语言设置存储在设置面板中，跨会话持久化

### Element Plus 依赖
组件需要特定的 Element Plus 组件：
`ElButton`、`ElInput`、`ElPopover`、`ElDialog`、`ElSwitch`、`ElTooltip`
**对等依赖方式** - 使用者必须提供 Element Plus（>= 2.4.0）
- 支持完整导入或按需导入
- 详细集成说明见 README

### 样式架构
- `src/styles/` 和 `src/components/styles/` 中的 SCSS 模块
- **用于主题化的 CSS 自定义属性**：`--editor-bg`、`--editor-text`、`--editor-border`、`--editor-hover`、`--editor-active`
- 通过 CSS 类切换实现暗色模式（`.dark-mode`）
- 括号颜色系统：5 色数组，80% 不透明度（常量中的 `BRACKET_COLORS`）

## 关键集成点

### Vite 配置（`vite.config.ts`）
- **双重构建模式**：通过 `mode` 参数区分库构建与演示构建
  - 库模式：`npm run build` → `dist/` 双格式输出（CJS + ESM）
  - 演示模式：`npm run build:demo` → `demo-dist/` 用于 GitHub Pages
- 库构建中的 CSS 处理：使用 `vite-plugin-css-injected-by-js` 实现内联样式
- TypeScript 声明：`vite-plugin-dts` 生成 `.d.ts` 文件
- 版本注入：`__APP_VERSION__` 变量（开发模式显示 'dev'，生产模式显示 'v{版本号}'）

### 表达式验证链
1. **括号匹配验证**：确保所有括号正确配对
2. **字符白名单检查**：对照 `ALLOWED_CHARS` 常量（0-9、+、-、*、/、(、)、.、@）
3. **变量代码验证**：对照提供的 `Variable[]` 数组
4. **数学语法解析**：确保计算就绪性
- 所有验证在 `ExpressionService.validateExpression()` 中进行，返回 `{ isValid, message }`

## 开发指南

### 文档同步
- **始终同时维护** `README.md` (中文) 和 `README.en.md` (英文) 的相同内容
- 版本变更需要更新两个文件

### 组件 API 接口
通过模板引用暴露的方法：`validateExpression()`、`clearAll()`、`focusInput()`、`getExpression()`、`getDisplayExpression()`、`setExpression()`、`reset()`、`insertAtCursor()`

事件系统：`@update:modelValue`、`@validation-change`、`@change`、`@input`、`@focus`、`@blur`、`@clear`

### 服务层修改
修改服务时，保持**静态方法模式** - 所有服务都使用静态方法进行无状态操作
示例：`ExpressionService.validateExpression(expression, variables)` - 不创建实例

### 类型安全
在 `src/types.ts` 和 `src/types/index.ts` 中维护 TypeScript 接口 - 为了兼容性存在一些重复
