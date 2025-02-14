# Vue 表达式编辑器

中文 | [English](./README.md)

一个用于编辑数学表达式的 Vue 3 组件，支持各种数学运算和公式验证。

## 特性

- 🎯 可视化表达式编辑
- 🚀 实时表达式验证
- 💡 智能提示
- 📦 易于集成
- 🔧 高度可定制
- 🎨 基于 Element Plus 的精美界面

## 在线演示

访问我们的[在线演示](https://iwangbowen.github.io/vue-expression-editor)

## 安装

```bash
npm install vue-expression-editor
```

## 使用方法

### 基础用法

```vue
<template>
  <expression-editor
    v-model="expression"
    :variables="variables"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ExpressionEditor } from 'vue-expression-editor'

const expression = ref('')
const variables = [
  { name: 'price', label: '价格' },
  { name: 'quantity', label: '数量' }
]

const handleChange = (value: string) => {
  console.log('表达式已更改:', value)
}
</script>
```

### 配置选项

```typescript
interface Variable {
  name: string;
  label: string;
}

interface ExpressionEditorProps {
  modelValue: string;
  variables?: Variable[];
  readonly?: boolean;
  placeholder?: string;
}
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建库
npm run build

# 构建演示站点
npm run build:demo
```

## 部署

在以下情况下，演示站点会自动部署：

1. 在 GitHub Actions 页面手动触发
2. 推送到 master 分支时，提交信息包含 `[deploy]`
3. master 分支下以下文件发生变更：
   - `src/**`
   - `public/**`
   - `index.html`
   - `vite.config.ts`
   - `package.json`
   - `.github/workflows/**`

注意：修改文档文件（*.md）不会触发部署。

触发部署的提交示例：
```bash
git commit -m "feat: 更新组件 [deploy]"
```

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 许可证

MIT
