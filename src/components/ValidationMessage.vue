<template>
    <div class="validation-container">
        <transition name="fade">
            <div v-if="message" class="validation-message" :class="status">
                {{ message }}
                <button class="close-validation" @click="handleClose" title="关闭">
                    <el-icon>
                        <Close />
                    </el-icon>
                </button>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'

defineProps<{
    message: string
    status: 'success' | 'error' | null
}>()

const emits = defineEmits<{
    'close': []
}>()

const handleClose = () => {
    emits('close')
}
</script>

<style scoped>
.validation-container {
    width: 100%;
    max-width: 400px;
    height: 36px;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.validation-message {
    width: 100%;
    padding: 6px 32px 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
}

.close-validation {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    min-width: unset;
    padding: 0;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.close-validation:hover {
    opacity: 1;
}

.close-validation .el-icon {
    font-size: 14px;
}

.validation-message.success {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
}

.validation-message.error {
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 暗色模式适配 */
:root.dark-mode .validation-message.success {
    background-color: rgba(103, 194, 58, 0.2);
}

:root.dark-mode .validation-message.error {
    background-color: rgba(245, 108, 108, 0.2);
}
</style>