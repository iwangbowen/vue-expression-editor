<template>
  <div class="formula-editor">
    <div class="formula-input-container">
      <div class="formula-text" ref="formulaTextRef">
        <div class="input-wrapper" ref="wrapperRef" :class="{ 'validation-success': showValidationSuccess, 'validation-error': showValidationError }">
          <input ref="inputRef" v-model="displayExpression" @input="handleDisplayInput" @keydown="handleKeydown"
            :placeholder="t('editor.placeholder')" class="formula-input" :style="{ fontSize: `${fontSize}px` }" @scroll="handleScroll"
            :readonly="readonly" :disabled="disabled" :maxlength="maxLength" @focus="handleFocus" @blur="handleBlur" />
          <div class="highlight-overlay" :style="{
            fontSize: `${fontSize}px`,
            transform: `translateX(${-scrollLeft}px)`
          }">
            <template v-for="token in displayTokens" :key="token.start">
              <span v-if="token.type === 'bracket'" class="bracket" :class="[token.bracketStatus]"
                :style="{ color: getBracketColor(token.bracketStatus, token.bracketIndex) }">
                {{ token.text }}
              </span>
              <span v-else :class="token.type">{{ token.text }}</span>
            </template>
          </div>
          <div class="scroll-indicator left" v-show="hasLeftScroll"></div>
          <div class="scroll-indicator right" v-show="hasRightScroll"></div>
        </div>
        <button class="clear-button" @click="clearAll" :title="t('editor.tooltips.clear')">{{ t('editor.buttons.clear') }}</button>
      </div>
      <div class="input-tip" :class="{ 'validation-success': showValidationSuccess, 'validation-error': showValidationError }">
        {{ validationMessage || defaultTipMessage }}
      </div>
    </div>
    <div class="formula-info" v-if="showToolbar">
      <div class="left-actions">
        <el-button class="condition-button" @click="showConditionalDialog" :title="t('editor.tooltips.condition')">
          <el-icon>
            <CirclePlus />
          </el-icon>
          {{ t('editor.buttons.condition') }}
        </el-button>
        <button v-if="showValidate" class="validate-button" @click="validateExpression"
          :class="{ success: validationStatus === 'success', error: validationStatus === 'error' }" :title="t('editor.tooltips.validate')">
          <el-icon>
            <Check />
          </el-icon>
        </button>
        <button v-if="showInfo" class="info-button" @click="toggleShowExpression" :class="{ active: showExpression }"
          :title="t('editor.tooltips.viewFormula')">
          <el-icon>
            <InfoFilled />
          </el-icon>
        </button>
        <div v-if="showExpression" class="actual-expression">
          实际公式：<code>{{ expression }}</code>
        </div>
      </div>
      <div class="right-actions">
        <button class="layout-toggle" @click="toggleLayout" :title="t('editor.tooltips.layoutToggle')">
          <el-icon>
            <component :is="CaretBottom" :class="['layout-icon', { 'rotate-90': horizontalLayout }]" />
          </el-icon>
        </button>
        <button v-if="showTheme" class="theme-toggle" @click="toggleTheme" :class="{ active: isDarkMode }" :title="t('editor.tooltips.themeToggle')">
          <el-icon>
            <Moon v-if="isDarkMode" />
            <Sunny v-else />
          </el-icon>
        </button>
        <button v-if="showSettings" class="settings-button" @click="showSettingsDialog" :title="t('editor.tooltips.settings')">
          <el-icon>
            <Setting />
          </el-icon>
        </button>
        <button v-if="showPreview" class="preview-button" @click="togglePreviewMode" :class="{ active: previewMode }"
          :title="t('editor.tooltips.preview')">
          <el-icon>
            <View />
          </el-icon>
        </button>
        <button v-if="showCopy" class="copy-button" @click="copyFormula" :title="t('editor.tooltips.copy')">
          <el-icon>
            <CopyDocument />
          </el-icon>
        </button>
        <button v-if="showStyleToggle" class="style-toggle" @click="toggleKeyboardStyle"
          :class="{ active: isCircleStyle }" :title="t('editor.tooltips.styleToggle')">
          <el-icon>
            <Operation />
          </el-icon>
        </button>
      </div>
    </div>
    <div class="editor-content" :class="[
      { 'circle-style': isCircleStyle },
      { 'horizontal-layout': horizontalLayout }
    ]">
      <div class="variables-section">
        <div class="variables-search">
          <el-input v-model="variableSearchText" placeholder="搜索变量" clearable :prefix-icon="Search" />
        </div>
        <div class="variables" ref="variablesRef">
          <el-scrollbar>
            <button v-for="variable in filteredVariables" :key="variable.code" @click="addVariable(variable)"
              :title="variable.name">
              {{ variable.name }}
            </button>
          </el-scrollbar>
        </div>
      </div>
      <Calculator :can-undo="canUndo" :can-redo="canRedo" :is-circle-style="isCircleStyle" :t="t" @number="addNumber"
        @operator="addOperator" @delete="deleteLast" @undo="undo" @redo="redo" />
    </div>
    <div v-if="previewMode" class="preview-panel">
      <div class="variables-input">
        <div v-for="variable in variables" :key="variable.code" class="variable-item">
          <span class="variable-name">{{ variable.name }}:</span>
          <el-input-number v-model="variableValues[variable.code]" :min="0" :precision="2" :step="0.1"
            @change="calculateResult" />
        </div>
      </div>
      <div class="preview-result">
        <template v-if="!displayExpression">
          <div class="empty-tip">{{ t('editor.emptyTip') }}</div>
        </template>
        <template v-else-if="!isFormulaComplete">
          <div class="incomplete-tip">{{ t('editor.incompleteTip') }}</div>
        </template>
        <template v-else>
          {{ t('editor.calculationResult') }}: <span class="result-value">{{ calculationResult }}</span>
        </template>
      </div>
    </div>
  </div>
  <EditorSettings v-model:visible="settingsDialogVisible" :initial-settings="{
    autoCompleteBrackets,
    bracketColorEnabled,
    horizontalLayout,
    language: props.language
  }" :t="t" @save="handleSettingsSave" @cancel="handleSettingsCancel" />
  <VariableSuggestions v-model:visible="showVariableSuggestions" :suggestions="variableSuggestions"
    :selectedIndex="selectedSuggestionIndex" :wrapper-ref="wrapperRef" :t="t" @select="handleVariableSelect"
    @close="handleSuggestionsClose" />
  <ConditionalDialog v-model="conditionalDialogVisible" :variables="props.variables" :t="t"
    @confirm="handleConditionalConfirm" @cancel="handleConditionalCancel" />
