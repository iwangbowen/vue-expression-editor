# 快速开始

## 安装

```bash
npm install vue-expression-editor
```

## 基础使用

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

## 配置选项

### 基础配置

组件提供了丰富的配置选项来满足不同场景的需求：

```vue
<template>
  <ExpressionEditor
    v-model="expression"
    :variables="variables"
    :show-toolbar="true"
    :show-validate="true"
    :show-theme="true"
    theme="light"
    :max-length="1000"
    :auto-complete="true"
    @validation-change="handleValidationChange"
    @change="handleChange"
  />
</template>
```

### 主题配置

```vue
<template>
  <ExpressionEditor
    v-model="expression"
    theme="dark"
    :custom-theme="{
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      borderColor: '#333333'
    }"
  />
</template>
```

## 高级用法

### 表达式验证

```vue
<template>
  <ExpressionEditor ref="editorRef" />
</template>

<script setup>
import { ref } from 'vue'

const editorRef = ref()

// 手动触发验证
const validate = async () => {
  try {
    const result = await editorRef.value.validateExpression()
    console.log('验证通过:', result)
  } catch (error) {
    console.error('验证失败:', error)
  }
}
</script>
```

### 变量管理

```vue
<script setup>
const variables = [
  {
    name: '销售额',
    code: 'sales',
    description: '商品的销售总金额',
    example: '1000.00'
  },
  {
    name: '成本',
    code: 'cost',
    description: '商品的成本支出',
    example: '800.00'
  }
]
</script>
```

## 更多示例

查看[示例页面](/examples/)了解更多用法。
