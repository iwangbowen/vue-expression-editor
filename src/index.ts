import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'

// 确保样式依赖被正确加载，注意引入顺序
import './components/styles/variables.scss'
import './components/styles/base.scss'
import './components/styles/buttons.scss'
import './components/styles/input.scss'
import './components/styles/layout.scss'
import './components/styles/theme.scss'

// 添加组件类型声明
declare module 'vue' {
  export interface GlobalComponents {
    ExpressionEditor: typeof ExpressionEditor
  }
}

const install = (app: App) => {
  app.component('ExpressionEditor', ExpressionEditor)
}

ExpressionEditor.install = install

export { ExpressionEditor }
export default ExpressionEditor
