# Vue Expression Editor

A powerful Vue 3 mathematical expression editor component that supports variable insertion, real-time calculation, dark theme, and more.

## Live Demo

🚀 [Live Demo](https://iwangbowen.github.io/vue-expression-editor)

## Features

- 🎯 Mathematical expression editing and real-time validation
- 🔢 Built-in numeric keypad and operator buttons
- 📝 Variable insertion and management
- 🌓 Light/Dark theme support
- 💫 Smooth animations and interactions
- 🎨 Customizable button styles (square/round)
- 📐 Flexible layout options (vertical/horizontal)
- 🔍 Variable search functionality
- ⚡️ Real-time preview and calculation results
- 🎛️ Rich customization settings

## Use Cases

- Financial formula configuration
- Data analysis expression editing
- Custom calculation field settings
- Business rule condition configuration
- Scientific calculator applications
- Mathematics education tools

## Installation

```bash
npm install vue-expression-editor
```

## Basic Usage

```vue
<template>
  <ExpressionEditor
    v-model="expression"
    :variables="variables"
    @validation-change="handleValidationChange"
  />
</template>

<script setup>
import { ref } from 'vue'
import ExpressionEditor from 'vue-expression-editor'

const expression = ref('')
const variables = [
  { name: 'Sales', code: 'sales' },
  { name: 'Cost', code: 'cost' },
  { name: 'Profit', code: 'profit' }
]

const handleValidationChange = (valid, message) => {
  console.log('Validation result:', valid, message)
}
</script>
```

## Component Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| modelValue | string | '' | Formula value (v-model supported) |
| variables | Array | [] | List of available variables |
| showToolbar | boolean | true | Show toolbar |
| showValidate | boolean | true | Show validation button |
| showInfo | boolean | true | Show info button |
| showTheme | boolean | true | Show theme toggle button |
| showSettings | boolean | true | Show settings button |
| showPreview | boolean | true | Show preview button |
| showCopy | boolean | true | Show copy button |
| showStyleToggle | boolean | true | Show style toggle button |
| readonly | boolean | false | Read-only mode |
| disabled | boolean | false | Disabled state |
| maxLength | number | 1000 | Maximum length |
| autofocus | boolean | false | Auto focus |

## Component Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| update:modelValue | (value: string) | Triggered when expression value updates |
| validation-change | (valid: boolean, message: string) | Triggered when validation state changes |
| change | (value: string, displayValue: string) | Triggered when expression changes |
| input | (value: string) | Triggered on input |
| focus | - | Triggered on focus |
| blur | - | Triggered on blur |
| clear | - | Triggered when cleared |

## Methods

Available methods through ref:

```typescript
interface ExpressionEditorMethods {
  // Validate current expression
  validateExpression(): void;
  // Clear expression
  clearAll(): void;
  // Focus input
  focusInput(): void;
  // Get current expression
  getExpression(): string;
  // Get displayed expression (with variable names)
  getDisplayExpression(): string;
  // Set expression value
  setExpression(value: string): void;
  // Reset editor state
  reset(): void;
  // Insert text at cursor position
  insertAtCursor(text: string): void;
}
```

## Custom Settings

The editor supports the following custom settings:

```typescript
interface EditorSettings {
  // Auto-complete brackets
  autoCompleteBrackets: boolean;
  // Enable bracket colors
  bracketColorEnabled: boolean;
  // Dark mode
  isDarkMode: boolean;
  // Horizontal layout
  horizontalLayout: boolean;
}
```

## Variable Definition

Variable list format:

```typescript
interface Variable {
  name: string;    // Display name
  code: string;    // Variable code
}
```

## Usage Tips

1. Keyboard shortcuts:
   - `Ctrl + Z`: Undo
   - `Ctrl + Y`: Redo
   - `Ctrl + C`: Copy
   - `Ctrl + V`: Paste
   - `Arrow keys`: Quick navigation between variables

2. Variable input:
   - Type `@` to quickly select variables
   - Supports variable search filtering
   - Supports Chinese variable names

3. Auto optimization:
   - Automatic multiplication operator handling between variables
   - Auto bracket completion (configurable)
   - Smart handling of negative and minus signs

## Notes

1. Variable codes must be valid identifiers
2. Direct letter input is not supported, use `@` to select variables
3. Variables in expressions use codes for calculation
4. Preview mode calculations show two decimal places

## Style Customization

The component uses CSS variables for theming, customize by overriding:

```css
:root {
  --editor-bg: #ffffff;
  --editor-text: #303133;
  --editor-border: #dcdfe6;
  --editor-hover: #f5f5f5;
  --editor-active: #e6e6e6;
}
```

## GitHub Actions

This project uses GitHub Actions for demo page deployment. The workflow is triggered by:

- Manual trigger (workflow_dispatch)
- Push to master branch with changes in:
  - Files under src/
  - Files under public/
  - index.html
  - vite.config.ts
  - package.json
  - Files under .github/workflows/

Note: Changes to the following files will not trigger deployment:
- Documentation files (*.md)
- .gitignore
- .editorconfig
- LICENSE

Deployment conditions:
- When workflow is manually triggered
- When commit message contains [deploy]

The workflow includes:
- Checking deployment conditions
- Installing dependencies
- Building demo page
- Deploying to GitHub Pages

## Local Development

1. Clone repository

   ```bash
   git clone https://github.com/iwangbowen/vue-expression-editor.git
   cd vue-expression-editor
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start development server

   ```bash
   npm run dev
   ```

   Development server will start at http://localhost:5173

4. Build

   ```bash
   npm run build
   ```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit Pull Request

## Acknowledgements

Special thanks to Claude 3.5 Sonnet for its assistance. The code in this project was primarily generated by Claude 3.5 Sonnet, which provided crucial support in:

- Project architecture design
- Core functionality implementation
- Documentation writing
- Code optimization suggestions
- Best practices guidance

Claude 3.5 Sonnet's powerful capabilities enabled the rapid and high-quality completion of this project. This demonstrates the enormous potential of AI-assisted programming in modern software development.

## License

[MIT](LICENSE)
