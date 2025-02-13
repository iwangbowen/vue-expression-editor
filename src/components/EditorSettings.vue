<template>
  <el-dialog v-model="dialogVisible" title="编辑器设置" width="400px" :close-on-click-modal="false">
    <div class="settings-form">
      <el-form label-position="left" label-width="120px">
        <el-form-item label="自动补全括号">
          <el-switch v-model="localSettings.autoCompleteBrackets" />
        </el-form-item>
        <el-form-item label="括号颜色区分">
          <el-switch v-model="localSettings.bracketColorEnabled" />
        </el-form-item>
        <el-form-item label="水平布局">
          <el-switch v-model="localSettings.horizontalLayout" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="settings-cancel" @click="handleCancel">取消</el-button>
        <el-button class="settings-confirm" type="primary" @click="handleSave">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Settings {
  autoCompleteBrackets: boolean;
  bracketColorEnabled: boolean;
  horizontalLayout: boolean;
}

const props = withDefaults(defineProps<{
  visible: boolean;
  initialSettings: Settings;
}>(), {
  visible: false,
  initialSettings: () => ({
    autoCompleteBrackets: false,
    bracketColorEnabled: false,
    horizontalLayout: false,
  })
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', settings: Settings): void;
  (e: 'cancel'): void;
}>();

const dialogVisible = ref(props.visible);
const localSettings = ref<Settings>({ ...props.initialSettings });

watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
  if (!newValue) {
    localSettings.value = { ...props.initialSettings };
  }
});

const handleSave = () => {
  emit('save', { ...localSettings.value });
  dialogVisible.value = false;
};

const handleCancel = () => {
  emit('cancel');
  dialogVisible.value = false;
};
</script>

<style scoped>
.settings-form {
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>