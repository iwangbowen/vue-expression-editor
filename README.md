# Vue Expression Editor

[English](./README.en.md) | 简体中文

一个功能强大的 Vue 3 数学表达式编辑器组件，支持变量插入、实时计算、暗色主题等特性。

> ⚠️ **开发提示**
>
> 本项目正处于快速开发阶段：
>
> - 建议定期更新到最新版本以获取功能更新和问题修复
> - 如遇到任何问题，欢迎通过 [Issues](https://github.com/iwangbowen/vue-expression-editor/issues) 反馈
> - 欢迎提供建议和想法，帮助项目变得更好
> - 当前版本可能包含一些bug，我们会及时修复

## 在线演示

🚀 [在线演示地址](https://iwangbowen.github.io/vue-expression-editor)

📦 [NPM Package](https://www.npmjs.com/package/vue-expression-editor)

## 特性

- 🎯 支持数学表达式编辑和实时验证
- 🔢 内置数字键盘和运算符按钮
- 📝 支持变量插入和管理
- 🌓 支持亮色/暗色主题切换
- 💫 平滑的动画效果和交互体验
- 🎨 可自定义的按键样式（方形/圆形）
- 📐 灵活的布局方式（垂直/水平）
- 🔍 变量搜索功能
- ⚡️ 实时预览和计算结果
- 🎛️ 丰富的自定义设置

## 使用场景

- 财务计算公式配置
- 数据分析表达式编辑
- 自定义计算字段设置
- 业务规则条件配置
- 科学计算器应用
- 数学教育工具

## 安装

```bash
npm install vue-expression-editor
```

## 基础用法

```vue
<template>
  <ExpressionEditor
    v-model="expression"
    :variables="variables"
    :show-toolbar="true"
    :show-validate="true"
    :show-info="true"
    :show-theme="true"
    :show-settings="true"
    :show-preview="true"
    :show-copy="true"
    :show-style-toggle="true"
    :readonly="false"
    :disabled="false"
    :max-length="1000"
    :autofocus="false"
    @update:modelValue="handleUpdate"
    @validation-change="handleValidationChange"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
  />
</template>

<script setup>
import { ref } from 'vue'
import ExpressionEditor from 'vue-expression-editor'

const expression = ref('')
const variables = [
  { name: '销售额', code: 'sales' },
  { name: '成本', code: 'cost' },
  { name: '利润', code: 'profit' }
]

// 所有支持的回调方法
const handleUpdate = (value) => {
  console.log('表达式更新:', value)
}

const handleValidationChange = (valid, message) => {
  console.log('验证结果:', valid, message)
}

const handleChange = (value, displayValue) => {
  console.log('表达式改变:', value, displayValue)
}

const handleInput = (value) => {
  console.log('输入值:', value)
}

const handleFocus = () => {
  console.log('获得焦点')
}

const handleBlur = () => {
  console.log('失去焦点')
}

const handleClear = () => {
  console.log('已清空')
}

// 通过 ref 调用组件方法示例
const expressionEditorRef = ref(null)

const validateExpression = () => {
  expressionEditorRef.value?.validateExpression()
}

const clearAll = () => {
  expressionEditorRef.value?.clearAll()
}

const focusInput = () => {
  expressionEditorRef.value?.focusInput()
}

const getExpression = () => {
  return expressionEditorRef.value?.getExpression()
}

const getDisplayExpression = () => {
  return expressionEditorRef.value?.getDisplayExpression()
}

const setExpression = (value) => {
  expressionEditorRef.value?.setExpression(value)
}

const reset = () => {
  expressionEditorRef.value?.reset()
}

const insertAtCursor = (text) => {
  expressionEditorRef.value?.insertAtCursor(text)
}
</script>
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| modelValue | string | '' | 公式的值（支持 v-model） |
| variables | Array | [] | 可选变量列表 |
| showToolbar | boolean | true | 是否显示工具栏 |
| showValidate | boolean | true | 是否显示验证按钮 |
| showInfo | boolean | true | 是否显示信息按钮 |
| showTheme | boolean | true | 是否显示主题切换按钮 |
| showSettings | boolean | true | 是否显示设置按钮 |
| showPreview | boolean | true | 是否显示预览按钮 |
| showCopy | boolean | true | 是否显示复制按钮 |
| showStyleToggle | boolean | true | 是否显示样式切换按钮 |
| readonly | boolean | false | 是否只读 |
| disabled | boolean | false | 是否禁用 |
| maxLength | number | 1000 | 最大长度 |
| autofocus | boolean | false | 是否自动获取焦点 |
| language | string | 'zh' | 界面语言（支持 'zh'/'en'） |

## 组件事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:modelValue | (value: string) | 表达式值更新时触发 |
| validation-change | (valid: boolean, message: string) | 验证状态变化时触发 |
| change | (value: string, displayValue: string) | 表达式改变时触发 |
| input | (value: string) | 输入时触发 |
| focus | - | 获得焦点时触发 |
| blur | - | 失去焦点时触发 |
| clear | - | 清空时触发 |

## 方法

通过 ref 可以调用以下方法：

```typescript
interface ExpressionEditorMethods {
  // 验证当前表达式
  validateExpression(): void;
  // 清空表达式
  clearAll(): void;
  // 使输入框获得焦点
  focusInput(): void;
  // 获取当前表达式
  getExpression(): string;
  // 获取显示的表达式（带变量名）
  getDisplayExpression(): string;
  // 设置表达式值
  setExpression(value: string): void;
  // 重置编辑器状态
  reset(): void;
  // 在光标位置插入内容
  insertAtCursor(text: string): void;
}
```

## 自定义设置

编辑器支持以下自定义设置：

```typescript
interface EditorSettings {
  // 自动补全括号
  autoCompleteBrackets: boolean;
  // 启用括号颜色
  bracketColorEnabled: boolean;
  // 暗色主题
  isDarkMode: boolean;
  // 水平布局
  horizontalLayout: boolean;
}
```

## 变量定义

变量列表的格式：

```typescript
interface Variable {
  name: string;    // 显示名称
  code: string;    // 变量代码
}
```

## 多语言支持

编辑器支持中文和英文两种界面语言：

1. 通过属性设置语言：
   ```vue
   <ExpressionEditor
     :language="'en'"  <!-- 设置为英文界面 -->
   />
   ```

2. 动态切换语言：
   ```vue
   <script setup>
   const currentLang = ref('zh')
   </script>

   <template>
     <ExpressionEditor
       v-model:language="currentLang"
     />
   </template>
   ```

3. 在设置面板中切换：
   - 点击设置按钮打开设置面板
   - 在语言设置中选择需要的语言
   - 设置会自动保存

注意：语言设置会影响整个编辑器的界面文本，包括按钮文本、提示信息和错误消息等。

## 使用技巧

1. 快捷键支持：
   - `Ctrl + Z`: 撤销
   - `Ctrl + Y`: 重做
   - `Ctrl + C`: 复制
   - `Ctrl + V`: 粘贴
   - `方向键`: 在变量间快速跳转

2. 变量输入：
   - 输入 `@` 可快速选择变量
   - 支持变量搜索过滤
   - 变量名支持中文显示

3. 自动优化：
   - 自动处理变量间的乘号
   - 自动补全括号（可配置）
   - 智能处理负号和减号

## 注意事项

1. 变量代码必须是合法的标识符
2. 不支持直接输入字母，必须通过 `@` 选择变量
3. 表达式中的变量将使用 code 进行计算
4. 预览模式下的计算结果保留两位小数

## 样式定制

组件使用 CSS 变量进行主题定制，可以通过覆盖以下变量来自定义样式：

```css
:root {
  --editor-bg: #ffffff;
  --editor-text: #303133;
  --editor-border: #dcdfe6;
  --editor-hover: #f5f5f5;
  --editor-active: #e6e6e6;
}
```

## GitHub Actions 部署流程

本项目使用 GitHub Actions 实现自动化部署演示页面。

### 触发条件

工作流会在以下情况下触发：

1. 手动触发（workflow_dispatch）
2. 推送到 master 分支且修改了以下文件：
   - src/ 目录下的文件
   - public/ 目录下的文件
   - index.html
   - vite.config.ts
   - package.json
   - .github/workflows/ 下的文件

### 部署条件

以下任一条件满足时才会执行部署：

- 手动触发工作流时
- commit 信息包含 `[deploy]` 标记时

注意：更新以下文件不会触发部署：

- README.md 等文档文件
- .gitignore
- .editorconfig
- LICENSE

### 工作流程

1. 检查是否满足部署条件
2. 安装项目依赖
3. 构建演示页面
4. 部署到 GitHub Pages

### 最佳实践

- 当进行重要更新时，在 commit 信息中加入 `[deploy]` 标记
- 可以随时通过 Actions 页面手动触发部署
- 文档更新等小改动无需触发部署流程

## 发布说明

发布新版本有两种方式：

1. 创建 GitHub Release
   - 在 GitHub 上创建新的 Release
   - Actions 将自动触发发布流程

2. 手动触发发布
   - 在 GitHub Actions 中手动触发 "NPM Publish" 工作流
   - 输入要发布的版本号（例如：1.0.0）

### NPM 发布配置

1. 获取 NPM Token
   - 登录 [npmjs.com](https://www.npmjs.com)
   - 点击头像 -> Access Tokens
   - 选择 "Generate New Token" (Automation)
   - 复制生成的 token

2. 配置 GitHub Secrets
   - 进入 GitHub 仓库 Settings
   - 选择 Secrets and variables -> Actions
   - 点击 New repository secret
   - 添加 NPM_TOKEN 密钥

注意事项：

- 发布前确保已通过所有测试
- 版本号需要遵循语义化版本规范
- 确保已配置 NPM_TOKEN 密钥

## 本地开发

1. 克隆仓库

   ```bash
   git clone https://github.com/iwangbowen/vue-expression-editor.git
   cd vue-expression-editor
   ```

2. 安装依赖

   ```bash
   npm install
   ```

3. 启动开发服务器

   ```bash
   npm run dev
   ```

   开发服务器将在 http://localhost:5173 启动

4. 构建

   ```bash
   npm run build
   ```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交改动：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 致谢

特别感谢 Claude 3.5 Sonnet 的帮助。本项目的代码主要由 Claude 3.5 Sonnet 生成,它在以下方面提供了重要支持:

- 项目架构设计
- 核心功能实现
- 文档编写
- 代码优化建议
- 最佳实践指导

Claude 3.5 Sonnet 的强大能力使得这个项目得以快速且高质量地完成。这也展示了AI辅助编程在现代软件开发中的巨大潜力。

## 许可证

[MIT](LICENSE)
