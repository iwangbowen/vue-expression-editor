# Vue Expression Editor

[中文](./README.zh-CN.md) | English

A Vue 3 component for editing mathematical expressions, supporting various mathematical operations and formula validation.

## Features

- 🎯 Visual expression editing
- 🚀 Real-time expression validation
- 💡 Intelligent suggestions
- 📦 Easy to integrate
- 🔧 Highly customizable
- 🎨 Beautiful UI based on Element Plus

## Demo

Visit our [online demo](https://iwangbowen.github.io/vue-expression-editor)

## Installation

```bash
npm install vue-expression-editor
```

## Usage

### Basic Usage

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
  console.log('Expression changed:', value)
}
</script>
```

### Configuration

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

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Build demo site
npm run build:demo
```

## Deployment

The demo site will be automatically deployed when:

1. Manually triggered from GitHub Actions page
2. Push to master branch with commit message containing `[deploy]`
3. Changes to the following files in master branch:
   - `src/**`
   - `public/**`
   - `index.html`
   - `vite.config.ts`
   - `package.json`
   - `.github/workflows/**`

Note: Changes to documentation files (*.md) will not trigger deployment.

Example commit that triggers deployment:
```bash
git commit -m "feat: update component [deploy]"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT