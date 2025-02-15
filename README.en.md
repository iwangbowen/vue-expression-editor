# Vue Expression Editor

English | [简体中文](./README.md)

A powerful Vue 3 mathematical expression editor component that supports variable insertion, real-time calculation, dark theme, and more.

## Online Demo

🚀 [Live Demo](https://iwangbowen.github.io/vue-expression-editor)

📦 [NPM Package](https://www.npmjs.com/package/vue-expression-editor)

## Features

- 🎯 Mathematical expression editing and real-time validation
- 🔢 Built-in numeric keypad and operator buttons
- 📝 Variable insertion and management
- 🌓 Light/Dark theme support
- 💫 Smooth animations and interactions
- 🎨 Customizable button styles (square/round)
- 📐 Flexible layout options (vertical/horizontal)
- 🔍 Variable search functionality
- ⚡️ Real-time preview and calculation
- 🎛️ Rich customization settings

## Use Cases

- Financial formula configuration
- Data analysis expression editing
- Custom calculation field settings
- Business rule condition configuration
- Scientific calculator applications
- Mathematical education tools

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
    :show-toolbar="true"         <!-- Show toolbar -->
    :show-validate="true"        <!-- Show validation button -->
    :show-info="true"           <!-- Show information button -->
    :show-theme="true"          <!-- Show theme toggle -->
    :show-settings="true"       <!-- Show settings button -->
    :show-preview="true"        <!-- Show preview button -->
    :show-copy="true"          <!-- Show copy button -->
    :show-style-toggle="true"   <!-- Show style toggle -->
    :readonly="false"          <!-- Enable editing -->
    :disabled="false"          <!-- Enable component -->
    :max-length="1000"         <!-- Maximum input length -->
    :autofocus="false"         <!-- Auto focus on mount -->
    @update:modelValue="handleUpdate"
    @validation-change="handleValidationChange"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
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

// All supported callback methods
const handleUpdate = (value) => {
  console.log('Expression updated:', value)
}

const handleValidationChange = (valid, message) => {
  console.log('Validation result:', valid, message)
}

const handleChange = (value, displayValue) => {
  console.log('Expression changed:', value, displayValue)
}

const handleInput = (value) => {
  console.log('Input value:', value)
}

const handleFocus = () => {
  console.log('Focus gained')
}

const handleBlur = () => {
  console.log('Focus lost')
}

const handleClear = () => {
  console.log('Cleared')
}

// Example of calling component methods via ref
const expressionEditorRef = ref(null)

const validateExpression = () => {
  expressionEditorRef.value?.validateExpression()
}

const clearAll = () => {
  expressionEditorRef.value?.clearAll()
}

const focusInput = () => {
  expressionEditorRef.value?.focusInput()
}

const getExpression = () => {
  return expressionEditorRef.value?.getExpression()
}

const getDisplayExpression = () => {
  return expressionEditorRef.value?.getDisplayExpression()
}

const setExpression = (value) => {
  expressionEditorRef.value?.setExpression(value)
}

const reset = () => {
  expressionEditorRef.value?.reset()
}

const insertAtCursor = (text) => {
  expressionEditorRef.value?.insertAtCursor(text)
}
</script>
```

## Component Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| modelValue | string | '' | Expression value (v-model supported) |
| variables | Array | [] | List of available variables |
| showToolbar | boolean | true | Show toolbar |
| showValidate | boolean | true | Show validation button |
| showInfo | boolean | true | Show information button |
| showTheme | boolean | true | Show theme toggle button |
| showSettings | boolean | true | Show settings button |
| showPreview | boolean | true | Show preview button |
| showCopy | boolean | true | Show copy button |
| showStyleToggle | boolean | true | Show style toggle button |
| readonly | boolean | false | Read-only mode |
| disabled | boolean | false | Disable component |
| maxLength | number | 1000 | Maximum input length |
| autofocus | boolean | false | Auto focus on mount |

## Component Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| update:modelValue | (value: string) | Triggered when expression value updates |
| validation-change | (valid: boolean, message: string) | Triggered when validation state changes |
| change | (value: string, displayValue: string) | Triggered when expression changes |
| input | (value: string) | Triggered on input |
| focus | - | Triggered when focused |
| blur | - | Triggered when blurred |
| clear | - | Triggered when cleared |

## Methods

The following methods can be called via ref:

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
  // Get display expression (with variable names)
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
  // Auto complete brackets
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

1. Keyboard Shortcuts:
   - `Ctrl + Z`: Undo
   - `Ctrl + Y`: Redo
   - `Ctrl + C`: Copy
   - `Ctrl + V`: Paste
   - `Arrow keys`: Navigate between variables

2. Variable Input:
   - Type `@` to quickly select variables
   - Supports variable search filtering
   - Multi-language variable names supported

3. Auto Optimization:
   - Automatic multiplication operator handling
   - Auto bracket completion (configurable)
   - Smart handling of minus and negative signs

## Notes

1. Variable codes must be valid identifiers
2. Direct letter input not supported, use `@` to select variables
3. Variables are evaluated using their codes
4. Preview mode calculations are rounded to 2 decimal places

## Style Customization

The component uses CSS variables for theming, which can be customized:

```css
:root {
  --editor-bg: #ffffff;
  --editor-text: #303133;
  --editor-border: #dcdfe6;
  --editor-hover: #f5f5f5;
  --editor-active: #e6e6e6;
}
```

## GitHub Actions Deployment

This project uses GitHub Actions for automated demo page deployment.

### Trigger Conditions

The workflow is triggered in the following cases:

1. Manual trigger (workflow_dispatch)
2. Push to master branch with changes to:
   - Files in src/
   - Files in public/
   - index.html
   - vite.config.ts
   - package.json
   - Files in .github/workflows/

### Deployment Conditions

Deployment will only execute when either:

- Workflow is manually triggered
- Commit message contains `[deploy]` tag

Note: Updates to the following files won't trigger deployment:

- Documentation files (e.g., README.md)
- .gitignore
- .editorconfig
- LICENSE

### Workflow Process

1. Check deployment conditions
2. Install project dependencies
3. Build demo page
4. Deploy to GitHub Pages

### Best Practices

- Include `[deploy]` tag in commit messages for important updates
- Manual deployment available through Actions page
- Minor changes like documentation updates don't need deployment

## Release Notes

There are two ways to publish new versions:

1. Create GitHub Release
   - Create a new Release on GitHub
   - Actions will automatically trigger the publishing process

2. Manual Publishing
   - Manually trigger "NPM Publish" workflow in GitHub Actions
   - Enter version number (e.g., 1.0.0)

### NPM Publishing Configuration

1. Get NPM Token
   - Login to [npmjs.com](https://www.npmjs.com)
   - Click profile -> Access Tokens
   - Select "Generate New Token" (Automation)
   - Copy generated token

2. Configure GitHub Secrets
   - Go to GitHub repository Settings
   - Select Secrets and variables -> Actions
   - Click New repository secret
   - Add NPM_TOKEN secret

Notes:

- Ensure all tests pass before publishing
- Version numbers must follow semantic versioning
- Verify NPM_TOKEN is configured

## Local Development

1. Clone Repository

   ```bash
   git clone https://github.com/iwangbowen/vue-expression-editor.git
   cd vue-expression-editor
   ```

2. Install Dependencies

   ```bash
   npm install
   ```

3. Start Development Server

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

## Acknowledgments

Special thanks to Claude 3.5 Sonnet for assistance. This project's code was primarily generated by Claude 3.5 Sonnet, which provided significant support in:

- Project architecture design
- Core functionality implementation
- Documentation writing
- Code optimization suggestions
- Best practices guidance

Claude 3.5 Sonnet's powerful capabilities enabled rapid and high-quality completion of this project, demonstrating the immense potential of AI-assisted programming in modern software development.

## License

[MIT](LICENSE)
