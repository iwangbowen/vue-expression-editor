import { App } from 'vue';
import ExpressionEditor from './components/ExpressionEditor.vue';
import './styles/index.scss';  // 在入口文件中导入样式

// 添加组件类型声明
declare module 'vue' {
  export interface GlobalComponents {
    ExpressionEditor: typeof ExpressionEditor
  }
}

export { ExpressionEditor };

export default {
    install: (app: App) => {
        app.component('ExpressionEditor', ExpressionEditor);
    }
};
