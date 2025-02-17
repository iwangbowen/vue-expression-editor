export default {
  editor: {
    placeholder: '请输入表达式，使用 @ 插入变量',
    incompleteTip: '公式尚未完成，请继续输入',
    calculationResult: '计算结果',
    buttons: {
      validate: '验证表达式',
      clear: '清空',
      reset: '重置',
      settings: '设置',
      copy: '复制',
      preview: '预览',
      condition: '条件'
    },
    tooltips: {
      validate: '校验公式',
      viewFormula: '查看实际公式',
      layoutToggle: '切换布局',
      themeToggle: '切换主题',
      settings: '设置',
      preview: '实时预览',
      copy: '复制显示公式',
      styleToggle: '切换键盘样式',
      clear: '清空',
      condition: '添加条件表达式',
      undo: '撤销 (Ctrl+Z)',
      redo: '重做 (Ctrl+Y)',
      delete: '删除'
    }
  },
  settings: {
    title: '编辑器设置',
    language: '语言',
    autoCompleteBrackets: '自动补全括号',
    bracketColorEnabled: '括号颜色区分',
    horizontalLayout: '水平布局',
    buttons: {
      cancel: '取消',
      confirm: '确定'
    }
  },
  variables: {
    title: '选择变量',
    close: '关闭'
  },
  messages: {
    copied: '已复制到剪贴板',
    validSuccess: '表达式验证通过',
    validError: '表达式验证失败'
  },
  conditionalDialog: {
    title: '添加条件表达式',
    condition: '条件表达式',
    leftValue: '左值',
    rightValue: '右值',
    operator: '运算符',
    variable: '变量',
    constant: '常量',
    selectVariable: '选择变量',
    enterNumber: '输入数值',
    whenTrue: '条件成立时',
    cancel: '取消',
    confirm: '确定',
    errors: {
      incomplete: '请填写完整的条件表达式',
      invalidLeftValue: '左值必须是有效的数字',
      invalidRightValue: '右值必须是有效的数字',
      invalidFalseValue: '条件不成立时的值必须是有效的数字',
      invalidTrueValue: '条件成立时的值必须是有效的数字'
    }
  }
}
