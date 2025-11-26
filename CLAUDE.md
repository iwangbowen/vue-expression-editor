# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
npm install                    # 安装依赖
npm run dev                    # 启动 Vite 开发服务器 (localhost:5173)
npm run build                  # 构建库 (dist/ 包含 ESM/CJS + types)
npm run build:demo             # 构建演示页面 (demo-dist/)
npm run preview                # 本地预览构建的演示
npm run type-check             # TypeScript 类型检查 (vue-tsc --noEmit)
```

**GitHub Actions**：

- 演示部署：由提交消息中的 `[deploy]` 或向 master 分支推送时手动触发（src/、public/、vite.config.ts、package.json 中的变更）。
- NPM 发布：由 GitHub Release 或手动分派（带版本输入，需要 NPM_TOKEN 密钥）触发。

## 架构概述

### 核心结构

- **入口**：`src/index.ts` 导出 `ExpressionEditor`（主组件）和 `VariableItem` 组件 + Vue 插件。
- **主组件**：`src/components/ExpressionEditor.vue` (~1800 行) 协调 UI、状态和服务。
- **无状态服务** (`src/services/`)：

  | 服务 | 用途 |
  |---------|---------|
  | `expressionService.ts` | 表达式验证、解析、标记化为语法高亮。 |
  | `variableService.ts` | 变量插入、格式化 (code vs 显示名称)。 |
  | `inputService.ts` | 光标管理、输入处理。 |
  | `expressionCalculationService.ts` | 带变量的数学求值。 |

- **常量**：`src/constants/editor.ts` 定义 `ALLOWED_CHARS` (0-9+*-/().@)、`BRACKET_COLORS` (5 种颜色)、尺寸、键。
- **本地化**：`src/locales/{zh,en}.ts` 用于 i18n (所有 UI 字符串可翻译，无硬编码文本)。
- **类型**：`src/types.ts`、`src/types/index.ts` (部分重复以兼容)。

### 数据流

- **双表达式**：
  - 内部：使用变量 `code` 的原始公式 (例如 `sales + cost`)。
  - 显示：用户友好的带 `name` (例如 `销售额 + 成本`)。
- **标记化**：显示通过令牌渲染 `{ type: 'bracket'|'variable'|'operator'|'text', bracketStatus?: 'matched'|'unmatched', bracketIndex?: number }`。
- **变量**：`{ name: string, code: string }`。通过 `@` 触发 + 自动完成/搜索插入。
- **验证链** (在 `ExpressionService.validateExpression()` 中)：括号匹配 → 字符白名单 → 变量代码 → 数学语法。返回 `{ isValid: boolean, message: string }`。

### 样式与主题

- SCSS 模块在 `src/components/styles/`。
- CSS 变量：`--editor-bg`、`--editor-text`、`--editor-border`、`--editor-hover`、`--editor-active`。
- 暗模式：`.dark-mode` 类。
- 括号颜色来自 `BRACKET_COLORS` (80% 不透明度)。

### 构建模式 (vite.config.ts)

- **库** (`npm run build`)：外部化 `vue`、`element-plus`；通过 `vite-plugin-css-injected-by-js` 注入 CSS；通过 `vite-plugin-dts` 生成 `.d.ts`。
- **演示** (`npm run build:demo`)：构建 `index.html` 到 `demo-dist/` 用于 GitHub Pages。
- 版本：`__APP_VERSION__` ('dev' 在开发中，`vX.Y.Z` 在生产中)。

### 关键依赖

- **Peer**：Vue ^3.3.0, Element Plus ^2.4.0 (需要 ElButton, ElInput, ElPopover, ElDialog, ElSwitch, ElTooltip)。
- 无打包 Element Plus (peer dep 用于 tree-shaking)。

### 要遵循的模式

- 服务：仅静态方法 (无状态)。
- i18n：所有用户界面字符串使用 `t()`。
- 同步 `README.md` (中文) 和 `README.en.md` (英文)。
- 通过 ref 暴露方法：`validateExpression()`、`clearAll()`、`focusInput()`、`getExpression()`、`getDisplayExpression()`、`setExpression(value)`、`reset()`、`insertAtCursor(text)`。