</template>

<script setup lang="ts">
import { Check, CopyDocument, InfoFilled, Moon, CirclePlus, Setting, Sunny, View, Operation, Search, CaretBottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import Calculator from './Calculator.vue';
import EditorSettings from './EditorSettings.vue';
import VariableSuggestions from './VariableSuggestions.vue';
import ConditionalDialog from './ConditionalDialog.vue';
import type { Variable } from '../types';
import { ExpressionService } from '../services/expressionService';
import { VariableService } from '../services/variableService';
import { InputService } from '../services/inputService';
import { ALLOWED_DIRECT_INPUT, CONTROL_KEYS, VARIABLE_TRIGGER } from '../constants/editor';
import { ExpressionCalculationService } from '../services/expressionCalculationService';
import zhLocale from '../locales/zh';
import enLocale from '../locales/en';

// Token 接口合并和优化
interface Token {
  type: string;
  text: string;
  start?: number;
  end?: number;
  bracketStatus?: 'unmatched' | 'matched' | 'current';
  bracketIndex?: number;
}

// 添加验证状态相关变量
const validationStatus = ref<'success' | 'error' | ''>('');
const validationMessage = ref('');

// 添加默认提示信息和校验状态
const defaultTipMessage = computed(() => t('editor.inputTip'));
const showValidationSuccess = ref(false);
const showValidationError = ref(false);
let validationTimer: number | null = null;

interface Props {
  // 工具栏显示控制
  showToolbar?: boolean;
  showValidate?: boolean;
  showInfo?: boolean;
  showTheme?: boolean;
  showSettings?: boolean;
  showPreview?: boolean;
  showCopy?: boolean;
  showStyleToggle?: boolean;

  // 初始设置
  initialSettings?: {
    autoCompleteBrackets?: boolean;
    bracketColorEnabled?: boolean;
    isDarkMode?: boolean;
    horizontalLayout?: boolean; // 添加horizontalLayout默认值
  };

  // 变量列表
  variables?: Variable[];

  // 初始表达式值
  modelValue?: string;

  // 是否只读
  readonly?: boolean;

  // 是否禁用
  disabled?: boolean;

  // 最大长度限制
  maxLength?: number;

  // 字体大小范围
  minFontSize?: number;
  maxFontSize?: number;

  // 自动获取焦点
  autofocus?: boolean;

  // 语言
  language?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showValidate: true,
  showInfo: true,
  showTheme: true,
  showSettings: true,
  showPreview: true,
  showCopy: true,
  showStyleToggle: true,
  initialSettings: () => ({
    autoCompleteBrackets: false,
    bracketColorEnabled: false,
    isDarkMode: false,
    horizontalLayout: false // 添加horizontalLayout默认值
  }),
  variables: () => [],
  modelValue: '',
  readonly: false,
  disabled: false,
  maxLength: 1000,
  minFontSize: 18,
  maxFontSize: 24,
  autofocus: false,
  language: 'zh'
});

// 添加语言支持
const currentLocale = computed(() => props.language === 'en' ? enLocale : zhLocale);
const t = (key: string): string => {
  const keys = key.split('.');
  let result: any = currentLocale.value;
  for (const k of keys) {
    if (result[k] === undefined) return key;
    result = result[k];
  }
  return result as string;
};

// 计算与校验相关变量
const calculationResult = ref<number | null>(null);

// 主题与设置相关变量
const isDarkMode = ref(false);
const settingsDialogVisible = ref(false);
const autoCompleteBrackets = ref(false);
const bracketColorEnabled = ref(false);

// 历史记录相关变量
const history = ref<string[]>([]);
const historyIndex = ref(-1);

// 滚动与光标相关变量
const scrollLeft = ref(0);
const wrapperRef = ref<HTMLDivElement | null>(null);

// 变量提示相关变量
const showVariableSuggestions = ref(false);
const variableSuggestions = ref<Variable[]>([]);
const selectedSuggestionIndex = ref(0);

// 预览模式相关变量
const previewMode = ref(false);
const variableValues = ref<Record<string, number>>({});

// 常量定义
const MAX_FONT_SIZE = 24;
const MIN_FONT_SIZE = 18;
const PADDING = 24;

// 基础状态变量
const expression = ref('');
const displayExpression = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const formulaTextRef = ref<HTMLDivElement | null>(null);
const fontSize = ref(MAX_FONT_SIZE);
const isCircleStyle = ref(false);
const showExpression = ref(false);
const horizontalLayout = ref(false); // 添加horizontalLayout变量

// 计算属性
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

