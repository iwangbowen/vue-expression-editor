import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'
import VariableItem from './components/VariableItem.vue'
import './styles/index.scss';

// Export types
export type { Variable } from './types';

// 添加组件类型声明
declare module 'vue' {
  export interface GlobalComponents {
    ExpressionEditor: typeof ExpressionEditor
    VariableItem: typeof VariableItem
  }
}

const install = (app: App) => {
  app.component('ExpressionEditor', ExpressionEditor)
  app.component('VariableItem', VariableItem)
}

ExpressionEditor.install = install

export { ExpressionEditor, VariableItem }
export default ExpressionEditor
