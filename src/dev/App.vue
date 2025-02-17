<template>
  <div class="dev-container">
    <div class="content-wrapper">
      <!-- 修改标题区域为 flex 布局 -->
      <div class="header">
        <div class="title-container">
          <h1 class="main-title">Vue Expression Editor</h1>
          <!-- 移除额外的 v 前缀 -->
          <span class="version-tag">{{ version }}</span>
        </div>
        <div class="links-container">
          <a href="https://www.npmjs.com/package/vue-expression-editor" target="_blank" class="link-item npm-link">
            <el-icon><Box /></el-icon>
            <span>NPM Package</span>
          </a>
          <a href="https://github.com/iwangbowen/vue-expression-editor" target="_blank" class="link-item github-link">
            <el-icon><Platform /></el-icon>
            <span>GitHub</span>
          </a>
        </div>
      </div>
      <div class="demo-section">
        <h2 class="section-title">组件演示</h2>
        <div class="demo-layout">
          <!-- 左侧操作区 -->
          <div class="left-panel">
            <!-- 变量管理面板 -->
            <div class="variables-manager">
              <h3 class="section-subtitle">变量管理</h3>
              <div class="variables-list">
                <div v-for="(variable, index) in variables" :key="index" class="variable-item">
                  <span class="variable-name">{{ variable.name }}</span>
                  <span class="variable-code">({{ variable.code }})</span>
                  <el-button type="danger" size="small" @click="removeVariable(index)" circle>
                    <el-icon style="font-size: 14px"><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <!-- 新变量输入区域 -->
              <div v-if="showNewVariable" class="new-variable-form">
                <el-input v-model="newVariable.name" placeholder="变量名称" class="variable-input">
                  <template #prepend>名称</template>
                </el-input>
                <el-input v-model="newVariable.code" placeholder="变量代码" class="variable-input">
                  <template #prepend>代码</template>
                </el-input>
                <div class="form-actions">
                  <el-button type="primary" @click="confirmAddVariable" :disabled="!canAddVariable">
                    确认
                  </el-button>
                  <el-button @click="cancelAddVariable">取消</el-button>
                </div>
              </div>
              <div class="variables-actions">
                <el-button v-if="!showNewVariable" type="primary" @click="startAddVariable">
                  <el-icon><Plus /></el-icon>添加变量
                </el-button>
                <el-button @click="resetVariables">恢复默认</el-button>
              </div>
            </div>

            <!-- 外部操作面板 -->
            <div class="operations-panel">
              <h3 class="section-subtitle">外部操作</h3>
              <div class="expression-display" v-if="testExpression">
                当前表达式：<code class="expression-code">{{ testExpression }}</code>
              </div>
              <div class="actions-panel">
                <div class="button-groups">
                  <div class="group-title">运算符：</div>
                  <el-button-group>
                    <el-button type="primary" @click="insertText('+')" plain size="small">插入 +</el-button>
                    <el-button type="primary" @click="insertText('-')" plain size="small">插入 -</el-button>
                    <el-button type="primary" @click="insertText('*')" plain size="small">插入 *</el-button>
                    <el-button type="primary" @click="insertText('/')" plain size="small">插入 /</el-button>
                  </el-button-group>
                </div>
                <div class="button-groups">
                  <div class="group-title">操作：</div>
                  <el-button-group>
                    <el-button type="success" @click="validate" size="small">验证表达式</el-button>
                    <el-button type="warning" @click="clear" size="small">清空</el-button>
                    <el-button type="info" @click="reset" size="small">重置</el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧组件展示区 -->
          <div class="right-panel">
            <div class="component-panel">
              <h3 class="panel-title">表达式编辑器组件</h3>
              <div class="component-wrapper">
                <ExpressionEditor
                  ref="expressionEditorRef"
                  v-model="testExpression"
                  :initial-value="originalExpression"
                  :variables="variables"
                  :language="currentLanguage"
                  @change="handleExpressionChange"
                  @update:language="handleLanguageChange"
                />
              </div>
            </div>

            <div class="result-panel" v-if="validateResult !== null">
              <div class="validate-result">
                验证结果：
                <el-tag :type="validateResult ? 'success' : 'danger'" size="small">
                  {{ validateResult ? '有效' : '无效' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
declare const __APP_VERSION__: string
const version = __APP_VERSION__
import { ref, computed } from 'vue'
import ExpressionEditor from '../components/ExpressionEditor.vue'
import { ElMessage } from 'element-plus'
import { Platform, Box, Delete, Plus } from '@element-plus/icons-vue'

const expressionEditorRef = ref<InstanceType<typeof ExpressionEditor> | null>(null)
const testExpression = ref('')
const originalExpression = ref('')
const validateResult = ref<boolean | null>(null)
const currentLanguage = ref('zh')

const handleLanguageChange = (lang: string) => {
  currentLanguage.value = lang
}

const handleExpressionChange = (value: string) => {
  console.log('Expression changed:', value)
  validateResult.value = null
}

const insertText = (text: string) => {
  expressionEditorRef.value?.insertAtCursor(text)
}

const validate = () => {
  try {
    const result = expressionEditorRef.value?.validateExpression()
    validateResult.value = !!result
    ElMessage({
      type: result ? 'success' : 'error',
      message: result ? '表达式验证通过' : '表达式验证失败'
    })
  } catch (error) {
    validateResult.value = false
    ElMessage.error('表达式验证出错')
  }
}

const clear = () => {
  testExpression.value = ''
  validateResult.value = null
}

const reset = () => {
  testExpression.value = originalExpression.value
  validateResult.value = null
}

// 默认变量列表
const DEFAULT_VARIABLES = [
  { name: '销售额', code: 'sales' },
  { name: '成本', code: 'cost' },
  { name: '利润', code: 'profit' }
]

// 变量列表状态
const variables = ref([...DEFAULT_VARIABLES])

// 删除变量
const removeVariable = (index: number) => {
  variables.value.splice(index, 1)
}

// 重置变量列表
const resetVariables = () => {
  variables.value = [...DEFAULT_VARIABLES]
}

// 新变量相关状态
interface Variable {
  name: string;
  code: string;
}

const showNewVariable = ref(false)
const newVariable = ref<Variable>({ name: '', code: '' })

// 检查是否可以添加变量
const canAddVariable = computed(() => {
  return newVariable.value.name.trim() && newVariable.value.code.trim() &&
         !variables.value.some(v => v.code === newVariable.value.code)
})

// 开始添加变量
const startAddVariable = () => {
  showNewVariable.value = true
  newVariable.value = { name: '', code: '' }
}

// 确认添加变量
const confirmAddVariable = () => {
  const name = newVariable.value.name.trim()
  const code = newVariable.value.code.trim()

  if (!name || !code) {
    ElMessage.warning('变量名称和代码不能为空')
    return
  }

  if (variables.value.some(v => v.code === code)) {
    ElMessage.warning('变量代码已存在')
    return
  }

  variables.value.push({
    name: name,
    code: code
  })
  showNewVariable.value = false
  newVariable.value = { name: '', code: '' }
}

// 取消添加变量
const cancelAddVariable = () => {
  showNewVariable.value = false
}
</script>

<style scoped>
.dev-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content-wrapper {
  max-width: 1440px;  /* 增加最大宽度 */
  margin: 0 auto;
  padding: 32px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 修改标题区域样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

/* 修改标题样式 */
.main-title {
  margin: 0;
  font-size: 28px;
  color: #2c3e50;
  font-weight: 600;
}

.demo-section {
  margin-top: 24px;
}

.section-title {
  font-size: 20px;
  color: #1a1a1a;
  margin-bottom: 16px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background-color: #409eff;
  border-radius: 2px;
}

.demo-box {
  background-color: #fff;
  padding: 24px;
  overflow: hidden;
  margin: 0 auto;
  max-width: 800px;
}

.actions-panel {
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.button-groups {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-title {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

:deep(.el-divider) {
  margin: 16px 0;
}

.validate-result {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}

.expression-value {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  border-left: 3px solid #409eff;
}

/* 修改链接容器样式 */
.links-container {
  display: flex;
  gap: 16px; /* 增加间距 */
}

/* 链接通用样式 */
.link-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  color: #ffffff;
  text-decoration: none;
  border: none;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.link-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.link-item:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.link-item .el-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.link-item:hover .el-icon {
  transform: scale(1.1);
}

/* NPM 链接特殊样式 */
.npm-link {
  background: linear-gradient(135deg, #cb3837 0%, #ff4545 100%);
}

/* GitHub 链接特殊样式 */
.github-link {
  background: linear-gradient(135deg, #333333 0%, #666666 100%);
}

/* 面板通用样式 */
.demo-panel,
.component-panel,
.result-panel {
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  margin-bottom: 20px;
}

/* 操作面板样式 */
.demo-panel {
  background-color: #f8fafc;
  border: 1px dashed #e4e7ed;
}

/* 组件面板样式 */
.component-panel {
  background-color: #fff;
  border: 2px solid #409eff1a;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 结果面板样式 */
.result-panel {
  background-color: #f8fafc;
  border: 1px solid #e4e7ed;
}

/* 面板标题样式 */
.panel-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

/* 分隔线样式 */
.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
  height: 1px;
  background-color: #e4e7ed;
}

.divider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #f8fafc;
  padding: 0 10px;
  color: #909399;
  font-size: 12px;
}

/* 组件包装器样式 */
.component-wrapper {
  position: relative;
  padding: 20px 0; /* 只保留上下间距 */
}

/* 修改按钮样式 */
.actions-panel {
  background-color: #fff;
  padding: 16px;
  border-radius: 6px;
}

/* 优化结果显示样式 */
.expression-value,
.validate-result {
  padding: 12px 16px;
  border-radius: 4px;
}

.expression-value {
  background-color: #fff;
  border: 1px solid #e4e7ed;
  margin-bottom: 12px;
}

.validate-result {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 添加表达式显示样式 */
.expression-display {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fff;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  border: 1px solid #e4e7ed;
}

.expression-code {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #f8fafc;
  border-radius: 4px;
  color: #409eff;
  font-family: monospace;
  font-size: 13px;
}

/* 变量管理面板样式 */
.variables-manager {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #e4e7ed;
}

.section-subtitle {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  gap: 12px;
}

.variable-input {
  flex: 1;
}

.variables-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

:deep(.el-input-group__prepend) {
  min-width: 60px;
  justify-content: center;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .variable-item {
    flex-direction: column;
  }

  .variable-input {
    width: 100%;
  }
}

/* 左右布局样式 */
.demo-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);  /* 保持左侧宽度固定，右侧自适应 */
  gap: 32px;
  align-items: start;
}

/* 左侧面板样式 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 右侧面板样式 */
.right-panel {
  flex: 1;
  min-width: 0;
}

/* 变量展示样式 */
.variable-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  gap: 8px;
}

.variable-name {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.variable-code {
  color: #909399;
  font-family: monospace;
  margin-right: auto;
}

/* 新变量表单样式 */
.new-variable-form {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 优化删除按钮样式 */
.variable-item .el-button {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

/* 响应式布局 */
@media screen and (max-width: 1024px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }
}

/* 调整响应式布局断点 */
@media screen and (max-width: 1600px) {  /* 增大断点值 */
  .content-wrapper {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    padding: 24px;  /* 在较小屏幕上减小内边距 */
  }
}

/* 暗色模式适配 */
:root.dark-mode {
  .demo-box {
    background-color: #fff;  /* 保持原有的白色背景 */
  }

  .actions-panel {
    background-color: #fff;  /* 保持原有的白色背景 */
  }

  .group-title {
    color: #606266;  /* 保持原有的文字颜色 */
  }

  .expression-value {
    background-color: #fff;
    border-color: #e4e7ed;
  }

  /* 确保外部操作区域的样式不受暗色模式影响 */
  .operations-panel {
    background-color: #fff;
    color: #606266;

    .expression-display {
      background-color: #fff;
      border-color: #e4e7ed;
      color: #606266;
    }

    .expression-code {
      background-color: #f8fafc;
      color: #409eff;
    }
  }

  /* 保持变量管理面板的原有样式 */
  .variables-manager {
    background-color: #fff;
    border-color: #e4e7ed;
  }

  .variable-item {
    background-color: #f8fafc;
  }

  .section-subtitle {
    color: #606266;
  }
}

/* 修正按钮样式，确保不受暗色模式影响 */
.variables-actions {
  .el-button {
    /* 覆盖暗色模式下的按钮样式 */
    background-color: #ffffff;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      color: #409eff;
      border-color: #c6e2ff;
      background-color: #ecf5ff;
    }

    &.el-button--primary {
      background-color: #409eff;
      border-color: #409eff;
      color: #ffffff;

      &:hover {
        background-color: #79bbff;
        border-color: #79bbff;
        color: #ffffff;
      }
    }
  }
}

/* 修改标题容器样式 */
.title-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 添加版本号样式 */
.version-tag {
  font-size: 16px;
  color: #606266;
  background-color: #f4f4f5;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  margin-left: 16px;
}
</style>