// 添加公式完整性检查
const isFormulaComplete = computed(() => {
  if (!displayExpression.value) return false;
  // 检查是否有未闭合的括号
  const bracketsMatch = (displayExpression.value.match(/\(/g) || []).length ===
                       (displayExpression.value.match(/\)/g) || []).length;
  // 检查是否以运算符结尾
  const endsWithOperator = /[+\-*/]$/.test(displayExpression.value);
  return bracketsMatch && !endsWithOperator;
});

const hasLeftScroll = computed(() => {
  const input = inputRef.value;
  return input ? input.scrollLeft > 0 : false;
});

const hasRightScroll = computed(() => {
  const input = inputRef.value;
  return input ? (input.scrollWidth > input.clientWidth &&
    input.scrollLeft < input.scrollWidth - input.clientWidth) : false;
});

// 将显示表达式转换为实际表达式
const convertDisplayToReal = (display: string): string => {
  return ExpressionCalculationService.convertDisplayToReal(display, props.variables);
};

// 将实际表达式转换为显示表达式
const convertRealToDisplay = (real: string): string => {
  return ExpressionCalculationService.convertRealToDisplay(real, props.variables);
};

// 计算合适的字体大小
const calculateFontSize = () => {
  const container = formulaTextRef.value;
  const input = inputRef.value;
  if (!container || !input) return;

  const span = document.createElement('span');
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.fontSize = `${MAX_FONT_SIZE}px`;
  span.style.fontFamily = 'monospace';
  span.style.whiteSpace = 'pre';
  span.textContent = displayExpression.value || 'A';
  document.body.appendChild(span);

  const containerWidth = container.clientWidth - PADDING;
  const inputWidth = span.offsetWidth;
  document.body.removeChild(span);

  if (inputWidth > containerWidth) {
    const ratio = containerWidth / inputWidth;
    const newSize = Math.max(MAX_FONT_SIZE * ratio, MIN_FONT_SIZE);
    fontSize.value = Math.floor(newSize);
  } else {
    fontSize.value = MAX_FONT_SIZE;
  }

  // 字体大小改变后，确保光标可见
  nextTick(() => {
    scrollToCursor();
  });
};

// 监听表达式变化，调整字体大小
watch(displayExpression, () => {
  nextTick(() => {
    calculateFontSize();
  });
});

// 监听容器大小变化
onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    calculateFontSize();
  });

  if (formulaTextRef.value) {
    resizeObserver.observe(formulaTextRef.value);
  }

  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

// 更新简化后的 handleDisplayInput 函数
const handleDisplayInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  const cursorPosition = input.selectionStart || 0;

  // 如果当前输入的是@字符，直接显示变量选择框
  if (value.charAt(cursorPosition - 1) === VARIABLE_TRIGGER) {
    showVariableSuggestions.value = true;
    variableSuggestions.value = props.variables;
    selectedSuggestionIndex.value = 0;
    displayExpression.value = value;
    return;
  }

  // 如果变量选择框已显示，处理变量搜索
  if (showVariableSuggestions.value) {
    const lastTriggerPos = value.slice(0, cursorPosition).lastIndexOf(VARIABLE_TRIGGER);
    if (lastTriggerPos !== -1) {
      const searchText = value.slice(lastTriggerPos + 1, cursorPosition);
      variableSuggestions.value = props.variables.filter(v =>
        v.name.toLowerCase().includes(searchText.toLowerCase()) ||
        v.code.toLowerCase().includes(searchText.toLowerCase())
      );
      selectedSuggestionIndex.value = 0;
    }
  }

  // 更新表达式值
  displayExpression.value = value;
  expression.value = convertDisplayToReal(value);

  nextTick(() => {
    input.setSelectionRange(cursorPosition, cursorPosition);
    scrollToCursor();
    calculateFontSize();
  });

  addToHistory(displayExpression.value);

  if (previewMode.value && !showVariableSuggestions.value) {
    calculateResult();
  }

  emit('input', expression.value);
};

// 监听实际表达式变化，更新显示表达式
watch(expression, (newValue) => {
  displayExpression.value = convertRealToDisplay(newValue);
});

// 修改 addVariable 函数
const addVariable = (variable: Variable) => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const before = displayExpression.value.slice(0, cursorPosition);
  const after = displayExpression.value.slice(cursorPosition);

  const insertion = VariableService.formatVariableInsertion(variable, before, after, props.variables);

  displayExpression.value = before + insertion + after;
  expression.value = convertDisplayToReal(displayExpression.value);

  nextTick(() => {
    const newPosition = cursorPosition + insertion.length;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  });

  addToHistory(displayExpression.value);
};

const focusInput = () => {
  inputRef.value?.focus();
};

// 修改检查光标位置的函数

