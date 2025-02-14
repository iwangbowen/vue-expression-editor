<template>
  <div class="dev-container">
    <div class="content-wrapper">
      <!-- 修改标题区域为 flex 布局 -->
      <div class="header">
        <h1 class="main-title">Vue Expression Editor</h1>
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
        <div class="demo-box">
          <!-- 操作面板区域 -->
          <div class="demo-panel">
            <h3 class="panel-title">👇 组件外部操作示例</h3>
            <!-- 将表达式显示移到这里 -->
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
            <div class="divider">
              <span class="divider-text">以上是外部操作示例</span>
            </div>
          </div>

          <!-- 组件展示区域 -->
          <div class="component-panel">
            <h3 class="panel-title">👇 表达式编辑器组件</h3>
            <div class="component-wrapper">
              <ExpressionEditor
                ref="expressionEditorRef"
                v-model="testExpression"
                :initial-value="originalExpression"
                @change="handleExpressionChange"
              />
            </div>
          </div>

          <!-- 结果展示区域 -->
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExpressionEditor from '../components/ExpressionEditor.vue'
import { ElMessage } from 'element-plus'
import { Platform, Box } from '@element-plus/icons-vue'

const expressionEditorRef = ref<InstanceType<typeof ExpressionEditor> | null>(null)

// 将原始表达式定义为常量
const INITIAL_EXPRESSION = '1 + 2 * 3'
const testExpression = ref(INITIAL_EXPRESSION)
const originalExpression = ref(INITIAL_EXPRESSION)
const validateResult = ref<boolean | null>(null)

const handleExpressionChange = (value: string) => {
  console.log('Expression changed:', value)
  validateResult.value = null
}

const insertText = (text: string) => {
  expressionEditorRef.value?.insertAtCursor(text)
}

const validate = () => {
  try {
    const result = expressionEditorRef.value?.validate()
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
</script>

<style scoped>
.dev-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content-wrapper {
  max-width: 900px;
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
</style>
