# Vue Expression Editor

一个功能强大的 Vue 3 数学表达式编辑器组件，支持变量插入、实时计算、暗色主题等特性。

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
    @validation-change="handleValidationChange"
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

const handleValidationChange = (valid, message) => {
  console.log('验证结果:', valid, message)
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

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交改动：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 许可证

[MIT](LICENSE)