// 修改 handleKeydown 函数，更新对@的处理
const handleKeydown = (event: KeyboardEvent) => {
  const input = inputRef.value;
  if (!input) return;

  // 允许原生页面刷新快捷键
  if (event.key === 'F5' || (event.ctrlKey && event.key.toLowerCase() === 'r')) {
    return;
  }

  // 允许@符号直接输入
  if (event.key === '@') {
    return;
  }

  // 处理变量提示相关的快捷键
  if (showVariableSuggestions.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % variableSuggestions.value.length;
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedSuggestionIndex.value = (selectedSuggestionIndex.value - 1 + variableSuggestions.value.length) % variableSuggestions.value.length;
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      insertSelectedVariable();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeVariableSuggestions();
      return;
    }
  }

  // 处理组合键
  if (event.ctrlKey || event.metaKey) {
    const allowedCtrlKeys = ['c', 'v', 'x', 'z', 'y', 'a'];
    if (!allowedCtrlKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
      return;
    }
    // 处理复制、粘贴等快捷键
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    return;
  }

  // 处理特殊按键
  if (CONTROL_KEYS.has(event.key)) {
    const cursorPosition = input.selectionStart || 0;

    // 处理删除键
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const effectivePosition = event.key === 'Backspace' ? cursorPosition - 1 : cursorPosition;
      if (effectivePosition < 0) return;

      // 检查是否正在删除运算符
      const operatorAtCursor = InputService.checkCursorAroundOperator(
        displayExpression.value,
        effectivePosition
      );

      // 如果在运算符位置
      if (operatorAtCursor) {
        event.preventDefault();
        const before = displayExpression.value.slice(0, operatorAtCursor.start);
        const after = displayExpression.value.slice(operatorAtCursor.end);
        displayExpression.value = before + after;
        expression.value = convertDisplayToReal(displayExpression.value);

        nextTick(() => {
          const newPosition = operatorAtCursor.start;
          input.setSelectionRange(newPosition, newPosition);
          input.focus();
        });
        addToHistory(displayExpression.value);
        return;
      }

      // 检查是否在变量位置
      const variableAtCursor = InputService.checkCursorInVariable(
        displayExpression.value,
        effectivePosition,
        props.variables
      );

      if (variableAtCursor) {
        event.preventDefault();
        const before = displayExpression.value.slice(0, variableAtCursor.start);
        const after = displayExpression.value.slice(variableAtCursor.end);
        displayExpression.value = before + after;
        expression.value = convertDisplayToReal(displayExpression.value);

        nextTick(() => {
          const newPosition = variableAtCursor.start;
          input.setSelectionRange(newPosition, newPosition);
          input.focus();
        });
        addToHistory(displayExpression.value);
        return;
      }
    }

    // 处理方向键
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const cursorPosition = input.selectionStart || 0;

      // 使用新的方法计算下一个光标位置
      const newPos = InputService.getNextCursorPosition(
        displayExpression.value,
        cursorPosition,
        event.key === 'ArrowRight' ? 'right' : 'left',
        props.variables
      );

      if (newPos !== cursorPosition) {
        event.preventDefault();
        nextTick(() => {
          input.setSelectionRange(newPos, newPos);
          scrollToCursor();
        });
      }
      return;
    }
    return;
  }

  // 处理普通输入字符
  if (!ALLOWED_DIRECT_INPUT.has(event.key)) {
    event.preventDefault();
    if (/^[a-zA-Z]$/.test(event.key)) {
      ElMessage({
        message: '请使用 @ 符号选择变量',
        type: 'warning',
        duration: 2000
      });
    }
    return;
  }

  // 使用 InputService 处理输入
  const result = InputService.validateAndProcessInput(
    displayExpression.value,
    event.key,
    input.selectionStart || 0
  );

  if (!result.isValid) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  displayExpression.value = result.value;
  expression.value = convertDisplayToReal(result.value);

  nextTick(() => {
    input.setSelectionRange(result.cursorPosition, result.cursorPosition);
    input.focus();
    scrollToCursor();
  });

  addToHistory(displayExpression.value);
};

// 修改添加数字的函数
const addNumber = (num: string) => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const before = displayExpression.value.slice(0, cursorPosition);
  const after = displayExpression.value.slice(cursorPosition);

  // 确保 variables 是一个数组
  const safeVariables = Array.isArray(props.variables) ? props.variables : [];

  // 应用自动校正，使用 ExpressionService
  const correctedInput = ExpressionService.autoCorrectInput(before, num, safeVariables);
  if (correctedInput === before) return; // 如果输入被完全拒绝，直接返回

  displayExpression.value = correctedInput + after;
  expression.value = convertDisplayToReal(displayExpression.value);

  // 设置光标位置到新内容后
  nextTick(() => {
    const newPosition = correctedInput.length;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  });

  // 添加到历史记录
  addToHistory(displayExpression.value);
};

// 修改添加操作符的函数
const addOperator = (operator: string) => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const before = displayExpression.value.slice(0, cursorPosition);
  const after = displayExpression.value.slice(cursorPosition);

  // 确保 variables 是一个数组
  const safeVariables = Array.isArray(props.variables) ? props.variables : [];

  // 应用自动校正，使用 ExpressionService
  const correctedInput = ExpressionService.autoCorrectInput(before, operator, safeVariables);
  if (correctedInput === before) return; // 如果输入被完全拒绝，直接返回

  if (autoCompleteBrackets.value && operator === '(') {
    displayExpression.value = correctedInput + ')' + after;
    expression.value = convertDisplayToReal(displayExpression.value);
    nextTick(() => {
      input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      input.focus();
    });
  } else {
    displayExpression.value = correctedInput + after;
    expression.value = convertDisplayToReal(displayExpression.value);
    nextTick(() => {
      input.focus();
    });
  }

  // 添加到历史记录
  addToHistory(displayExpression.value);
};

// 修改 deleteLast 函数
const deleteLast = () => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  if (cursorPosition === 0) return;

  // 检查是否在删除变量
  const variableAtCursor = InputService.checkCursorInVariable(
    displayExpression.value,
    cursorPosition - 1,
    props.variables
  );

  if (variableAtCursor) {
    // 变量删除逻辑保持不变
    const before = displayExpression.value.slice(0, variableAtCursor.start);
    const after = displayExpression.value.slice(variableAtCursor.end);
    displayExpression.value = before + after;
  } else {
    // 获取光标前的字符
    const beforeCursor = displayExpression.value.slice(0, cursorPosition);
    const afterCursor = displayExpression.value.slice(cursorPosition);

    // 检查光标是否在数字后面
    const lastChar = beforeCursor[beforeCursor.length - 1];
    const isLastCharNumber = /\d/.test(lastChar);

    displayExpression.value = beforeCursor.slice(0, -1) + afterCursor;
  }

  expression.value = convertDisplayToReal(displayExpression.value);

  nextTick(() => {
    const newPosition = cursorPosition - 1;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  });

  // 添加到历史记录
  addToHistory(displayExpression.value);
};

const clearAll = () => {
  displayExpression.value = '';
  expression.value = '';
  emit('clear');
  nextTick(() => {
    inputRef.value?.focus();
  });

  // 添加到历史记录
  addToHistory(displayExpression.value);
};

// 解析表达式并生成带高亮的标记
const displayTokens = computed(() => {
  const tokens: Token[] = [];
  let current = '';
  let tempDisplay = displayExpression.value;

  // 先生成基础的词法标记
  while (tempDisplay.length > 0) {
    let matched = false;

    for (const variable of props.variables) {
      if (tempDisplay.startsWith(variable.name)) {
        if (current) {
          tokens.push({ type: 'text', text: current });
          current = '';
        }
        tokens.push({ type: 'variable', text: variable.name });
        tempDisplay = tempDisplay.slice(variable.name.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      if ('+-*/'.includes(tempDisplay[0])) {
        if (current) {
          tokens.push({ type: 'text', text: current });
          current = '';
        }
        tokens.push({ type: 'operator', text: tempDisplay[0] });
        tempDisplay = tempDisplay.slice(1);
      } else if (tempDisplay[0] === '(' || tempDisplay[0] === ')') {
        if (current) {
          tokens.push({ type: 'text', text: current });
          current = '';
        }
        tokens.push({
          type: 'bracket',
          text: tempDisplay[0],
          bracketStatus: 'unmatched'  // 初始状态为未匹配
        });
        tempDisplay = tempDisplay.slice(1);
      } else {
        current += tempDisplay[0];
        tempDisplay = tempDisplay.slice(1);
      }
    }
  }

  if (current) {
    tokens.push({ type: 'text', text: current });
  }

  // 处理括号匹配
  const bracketStack: number[] = [];
  const matchedPairs: [number, number][] = [];

  // 找出所有匹配的括号对
  tokens.forEach((token, index) => {
    if (token.type === 'bracket') {
      if (token.text === '(') {
        bracketStack.push(index);
      } else if (token.text === ')' && bracketStack.length > 0) {
        const openIndex = bracketStack.pop()!;
        matchedPairs.push([openIndex, index]);
      }
    }
  });

  // 修改这部分逻辑，直接使用 matchedPairs 的索引
  matchedPairs.forEach(([openIndex, closeIndex], pairIndex) => {
    tokens[openIndex].bracketStatus = 'matched';
    tokens[closeIndex].bracketStatus = 'matched';
    // 直接使用 pairIndex 作为括号对的索引
    tokens[openIndex].bracketIndex = pairIndex;
    tokens[closeIndex].bracketIndex = pairIndex;
  });

  return tokens;
});

// 修改括号颜色计算函数，使用更柔和的色调
const getBracketColor = (status: string | undefined, index: number | undefined) => {
  if (status === 'unmatched') {
    return 'var(--el-text-color-secondary)'; // 保持未匹配的灰色
  }
  if (status === 'matched' && bracketColorEnabled.value) {
    // 使用更柔和的颜色组合
    const colors = [
      '#409EFF',                            // Element Plus 主题蓝色
      '#67C23A',                            // Element Plus 成功绿色
      '#E6A23C',                            // Element Plus 警告橙色
      '#8E44AD',                            // 柔和紫色
      '#16A085'                             // 柔和青色
    ].map(color => {
      // 通过透明度让颜色更柔和
      return color + 'CC'; // CC 表示约 80% 的不透明度
    });
    return colors[index! % colors.length];
  }
  return 'var(--el-text-color-regular)';
};

// 历史记录相关状态

// 添加到历史记录
const addToHistory = (value: string) => {
  // 如果当前不是在历史记录的末尾，删除当前位置之后的记录
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  // 添加新的记录
  history.value.push(value);
  historyIndex.value = history.value.length - 1;
};

// 撤销操作
const undo = () => {
  if (!canUndo.value) return;

  historyIndex.value--;
  displayExpression.value = history.value[historyIndex.value];
  expression.value = convertDisplayToReal(displayExpression.value);

  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 重做操作
const redo = () => {
  if (!canRedo.value) return;

  historyIndex.value++;
  displayExpression.value = history.value[historyIndex.value];
  expression.value = convertDisplayToReal(displayExpression.value);

  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 初始化历史记录
addToHistory('');

// 处理输入框滚动
const handleScroll = (event: Event) => {
  const input = event.target as HTMLInputElement;
  scrollLeft.value = input.scrollLeft;
};

// 修改滚动到光标位置的函数，移除未使用的 idealScrollLeft
const scrollToCursor = () => {
  const input = inputRef.value;
  const wrapper = wrapperRef.value;
  if (!input || !wrapper) return;

  const cursorPosition = input.selectionStart || 0;
  const text = displayExpression.value;

  // 创建一个临时 span 来测量光标之前的文本宽度
  const span = document.createElement('span');
  span.style.font = window.getComputedStyle(input).font;
  span.style.visibility = 'hidden';
  span.style.whiteSpace = 'pre';
  span.textContent = text.slice(0, cursorPosition);
  document.body.appendChild(span);

  // 计算总文本宽度
  const totalSpan = document.createElement('span');
  totalSpan.style.font = span.style.font;
  totalSpan.style.visibility = 'hidden';
  totalSpan.style.whiteSpace = 'pre';
  totalSpan.textContent = text;
  document.body.appendChild(totalSpan);

  const cursorOffset = span.offsetWidth;
  const totalWidth = totalSpan.offsetWidth;
  const wrapperWidth = wrapper.offsetWidth;

  // 清理临时元素
  document.body.removeChild(span);
  document.body.removeChild(totalSpan);

  // 根据光标位置调整滚动
  const cursorIdealPosition = wrapperWidth / 2;
  const currentCursorPosition = cursorOffset - input.scrollLeft;

  if (currentCursorPosition < cursorIdealPosition - 50 || currentCursorPosition > cursorIdealPosition + 50) {
    // 如果光标偏离中心太多，将其重新居中
    const newScrollLeft = Math.max(0, cursorOffset - cursorIdealPosition);
    input.scrollLeft = Math.min(newScrollLeft, input.scrollWidth - wrapperWidth);
  } else if (input.scrollLeft === 0 && totalWidth <= wrapperWidth) {
    // 如果内容较短且未滚动，保持在中间
    input.scrollLeft = 0;
  }
};

// 切换显示状态
const toggleShowExpression = () => {
  showExpression.value = !showExpression.value;
};

// 修改验证表达式的处理方法
const validateExpression = () => {
  // 如果公式为空
  if (!displayExpression.value.trim()) {
    showValidationError.value = true;
    showValidationSuccess.value = false;
    validationMessage.value = t('messages.emptyFormula');
    validationStatus.value = 'error';

    if (validationTimer) {
      clearTimeout(validationTimer);
    }
    validationTimer = window.setTimeout(() => {
      showValidationSuccess.value = false;
      showValidationError.value = false;
      validationMessage.value = defaultTipMessage.value;
      validationStatus.value = '';
    }, 3000);
    return;
  }

  try {
    // 校验公式格式是否正确
    const result = ExpressionService.validateFormulaText(expression.value, props.variables);

    if (!result) {
      showValidationError.value = true;
      showValidationSuccess.value = false;
      validationMessage.value = t('messages.validError');
      validationStatus.value = 'error';
    } else if (!isFormulaComplete.value) {
      showValidationError.value = true;
      showValidationSuccess.value = false;
      validationMessage.value = t('editor.incompleteTip');
      validationStatus.value = 'error';
    } else {
      showValidationSuccess.value = true;
      showValidationError.value = false;
      validationMessage.value = t('messages.validSuccess');
      validationStatus.value = 'success';
    }

    if (validationTimer) {
      clearTimeout(validationTimer);
    }
    validationTimer = window.setTimeout(() => {
      showValidationSuccess.value = false;
      showValidationError.value = false;
      validationMessage.value = '';
      validationStatus.value = '';
    }, 3000);

  } catch (error) {
    showValidationError.value = true;
    showValidationSuccess.value = false;
    validationMessage.value = t('messages.validError');
    validationStatus.value = 'error';
  }
};

// 组件卸载时清理定时器
onUnmounted(() => {
  if (validationTimer) {
    clearTimeout(validationTimer);
  }
});

// 切换键盘样式
const toggleKeyboardStyle = () => {
  isCircleStyle.value = !isCircleStyle.value;
};

// 修改复制公式功能，直接使用已有的复制处理逻辑
const copyFormula = () => {
  if (!displayExpression.value.trim()) {
    ElMessage({
      message: t('editor.emptyFormulaCopy'),
      type: 'warning',
      duration: 1500
    });
    return;
  }

  navigator.clipboard.writeText(expression.value).then(() => {
    ElMessage({
      message: t('editor.copySuccess'),
      type: 'success',
      duration: 1500
    });
  }).catch(() => {
    ElMessage({
      message: t('editor.copyFailed'),
      type: 'error',
      duration: 1500
    });
  });
};

// 修改粘贴事件处理函数
const handlePaste = async (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData('text');
  if (!text) {
    ElMessage({
      message: t('editor.emptyClipboard'),
      type: 'warning',
      duration: 2000
    });
    return;
  }

  // 检查是否有特殊字符
  const specialChars = text.match(/[^0-9a-zA-Z_+\-*/(). ]/g);
  if (specialChars) {
    ElMessage({
      message: `${t('editor.specialChars')}: ${specialChars.join(' ')}`,
      type: 'warning',
      duration: 3000
    });
    return;
  }

  try {
    const input = inputRef.value;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const before = displayExpression.value.slice(0, cursorPosition);
    const after = displayExpression.value.slice(cursorPosition);

    // 检查粘贴的内容是否包含变量代码，并转换为显示名称
    let displayText = text;
    let hasVariables = false;
    props.variables.forEach(v => {
      const codeRegex = new RegExp(v.code, 'g');
      if (codeRegex.test(text)) {
        hasVariables = true;
        displayText = displayText.replace(codeRegex, v.name);
      }
    });

    // 更新表达式
    displayExpression.value = before + displayText + after;
    expression.value = convertDisplayToReal(displayExpression.value);

    // 设置光标位置
    nextTick(() => {
      const newPosition = cursorPosition + displayText.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
      scrollToCursor();
    });

    // 添加到历史记录
    addToHistory(displayExpression.value);

    // 提供粘贴操作的反馈
    if (hasVariables) {
      ElMessage({
        message: t('editor.autoConvertVariables'),
        type: 'success',
        duration: 2000
      });
    } else {
      ElMessage({
        message: t('editor.pasteSuccess'),
        type: 'success',
        duration: 1500
      });
    }
  } catch (error) {
    ElMessage({
      message: t('editor.pasteFailed'),
      type: 'error',
      duration: 2000
    });
  }
};

// 监听粘贴事件
onMounted(() => {
  const input = inputRef.value;
  if (input) {
    input.addEventListener('paste', handlePaste);
    // 添加复制事件监听
    input.addEventListener('copy', handleCopy);
  }

  onUnmounted(() => {
    if (input) {
      input.removeEventListener('paste', handlePaste);
      input.removeEventListener('copy', handleCopy);
    }
  });
});

// 处理复制事件
const handleCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  if (!displayExpression.value.trim()) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) return;

  const selectedText = selection.toString();
  if (!selectedText) {
    // 如果没有选中文本，复制整个表达式
    e.clipboardData?.setData('text/plain', expression.value);
  } else {
    // 如果有选中文本，将选中部分转换为实际表达式
    const convertedText = convertDisplayToReal(selectedText);
    e.clipboardData?.setData('text/plain', convertedText);
  }

  ElMessage({
    message: t('editor.copySuccess'),
    type: 'success',
    duration: 1500
  });
};

// 初始化变量值
props.variables.forEach(v => {
  variableValues.value[v.code] = 1;
});

// 切换预览模式
const togglePreviewMode = () => {
  previewMode.value = !previewMode.value;
  if (previewMode.value) {
    calculateResult();
  }
};

// 修改计算结果函数
const calculateResult = () => {
  calculationResult.value = ExpressionCalculationService.calculateExpressionResult(
    expression.value,
    displayExpression.value,
    props.variables,
    variableValues.value,
    previewMode.value,
    isFormulaComplete.value
  );
};

// 修改 watch 监听逻辑
watch(expression, () => {
  if (previewMode.value) {
    // 使用 nextTick 延迟执行，避免同步更新导致的重复计算
    nextTick(() => {
      calculateResult();
    });
  }
});

// 添加变量提示相关的状态

// 插入选中的变量
const insertSelectedVariable = () => {
  const input = inputRef.value;
  if (!input || !showVariableSuggestions.value) return;

  const selectedVariable = variableSuggestions.value[selectedSuggestionIndex.value];
  const cursorPosition = input.selectionStart || 0;

  const { text, newPosition } = VariableService.generateVariableInsertion(
    selectedVariable,
    displayExpression.value,
    cursorPosition,
    VARIABLE_TRIGGER,
    props.variables
  );

  displayExpression.value = text;
  expression.value = convertDisplayToReal(displayExpression.value);
  showVariableSuggestions.value = false;

  nextTick(() => {
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
    scrollToCursor();
    if (previewMode.value) {
      calculateResult();
    }
  });

  selectedSuggestionIndex.value = 0;
  variableSuggestions.value = props.variables;
  addToHistory(displayExpression.value);
};

// 修改选中建议项时自动滚动到可见区域
watch(selectedSuggestionIndex, (_newIndex) => {
  nextTick(() => {
    const container = document.querySelector('.variable-suggestions-content');
    const selectedItem = container?.querySelector('.suggestion-item.selected');
    if (container && selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
});

// 修改关闭变量选择框的方法
const closeVariableSuggestions = () => {
  if (!showVariableSuggestions.value) return;

  showVariableSuggestions.value = false;

  // 删除对应的@字符及其后的搜索文本
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const text = displayExpression.value;

  // 找到光标之前最近的@符号位置
  const lastAtPosition = text.slice(0, cursorPosition).lastIndexOf('@');
  if (lastAtPosition === -1) return;

  // 删除从@到光标位置的文本
  const before = text.slice(0, lastAtPosition);
  const after = text.slice(cursorPosition);
  displayExpression.value = before + after;

  // 更新实际表达式
  expression.value = convertDisplayToReal(displayExpression.value);

  // 更新光标位置
  nextTick(() => {
    const newPosition = lastAtPosition;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  });

  // 如果在预览模式下,更新计算结果
  if (previewMode.value) {
    calculateResult();
  }
};

// 添加点击外部关闭选择框的处理
onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    calculateFontSize();
  });

  if (formulaTextRef.value) {
    resizeObserver.observe(formulaTextRef.value);
  }

  // 添加点击外部关闭选择框的事件监听
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const popover = document.querySelector('.variable-suggestions-popover');
    if (popover && !popover.contains(target) && showVariableSuggestions.value) {
      closeVariableSuggestions();
    }
  };

  document.addEventListener('click', handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    resizeObserver.disconnect();
  });
});

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value);
};

