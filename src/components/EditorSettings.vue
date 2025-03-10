<template>
  <el-dialog v-model="dialogVisible" :title="t('settings.title')" width="460px" :close-on-click-modal="false">
    <div class="settings-form">
      <el-form label-position="left" label-width="180px">
        <el-form-item :label="t('settings.autoCompleteBrackets')">
          <el-switch v-model="localSettings.autoCompleteBrackets" />
        </el-form-item>
        <el-form-item :label="t('settings.bracketColorEnabled')">
          <el-switch v-model="localSettings.bracketColorEnabled" />
        </el-form-item>
        <el-form-item :label="t('settings.horizontalLayout')">
          <el-switch v-model="localSettings.horizontalLayout" />
        </el-form-item>
        <el-form-item :label="t('settings.hideVariables')">
          <el-switch v-model="localSettings.hideVariables" />
        </el-form-item>
        <el-form-item :label="t('settings.hideKeyboard')">
          <el-switch v-model="localSettings.hideKeyboard" />
        </el-form-item>
        <el-form-item :label="t('settings.language')">
          <el-select v-model="localSettings.language" class="w-full">
            <el-option label="中文" value="zh" />
            <el-option label="English" value="en" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button class="settings-cancel" @click="handleCancel">{{ t('settings.buttons.cancel') }}</el-button>
        <el-button class="settings-confirm" type="primary" @click="handleSave">{{ t('settings.buttons.confirm') }}</el-button>
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
  language: string;
  hideVariables: boolean; // 修改：showVariables -> hideVariables
  hideKeyboard: boolean; // 修改：showKeyboard -> hideKeyboard
}

const props = withDefaults(defineProps<{
  visible: boolean;
  initialSettings: Settings;
  t: (key: string) => string;
}>(), {
  visible: false,
  initialSettings: () => ({
    autoCompleteBrackets: false,
    bracketColorEnabled: false,
    horizontalLayout: false,
    language: 'zh',
    hideVariables: false, // 修改默认值
    hideKeyboard: false  // 修改默认值
  })
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', settings: Settings): void;
  (e: 'cancel'): void;
}>();

const dialogVisible = ref(props.visible);
const localSettings = ref<Settings>({ ...props.initialSettings });

// 修改 watch 监听，以确保在初始状态时获取正确的设置值
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
  if (newValue) {
    // 打开对话框时，从初始设置中同步值
    localSettings.value = { ...props.initialSettings };
  }
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

:deep(.el-form-item__label) {
  font-size: 14px;
  white-space: nowrap;
}
</style>
