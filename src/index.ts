import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'

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