const showSettingsDialog = () => {
  settingsDialogVisible.value = true;
};

// 添加变量搜索相关的状态
const variableSearchText = ref('');
const variablesRef = ref<HTMLElement | null>(null);

// 添加过滤后的变量计算属性
const filteredVariables = computed(() => {
  return VariableService.searchVariables(variableSearchText.value, props.variables);
});

// 添加切换布局的方法
const toggleLayout = () => {
  horizontalLayout.value = !horizontalLayout.value;
  // 保存布局设置
  const currentSettings = JSON.parse(localStorage.getItem('editor-settings') || '{}');
  localStorage.setItem('editor-settings', JSON.stringify({
    ...currentSettings,
    horizontalLayout: horizontalLayout.value
  }));
};

// 修改设置相关的处理方法
const handleSettingsSave = (settings: {
  autoCompleteBrackets: boolean;
  bracketColorEnabled: boolean;
  horizontalLayout: boolean;
  language: string;
}) => {
  autoCompleteBrackets.value = settings.autoCompleteBrackets;
  bracketColorEnabled.value = settings.bracketColorEnabled;
  horizontalLayout.value = settings.horizontalLayout;
  // 添加语言设置的保存，保持布局设置不变
  if (settings.language !== props.language) {
    emit('update:language', settings.language);
  }
  // 保存所有设置，包括当前的布局设置
  localStorage.setItem('editor-settings', JSON.stringify({
    ...settings,
    horizontalLayout: horizontalLayout.value
  }));
  settingsDialogVisible.value = false;
};

