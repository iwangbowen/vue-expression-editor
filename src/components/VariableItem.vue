<template>
  <button 
    @click="handleClick" 
    :title="variable.name"
    class="variable-item-button"
  >
    {{ variable.name }}
  </button>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue';
import type { Variable } from '../types';

interface Props {
  variable: Variable;
}

const props = defineProps<Props>();

// 注入变量注册功能
const registerSlotVariable = inject<(variable: Variable) => void>('registerSlotVariable');
const unregisterSlotVariable = inject<(code: string) => void>('unregisterSlotVariable');
const onVariableClick = inject<(variable: Variable) => void>('onVariableClick');

// 组件挂载时注册变量
onMounted(() => {
  if (registerSlotVariable) {
    registerSlotVariable(props.variable);
  }
});

// 组件卸载时取消注册
onUnmounted(() => {
  if (unregisterSlotVariable) {
    unregisterSlotVariable(props.variable.code);
  }
});

const handleClick = () => {
  if (onVariableClick) {
    onVariableClick(props.variable);
  }
};
</script>

<style scoped>
.variable-item-button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 4px;
  border: none;
  border-radius: 4px;
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.variable-item-button:hover {
  background-color: var(--el-fill-color-light);
}

.variable-item-button:active {
  background-color: var(--el-fill-color);
}
</style>