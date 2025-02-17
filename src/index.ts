import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'

const install = (app: App) => {
  app.component('ExpressionEditor', ExpressionEditor)
}

// 直接导出组件
ExpressionEditor.install = install

export { ExpressionEditor }
export default ExpressionEditor
