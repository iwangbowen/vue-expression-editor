import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'
// 引入基础样式
import './components/styles/base.scss'
import './components/styles/buttons.scss'
import './components/styles/input.scss'
import './components/styles/layout.scss'
import './components/styles/theme.scss'

const install = (app: App) => {
  app.component('ExpressionEditor', ExpressionEditor)
}

// 直接导出组件
ExpressionEditor.install = install

export { ExpressionEditor }
export default ExpressionEditor
