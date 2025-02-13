<template>
  <div class="dev-container">
    <div class="content-wrapper">
      <h1>Vue Expression Editor Demo</h1>
      <div class="demo-section">
        <h2>基础用法</h2>
        <ExpressionEditor
          v-model="testExpression"
          @change="handleExpressionChange"
        />
        <div class="expression-value" v-if="testExpression">
          当前表达式：{{ testExpression }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExpressionEditor from '../components/ExpressionEditor.vue'

const testExpression = ref('1 + 2 * 3')

const handleExpressionChange = (value: string) => {
  console.log('Expression changed:', value)
}
</script>

<style scoped>
.dev-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.demo-section {
  margin-top: 20px;
}

.expression-value {
  margin-top: 10px;
  color: #666;
}
</style>