// 添加取消设置的处理方法
const handleSettingsCancel = () => {
  settingsDialogVisible.value = false;
};

// 修改加载设置的逻辑
const loadSettings = () => {
  try {
    const localSettings = JSON.parse(localStorage.getItem('editor-settings') || '{}');
    const settings = {
      autoCompleteBrackets: localSettings.autoCompleteBrackets ?? false,
      bracketColorEnabled: localSettings.bracketColorEnabled ?? false,
      isDarkMode: localSettings.isDarkMode ?? false,
      horizontalLayout: localSettings.horizontalLayout ?? false
    };

    autoCompleteBrackets.value = settings.autoCompleteBrackets;
    bracketColorEnabled.value = settings.bracketColorEnabled;
    isDarkMode.value = settings.isDarkMode;
    horizontalLayout.value = settings.horizontalLayout;

    if (isDarkMode.value) {
      document.documentElement.classList.add('dark-mode');
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
};

// 在组件挂载时加载设置
onMounted(() => {
  loadSettings();
  // 移除系统主题偏好的检查，默认使用浅色主题
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
});

// popoverProps 可以删除，因为已经移到子组件中

// 新增处理变量选择的方法
const handleVariableSelect = (_variable: Variable) => {
  insertSelectedVariable();
};

// 新增处理关闭建议框的方法
const handleSuggestionsClose = () => {
  closeVariableSuggestions();
};

// 添加外部调用接口
defineExpose({
  validateExpression,
  clearAll,
  focusInput,
  getExpression: () => expression.value,
  getDisplayExpression: () => displayExpression.value,
  // 设置表达式
  setExpression(value: string) {
    expression.value = value;
    displayExpression.value = convertRealToDisplay(value);
  },

  // 获取验证状态
  getValidationStatus: () => ({
    status: validationStatus.value,
    message: validationMessage.value
  }),

  // 重置编辑器
  reset() {
    clearAll();
    history.value = [''];
    historyIndex.value = 0;
  },

  // 插入内容到光标位置
  insertAtCursor(text: string) {
    const input = inputRef.value;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const before = displayExpression.value.slice(0, cursorPosition);
    const after = displayExpression.value.slice(cursorPosition);

    displayExpression.value = before + text + after;
    expression.value = convertDisplayToReal(displayExpression.value);

    nextTick(() => {
      const newPosition = cursorPosition + text.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  }
});

// 自动获取焦点
onMounted(() => {
  if (props.autofocus) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// 定义emit事件
const emit = defineEmits<{
  // v-model 更新事件
  (e: 'update:modelValue', value: string): void;
  // 验证状态变化事件
  (e: 'validation-change', valid: boolean, message: string): void;
  // 表达式变化事件
  (e: 'change', value: string, displayValue: string): void;
  // 输入事件
  (e: 'input', value: string): void;
  // 聚焦事件
  (e: 'focus'): void;
  // 失焦事件
  (e: 'blur'): void;
  // 清空事件
  (e: 'clear'): void;
  // 语言更新事件
  (e: 'update:language', value: string): void;
}>();

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== expression.value) {
    expression.value = newValue;
    displayExpression.value = convertRealToDisplay(newValue);
  }
});

// 修改表达式变化的处理
watch(expression, (newValue) => {
  emit('update:modelValue', newValue);
  emit('change', newValue, displayExpression.value);
});

// 添加聚焦和失焦处理
const handleFocus = () => {
  emit('focus');
};

const handleBlur = () => {
  emit('blur');
};

// 添加条件弹窗相关的状态
const conditionalDialogVisible = ref(false);

// 显示条件弹窗
const showConditionalDialog = () => {
  conditionalDialogVisible.value = true;
};

// 处理条件表达式确认
const handleConditionalConfirm = (expr: string) => {
  try {
    // 将表达式插入到当前光标位置
    const input = inputRef.value;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const before = displayExpression.value.slice(0, cursorPosition);
    const after = displayExpression.value.slice(cursorPosition);

    // 将表达式中的变量代码转换为显示名称
    let displayExpr = expr;
    props.variables.forEach(v => {
      displayExpr = displayExpr.replace(new RegExp(`\\b${v.code}\\b`, 'g'), v.name);
    });

    // 更新表达式
    displayExpression.value = before + displayExpr + after;
    // 转换并保存实际表达式（使用变量代码）
    expression.value = convertDisplayToReal(displayExpr);

    // 更新光标位置到表达式插入后的位置
    nextTick(() => {
      const newPosition = cursorPosition + displayExpr.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
      scrollToCursor();
    });

    // 关闭弹窗
    conditionalDialogVisible.value = false;

    // 添加到历史记录
    addToHistory(displayExpression.value);
  } catch (error) {
    console.error('Error handling conditional expression:', error);
    ElMessage.error('处理条件表达式时发生错误');
  }
};

// 处理条件表达式取消
const handleConditionalCancel = () => {
  conditionalDialogVisible.value = false;
};

// 监听表达式变化
watch([displayExpression], () => {
  nextTick(() => {
    scrollToCursor();
    calculateFontSize();
  });
});

// 在组件挂载时初始化居中显示
onMounted(() => {
  nextTick(() => {
    scrollToCursor();
    calculateFontSize();
  });
});
</script>

<style lang="scss">
@use './styles/variables' as v;
@use './styles/base';
@use './styles/buttons';
@use './styles/layout';
@use './styles/theme';
@use './styles/input';
</style>
