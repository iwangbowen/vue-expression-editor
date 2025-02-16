<template>
  <el-popover v-bind="popoverProps" v-model:visible="visible">
    <template #default>
      <div class="variable-suggestions-content">
        <div class="variable-suggestions-header">
          <span class="variable-suggestions-title">{{ t('variables.title') }}</span>
          <button class="variable-suggestions-close" type="button" @click.stop="handleClose" :title="t('variables.close')">
            <el-icon>
              <Close />
            </el-icon>
          </button>
        </div>
        <div v-for="(variable, index) in suggestions" :key="variable.code" class="suggestion-item"
          :class="{ selected: index === selectedIndex }" @click="() => handleSelect(index)">
          <span class="variable-name">{{ variable.name }}</span>
          <span class="variable-code">{{ variable.code }}</span>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';
import { computed } from 'vue';

interface Variable {
  name: string;
  code: string;
}

const props = defineProps<{
  visible: boolean
  suggestions: Variable[]
  selectedIndex: number
  wrapperRef: HTMLElement | null
  t: (key: string) => string
}>()

const emits = defineEmits<{
  'update:visible': [value: boolean]
  'select': [variable: Variable]
  'close': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emits('update:visible', value)
})

const handleClose = () => {
  emits('close')
}

const handleSelect = (index: number) => {
  emits('select', props.suggestions[index])
}

const popoverProps = computed(() => ({
  trigger: 'manual' as const,
  placement: 'bottom' as const,
  offset: 2,
  'popper-class': 'variable-suggestions-popover',
  'gpu-acceleration': false,
  'fallback-placements': ['top'],
  'popper-style': 'width: auto;',
  'virtual-triggering': true,
  teleported: true,
  'virtual-ref': props.wrapperRef,
  persistent: true,
}))
</script>

<style scoped>
/* 变量提示框样式 */
.variable-suggestions-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 0;
  background: var(--el-bg-color);
}

.variable-suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.variable-suggestions-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.variable-suggestions-close {
  width: 20px;
  height: 20px;
  min-width: unset;
  padding: 0;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  background-color: transparent;
  transition: all 0.2s ease;
}

.variable-suggestions-close:hover {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-darker);
}

.variable-suggestions-close:active {
  transform: scale(0.95);
}

.variable-suggestions-close .el-icon {
  font-size: 14px;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.2s ease;
}

.suggestion-item .variable-name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.suggestion-item .variable-code {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-family: monospace;
}

.suggestion-item.selected {
  background-color: var(--el-color-primary-light-9);
}

.suggestion-item.selected .variable-name {
  color: var(--el-color-primary);
}

.suggestion-item.selected .variable-code {
  color: var(--el-color-primary);
}

.suggestion-item:hover:not(.selected) {
  background-color: var(--el-fill-color-light);
}

:deep(.variable-suggestions-popover) {
  padding: 0;
  min-width: 240px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* 滚动条样式 */
.variable-suggestions-content::-webkit-scrollbar {
  width: 6px;
}

.variable-suggestions-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.variable-suggestions-content::-webkit-scrollbar-track {
  background: transparent;
}

/* 暗色模式适配 */
:root.dark-mode .variable-suggestions-content {
  background-color: var(--editor-bg);
  border-color: var(--editor-border);
}

:root.dark-mode .suggestion-item.selected {
  background-color: var(--el-color-primary-dark-2);
}

:root.dark-mode .suggestion-item:hover:not(.selected) {
  background-color: var(--editor-hover);
}
</style>
