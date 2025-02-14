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
        <h2 class="section-title">基础用法</h2>
        <div class="demo-box">
          <div class="actions-panel">
            <div class="button-groups">
              <div class="group-title">运算符：</div>
              <el-button-group>
                <el-button type="primary" @click="insertText('+')" plain>插入 +</el-button>
                <el-button type="primary" @click="insertText('-')" plain>插入 -</el-button>
                <el-button type="primary" @click="insertText('*')" plain>插入 *</el-button>
                <el-button type="primary" @click="insertText('/')" plain>插入 /</el-button>
              </el-button-group>
            </div>
            <div class="button-groups">
              <div class="group-title">操作：</div>
              <el-button-group>
                <el-button type="success" @click="validate">验证表达式</el-button>
                <el-button type="warning" @click="clear">清空</el-button>
                <el-button type="info" @click="reset">重置</el-button>
              </el-button-group>
            </div>
          </div>
          <el-divider />
          <ExpressionEditor
            ref="expressionEditorRef"
            v-model="testExpression"
            @change="handleExpressionChange"
          />
          <div class="expression-value" v-if="testExpression">
            当前表达式：{{ testExpression }}
          </div>
          <div class="validate-result" v-if="validateResult !== null">
            验证结果：
            <el-tag :type="validateResult ? 'success' : 'danger'">
              {{ validateResult ? '有效' : '无效' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import ExpressionEditor from '../components/ExpressionEditor.vue'
import { ElMessage } from 'element-plus'
import { Platform, Box } from '@element-plus/icons-vue'

const expressionEditorRef = ref<InstanceType<typeof ExpressionEditor> | null>(null)
const testExpression = ref('1 + 2 * 3')
const validateResult = ref<boolean | null>(null)
const originalExpression = '1 + 2 * 3'

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
  testExpression.value = originalExpression
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
</style>
