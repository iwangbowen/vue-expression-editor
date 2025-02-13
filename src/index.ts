import { App } from 'vue'
import ExpressionEditor from './components/ExpressionEditor.vue'

export { ExpressionEditor }

export default {
  install: (app: App) => {
    app.component('ExpressionEditor', ExpressionEditor)
  }
}
