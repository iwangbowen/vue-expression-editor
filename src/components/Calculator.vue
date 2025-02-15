<template>
  <div class="calculator" :class="{ 'circle-style': isCircleStyle }">
    <div class="top-operators">
      <button class="undo-button" @click="$emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">↶</button>
      <button class="redo-button" @click="$emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Y)">↷</button>
      <button v-for="op in topOperators" :key="op" @click="$emit('operator', op)" :class="getOperatorClass(op)">
        {{ op }}
      </button>
    </div>
    <div class="main-keypad">
      <div class="numeric-keypad">
        <template v-for="num in numbers" :key="num">
          <button @click="$emit('number', num)">{{ num }}</button>
        </template>
        <button @click="$emit('number', '0')">0</button>
        <button @click="$emit('number', '.')">.</button>
        <button class="delete-button" @click="$emit('delete')" title="删除">
          <el-icon>
            <Back />
          </el-icon>
        </button>
      </div>
      <div class="right-operators">
        <button v-for="op in rightOperators" :key="op" @click="$emit('operator', op)" :class="getOperatorClass(op)">
          {{ op }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'

defineProps<{
  canUndo: boolean
  canRedo: boolean
  isCircleStyle: boolean // 移除可选标记
}>()

defineEmits<{
  'number': [value: string]
  'operator': [value: string]
  'delete': []
  'undo': []
  'redo': []
}>()

const topOperators = ['(', ')']
const rightOperators = ['+', '-', '*', '/']
const numbers = [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3'
]

const getOperatorClass = (operator: string): string => {
  switch (operator) {
    case '+': return 'operator-add'
    case '-': return 'operator-subtract'
    case '*': return 'operator-multiply'
    case '/': return 'operator-divide'
    case '(':
    case ')': return 'operator-bracket'
    default: return ''
  }
}
</script>

<style scoped>
.calculator {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-operators {
  display: flex;
  gap: 8px;
}

.main-keypad {
  display: flex;
  gap: 8px;
}

.numeric-keypad {
  display: grid;
  grid-template-columns: repeat(3, 60px);
  gap: 8px;
}

.right-operators {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

button {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: #f5f5f5;
}

button:active {
  background-color: #e0e0e0;
}

.undo-button,
.redo-button {
  font-size: 1.5rem;
  background-color: #F2F6FC;
}

.undo-button:disabled,
.redo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button .el-icon {
  font-size: 24px;
}

.operator-add {
  background-color: var(--el-color-success-light-9) !important;
  color: var(--el-color-success) !important;
  font-weight: bold;
}

.operator-subtract {
  background-color: var(--el-color-warning-light-9) !important;
  color: var(--el-color-warning) !important;
  font-weight: bold;
}

.operator-multiply {
  background-color: var(--el-color-primary-light-9) !important;
  color: var(--el-color-primary) !important;
  font-weight: bold;
}

.operator-divide {
  background-color: var(--el-color-danger-light-9) !important;
  color: var(--el-color-danger) !important;
  font-weight: bold;
}

.operator-bracket {
  background-color: var(--el-color-info-light-9) !important;
  color: var(--el-color-info) !important;
  font-weight: bold;
}

/* 操作符按钮悬停效果 */
.operator-add:hover {
  background-color: var(--el-color-success-light-7) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.operator-subtract:hover {
  background-color: var(--el-color-warning-light-7) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.2);
}

.operator-multiply:hover {
  background-color: var(--el-color-primary-light-7) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.operator-divide:hover {
  background-color: var(--el-color-danger-light-7) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.operator-bracket:hover {
  background-color: var(--el-color-info-light-7) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.2);
}

/* 操作符按钮激活效果 */
.operator-add:active,
.operator-subtract:active,
.operator-multiply:active,
.operator-divide:active,
.operator-bracket:active {
  transform: translateY(-1px);
}

/* 修改圆形样式的选择器 */
.calculator.circle-style button {
  border-radius: 50% !important;
}

.calculator.circle-style .right-operators button,
.calculator.circle-style .top-operators button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 暗色模式适配 */
:root.dark-mode .calculator button {
  background-color: var(--editor-hover);
  border-color: var(--editor-border);
  color: var(--editor-text);
}

:root.dark-mode .calculator button:hover {
  background-color: var(--editor-active);
}

:root.dark-mode .operator-add {
  background-color: rgba(103, 194, 58, 0.2) !important;
}

:root.dark-mode .operator-subtract {
  background-color: rgba(230, 162, 60, 0.2) !important;
}

:root.dark-mode .operator-multiply {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

:root.dark-mode .operator-divide {
  background-color: rgba(245, 108, 108, 0.2) !important;
}

:root.dark-mode .operator-bracket {
  background-color: rgba(144, 147, 153, 0.2) !important;
}
</style>