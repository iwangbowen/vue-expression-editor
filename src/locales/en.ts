export default {
  editor: {
    placeholder: 'Enter expression, use @ to insert variables',
    incompleteTip: 'Formula is incomplete, please continue',
    calculationResult: 'Calculation Result',
    actualFormula: 'Actual Formula',
    buttons: {
      validate: 'Validate',
      clear: 'Clear',
      reset: 'Reset',
      settings: 'Settings',
      copy: 'Copy',
      preview: 'Preview',
      condition: 'IF'
    },
    tooltips: {
      validate: 'Validate Formula',
      viewFormula: 'View Actual Formula',
      layoutToggle: 'Toggle Layout',
      themeToggle: 'Toggle Theme',
      settings: 'Settings',
      preview: 'Live Preview',
      copy: 'Copy Formula',
      styleToggle: 'Toggle Keyboard Style',
      clear: 'Clear',
      condition: 'Add Conditional Expression',
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      delete: 'Delete'
    },
    inputTip: 'Tip: Type @ to insert variables, use arrow keys to navigate, Enter to confirm',
    emptyFormulaCopy: 'Formula is empty',
    copySuccess: 'Copied successfully',
    copyFailed: 'Copy failed',
    emptyClipboard: 'Clipboard is empty',
    specialChars: 'Special characters not allowed',
    pasteSuccess: 'Pasted successfully',
    pasteFailed: 'Paste failed',
    autoConvertVariables: 'Variables have been automatically converted',
    invalidFormula: 'Invalid formula',
    messages: {
      emptyFormula: 'Formula is empty',
      validError: 'Expression validation failed',
      validSuccess: 'Expression validation passed',
      incompleteTip: 'Formula is incomplete',
      emptyTip: 'Please enter an expression',
      calculationResult: 'Result'
    }
  },
  settings: {
    title: 'Editor Settings',
    language: 'Language',
    autoCompleteBrackets: 'Auto Complete Brackets',
    bracketColorEnabled: 'Enable Bracket Colors',
    horizontalLayout: 'Horizontal Layout',
    buttons: {
      cancel: 'Cancel',
      confirm: 'OK'
    }
  },
  variables: {
    title: 'Select Variable',
    close: 'Close'
  },
  messages: {
    copied: 'Copied to clipboard',
    validSuccess: 'Expression validation passed',
    validError: 'Expression validation failed'
  },
  conditionalDialog: {
    title: 'Add Conditional Expression',
    condition: 'Condition',
    leftValue: 'Left Value',
    rightValue: 'Right Value',
    operator: 'Operator',
    variable: 'Variable',
    constant: 'Constant',
    selectVariable: 'Select Variable',
    enterNumber: 'Enter Number',
    whenTrue: 'When True',
    whenFalse: 'When False',
    cancel: 'Cancel',
    confirm: 'Confirm',
    errors: {
      incomplete: 'Please complete all fields',
      invalidLeftValue: 'Left value must be a valid number',
      invalidRightValue: 'Right value must be a valid number',
      invalidTrueValue: 'True value must be a valid number',
      invalidFalseValue: 'False value must be a valid number'
    }
  }
}
