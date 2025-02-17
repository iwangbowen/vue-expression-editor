export default {
  editor: {
    placeholder: 'Enter expression, use @ to insert variables',
    incompleteTip: 'Formula is incomplete, please continue',
    calculationResult: 'Calculation Result',
    buttons: {
      validate: 'Validate',
      clear: 'Clear',
      reset: 'Reset',
      settings: 'Settings',
      copy: 'Copy',
      preview: 'Preview'
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
