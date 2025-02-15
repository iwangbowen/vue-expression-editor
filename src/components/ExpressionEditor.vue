<template>
  <div class="formula-editor">
    <div class="formula-input-container">
      <div class="formula-text" ref="formulaTextRef">
        <div class="input-wrapper" ref="wrapperRef">
          <input ref="inputRef" v-model="displayExpression" @input="handleDisplayInput" @keydown="handleKeydown"
            :placeholder="'请输入公式'" class="formula-input" :style="{ fontSize: `${fontSize}px` }" @scroll="handleScroll"
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
        <button class="clear-button" @click="clearAll" title="清空">清空</button>
      </div>
      <div class="input-tip">
        提示：输入 @ 可快速选择变量，支持键盘上下键选择，回车键确认
      </div>
    </div>
    <div class="formula-info" v-if="showToolbar">
      <div class="left-actions">
        <el-button class="condition-button" @click="showConditionalDialog">
          <el-icon>
            <CirclePlus />
          </el-icon>
          IF
        </el-button>
        <button v-if="showValidate" class="validate-button" @click="validateExpression"
          :class="{ success: validationStatus === 'success', error: validationStatus === 'error' }" title="校验公式">
          <el-icon>
            <Check />
          </el-icon>
        </button>
        <button v-if="showInfo" class="info-button" @click="toggleShowExpression" :class="{ active: showExpression }"
          title="查看实际公式">
          <el-icon>
            <InfoFilled />
          </el-icon>
        </button>
        <div v-if="showExpression" class="actual-expression">
          实际公式：<code>{{ expression }}</code>
        </div>
      </div>
      <div class="right-actions">
        <button class="layout-toggle" @click="toggleLayout" :title="horizontalLayout ? '切换为上下布局' : '切换为左右布局'">
          <el-icon>
            <component :is="CaretBottom" :class="['layout-icon', { 'rotate-90': horizontalLayout }]" />
          </el-icon>
        </button>
        <button v-if="showTheme" class="theme-toggle" @click="toggleTheme" :class="{ active: isDarkMode }" title="切换主题">
          <el-icon>
            <Moon v-if="isDarkMode" />
            <Sunny v-else />
          </el-icon>
        </button>
        <button v-if="showSettings" class="settings-button" @click="showSettingsDialog" title="设置">
          <el-icon>
            <Setting />
          </el-icon>
        </button>
        <button v-if="showPreview" class="preview-button" @click="togglePreviewMode" :class="{ active: previewMode }"
          title="实时预览">
          <el-icon>
            <View />
          </el-icon>
        </button>
        <button v-if="showCopy" class="copy-button" @click="copyFormula" title="复制显示公式">
          <el-icon>
            <CopyDocument />
          </el-icon>
        </button>
        <button v-if="showStyleToggle" class="style-toggle" @click="toggleKeyboardStyle"
          :class="{ active: isCircleStyle }" title="切换键盘样式">
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
      <Calculator :can-undo="canUndo" :can-redo="canRedo" :is-circle-style="isCircleStyle" @number="addNumber"
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
        计算结果: <span class="result-value">{{ calculationResult }}</span>
      </div>
    </div>
  </div>
  <EditorSettings v-model:visible="settingsDialogVisible" :initial-settings="{
    autoCompleteBrackets,
    bracketColorEnabled,
    horizontalLayout
  }" @save="handleSettingsSave" @cancel="handleSettingsCancel" />
  <VariableSuggestions v-model:visible="showVariableSuggestions" :suggestions="variableSuggestions"
    :selectedIndex="selectedSuggestionIndex" :wrapper-ref="wrapperRef" @select="handleVariableSelect"
    @close="handleSuggestionsClose" />
  <ConditionalDialog v-model="conditionalDialogVisible" :variables="props.variables" @confirm="handleConditionalConfirm"
    @cancel="handleConditionalCancel" />
</template>

<script setup lang="ts">
import { Check, CopyDocument, InfoFilled, Moon, CirclePlus, Setting, Sunny, View, Operation, Search, CaretBottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import Calculator from './Calculator.vue';
import EditorSettings from './EditorSettings.vue';
// 删除 ValidationMessage 引入
import VariableSuggestions from './VariableSuggestions.vue';
import ConditionalDialog from './ConditionalDialog.vue';
import type { Variable } from '../types';
import { cleanupAtSymbols, checkCursorAtOperator, validateFormulaText, autoCorrectInput } from '../utils/expressionUtils';
import { ALLOWED_DIRECT_INPUT, CONTROL_KEYS, VARIABLE_TRIGGER } from '../constants/editor';
import { ExpressionService } from '../services/expressionService';
import { VariableService } from '../services/variableService';

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
  autofocus: false
});


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
  return ExpressionService.convertDisplayToReal(display, props.variables);
};

// 将实际表达式转换为显示表达式
const convertRealToDisplay = (real: string): string => {
  return ExpressionService.convertRealToDisplay(real, props.variables);
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

  // 清理多余的@符号
  const cleanedValue = cleanupAtSymbols(value);
  if (cleanedValue !== value) {
    value = cleanedValue;
    displayExpression.value = value;
    nextTick(() => {
      const lastAtPosition = value.slice(0, cursorPosition).lastIndexOf('@');
      if (lastAtPosition !== -1) {
        input.setSelectionRange(lastAtPosition + 1, lastAtPosition + 1);
      }
    });
    return;
  }

  // 如果当前字符是@，直接显示变量选择框
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
      if (variableSuggestions.value.length === 0) {
        showVariableSuggestions.value = false;
      }
      selectedSuggestionIndex.value = 0;
    } else {
      showVariableSuggestions.value = false;
    }
  }

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
const checkCursorInVariable = (text: string, cursorPos: number): { variable: Variable, start: number, end: number } | null => {
  return VariableService.checkCursorInVariable(text, cursorPos, props.variables);
};

// 修改 handleKeydown 函数，调整事件处理顺序
const handleKeydown = (event: KeyboardEvent) => {
  const input = inputRef.value;
  if (!input) return;

  // 允许原生页面刷新快捷键
  if (event.key === 'F5' || (event.ctrlKey && event.key.toLowerCase() === 'r')) {
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
    // 继续处理允许的组合键...
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
    // 处理复制快捷键
    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      // 如果有选中文本，复制选中部分的英文变量名版本
      const selectedText = displayExpression.value.slice(
        input.selectionStart || 0,
        input.selectionEnd || 0
      );
      if (selectedText) {
        const realFormula = convertDisplayToReal(selectedText);
        navigator.clipboard.writeText(realFormula).then(() => {
          ElMessage({
            message: '复制成功',
            type: 'success',
            duration: 1500
          });
        });
      }
      return;
    }
    return;
  }

  // 修改控制键的处理逻辑
  if (CONTROL_KEYS.has(event.key)) {
    const cursorPosition = input.selectionStart || 0;

    // 处理删除键
    if (event.key === 'Backspace' || event.key === 'Delete') {
      // 检查是否正在删除 @ 符号
      if (event.key === 'Backspace' && cursorPosition > 0) {
        const charBeforeCursor = displayExpression.value.charAt(cursorPosition - 1);
        if (charBeforeCursor === '@') {
          showVariableSuggestions.value = false;
        }
      }

      // 先检测是否删除操作符
      if (event.key === 'Backspace' && cursorPosition > 0) {
        const charBefore = displayExpression.value.charAt(cursorPosition - 1);
        if ('+-*/'.includes(charBefore)) {
          event.preventDefault();
          displayExpression.value =
            displayExpression.value.slice(0, cursorPosition - 1) +
            displayExpression.value.slice(cursorPosition);
          expression.value = convertDisplayToReal(displayExpression.value);
          nextTick(() => {
            input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
            input.focus();
          });
          addToHistory(displayExpression.value);
          return;
        }
      }

      // 修改变量检查位置：对于退格键，检查光标前一个位置；对于删除键，检查当前位置
      const variableAtCursor = event.key === 'Backspace'
        ? checkCursorInVariable(displayExpression.value, cursorPosition - 1)
        : checkCursorInVariable(displayExpression.value, cursorPosition);

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
      // 如果不是变量，让浏览器处理默认的删除行为
      return;
    }

    // 处理方向键
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const currentVariable = checkCursorInVariable(displayExpression.value, cursorPosition);
      const nextPosition = event.key === 'ArrowRight' ? cursorPosition + 1 : cursorPosition - 1;
      const nextVariable = checkCursorInVariable(displayExpression.value, nextPosition);

      if (currentVariable || nextVariable) {
        event.preventDefault();
        let newPos = cursorPosition;

        if (event.key === 'ArrowLeft') {
          // 左移动逻辑保持不变
          const variableAtPrevPos = checkCursorInVariable(displayExpression.value, cursorPosition - 1);

          if (currentVariable && cursorPosition > currentVariable.start) {
            newPos = currentVariable.start;
          } else if (variableAtPrevPos) {
            newPos = variableAtPrevPos.end;
          } else if (nextVariable) {
            newPos = nextVariable.start;
          } else {
            newPos = cursorPosition - 1;
          }
        } else {
          // 右移动逻辑修改为与左移动对称
          const variableAtNextPos = checkCursorInVariable(displayExpression.value, cursorPosition + 1);

          if (currentVariable && cursorPosition < currentVariable.end) {
            newPos = currentVariable.end;
          } else if (variableAtNextPos) {
            newPos = variableAtNextPos.start;
          } else if (nextVariable) {
            newPos = nextVariable.start;
          } else {
            newPos = cursorPosition + 1;
          }
        }

        // 确保光标位置在有效范围内
        newPos = Math.max(0, Math.min(newPos, displayExpression.value.length));
        nextTick(() => {
          input.setSelectionRange(newPos, newPos);
          scrollToCursor();
        });
        return;
      }
      // 如果不涉及变量，让浏览器处理默认的光标移动行为
      return;
    }

    // 其他控制键直接返回，使用默认行为
    return;
  }

  // 特殊情况处理
  // 1. 小数点: 确保一个数字中只能有一个小数点
  if (event.key === '.') {
    const cursorPosition = input.selectionStart || 0;
    const beforeCursor = displayExpression.value.slice(0, cursorPosition);
    const currentNumber = beforeCursor.split(/[-+*/()]/).pop() || '';

    if (currentNumber.includes('.')) {
      event.preventDefault();
      return;
    }

    // 确保小数点前有数字
    if (!/\d$/.test(beforeCursor)) {
      event.preventDefault();
      displayExpression.value = beforeCursor + '0' + '.' + displayExpression.value.slice(cursorPosition);
      nextTick(() => {
        input.setSelectionRange(cursorPosition + 2, cursorPosition + 2);
      });
      return;
    }
  }

  // 2. 运算符: 防止连续输入运算符
  if ('+-*/'.includes(event.key)) {
    const cursorPosition = input.selectionStart || 0;
    const beforeCursor = displayExpression.value.slice(0, cursorPosition);

    // 特殊处理负号
    if (event.key === '-') {
      // 允许在表达式开始、左括号后或运算符后使用负号
      if (!beforeCursor || beforeCursor.endsWith('(') || /[-+*/]$/.test(beforeCursor)) {
        return;
      }
    }

    // 防止运算符连用
    if (/[-+*/]$/.test(beforeCursor)) {
      event.preventDefault();
      // 替换最后一个运算符
      displayExpression.value = beforeCursor.slice(0, -1) + event.key + displayExpression.value.slice(cursorPosition);
      nextTick(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      });
      return;
    }

    // 不允许在左括号后直接使用运算符（除了负号）
    if (beforeCursor.endsWith('(') && event.key !== '-') {
      event.preventDefault();
      return;
    }
  }

  // 3. 括号: 处理括号的匹配
  if (event.key === '(' || event.key === ')') {
    const cursorPosition = input.selectionStart || 0;
    const expression = displayExpression.value;

    if (event.key === ')') {
      // 计算左括号和右括号的数量
      const leftCount = (expression.match(/\(/g) || []).length;
      const rightCount = (expression.match(/\)/g) || []).length;

      // 如果右括号数量已经等于左括号数量，阻止输入
      if (rightCount >= leftCount) {
        event.preventDefault();
        return;
      }

      // 不允许在空表达式或运算符后直接输入右括号
      const beforeCursor = expression.slice(0, cursorPosition);
      if (!beforeCursor || /[-+*/]$/.test(beforeCursor)) {
        event.preventDefault();
        return;
      }
    }
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
      selectedSuggestionIndex.value = selectedSuggestionIndex.value - 1;
      if (selectedSuggestionIndex.value < 0) {
        selectedSuggestionIndex.value = variableSuggestions.value.length - 1;
      }
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      insertSelectedVariable();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeVariableSuggestions(); // 使用统一的关闭方法
      handleAtSymbolCancel();
      return;
    }
  }

  const cursorPosition = input.selectionStart || 0;

  // 处理方向键
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    // 检查当前位置和目标位置的变量情况
    const currentVariable = checkCursorInVariable(displayExpression.value, cursorPosition);
    const nextPosition = event.key === 'ArrowRight' ? cursorPosition + 1 : cursorPosition - 1;
    const nextVariable = checkCursorInVariable(displayExpression.value, nextPosition);

    if (currentVariable || nextVariable) {
      event.preventDefault();
      let newPos = cursorPosition;

      if (event.key === 'ArrowLeft') {
        // 向左移动：如果在变量内部或右边界，移动到变量开始位置
        // 如果在变量开始位置，则正常左移
        if (currentVariable && cursorPosition > currentVariable.start) {
          newPos = currentVariable.start;
        } else if (nextVariable) {
          newPos = nextVariable.start;
        } else {
          newPos = cursorPosition - 1;
        }
      } else {
        // 向右移动：如果在变量内部或左边界，移动到变量结束位置
        // 如果在变量结束位置，则正常右移
        if (currentVariable && cursorPosition < currentVariable.end) {
          newPos = currentVariable.end;
        } else if (nextVariable) {
          newPos = nextVariable.end;
        } else {
          newPos = cursorPosition + 1;
        }
      }

      // 确保光标位置在有效范围内
      newPos = Math.max(0, Math.min(newPos, displayExpression.value.length));
      nextTick(() => {
        input.setSelectionRange(newPos, newPos);
        scrollToCursor();
      });
      return;
    }
  }

  // 处理删除键
  if (event.key === 'Backspace' || event.key === 'Delete') {
    // 检查是否正在删除 @ 符号
    const cursorPosition = input.selectionStart || 0;
    if (event.key === 'Backspace' && cursorPosition > 0) {
      const charBeforeCursor = displayExpression.value.charAt(cursorPosition - 1);
      if (charBeforeCursor === '@') {
        showVariableSuggestions.value = false;
      }

      // 修改变量检查位置：对于退格键，检查光标前一个位置
      const variableAtCursor = checkCursorInVariable(displayExpression.value, cursorPosition - 1);
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

    // 检查光标前或光标后的字符是否属于变量
    const variableAtCursor = event.key === 'Backspace'
      ? checkCursorInVariable(displayExpression.value, cursorPosition) // 退格键检查当前位置
      : checkCursorInVariable(displayExpression.value, cursorPosition + 1); // Delete键检查下一个位置

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

      // 添加到历史记录
      addToHistory(displayExpression.value);
      return;
    }

    // 如果不是变量，执行正常的删除操作
    if (event.key === 'Delete' && cursorPosition < displayExpression.value.length) {
      event.preventDefault();
      const before = displayExpression.value.slice(0, cursorPosition);
      const after = displayExpression.value.slice(cursorPosition + 1);
      displayExpression.value = before + after;
      expression.value = convertDisplayToReal(displayExpression.value);

      nextTick(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
        input.focus();
      });

      // 添加到历史记录
      addToHistory(displayExpression.value);
      return;
    }
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    return;
  }

  // 添加快捷键支持
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'c') {
      const input = event.target as HTMLInputElement;

      // 如果有选中文本，不阻止默认行为，让浏览器原生复制功能生效
      if (input.selectionStart !== input.selectionEnd) {
        // 显示复制成功提示
        ElMessage({
          message: '已复制选中内容',
          type: 'success',
          offset: 60,
          customClass: 'copy-message',
          duration: 1500
        });
        return; // 不阻止默认事件
      } else if (!displayExpression.value.trim()) {
        // 如果没有选中文本且公式为空，提示用户
        event.preventDefault();
        ElMessage({
          message: '当前公式为空，无法复制',
          type: 'warning',
          offset: 60,
          customClass: 'copy-message',
          duration: 1500
        });
      }
      return;
    }
    if (event.key === 'v') {
      // 避免干扰原生粘贴行为，使用 paste 事件处理
      return;
    }
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
  }

  // 处理 @ 键
  if (event.key === '@') {
    // 如果在预览模式下，不阻止输入
    if (previewMode.value) return;

    const cursorPosition = input.selectionStart || 0;
    const text = displayExpression.value;

    // 检查是否已经在变量选择状态
    if (showVariableSuggestions.value) {
      event.preventDefault();
      return;
    }

    // 检查光标前的字符
    const charBeforeCursor = text.charAt(cursorPosition - 1);
    // 如果前一个字符是@，阻止输入
    if (charBeforeCursor === '@') {
      event.preventDefault();
      return;
    }
  }

  // 括号自动补全
  if (autoCompleteBrackets.value && event.key === '(') {
    event.preventDefault();
    const input = inputRef.value;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const before = displayExpression.value.slice(0, cursorPosition);
    const selected = displayExpression.value.slice(cursorPosition, selectionEnd);
    const after = displayExpression.value.slice(selectionEnd);

    // 如果有选中文本，将其包含在括号中
    if (cursorPosition !== selectionEnd) {
      displayExpression.value = before + '(' + selected + ')' + after;
      nextTick(() => {
        input.setSelectionRange(selectionEnd + 2, selectionEnd + 2);
      });
    } else {
      displayExpression.value = before + '()' + after;
      nextTick(() => {
        input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      });
    }

    expression.value = convertDisplayToReal(displayExpression.value);
    addToHistory(displayExpression.value);
    return;
  }

  // 阻止不允许的字符输入
  if (!ALLOWED_DIRECT_INPUT.has(event.key)) {
    event.preventDefault();

    // 如果是字母，提示使用@符号输入变量
    if (/^[a-zA-Z]$/.test(event.key)) {
      ElMessage({
        message: '请使用 @ 符号选择变量',
        type: 'warning',
        duration: 2000
      });
    }
    return;
  }

  // 特殊情况处理：小数点
  if (event.key === '.') {
    const cursorPosition = input.selectionStart || 0;
    const beforeCursor = displayExpression.value.slice(0, cursorPosition);
    const currentNumber = beforeCursor.split(/[-+*/()]/).pop() || '';

    // 检查当前数字是否已经包含小数点
    if (currentNumber.includes('.')) {
      event.preventDefault();
      ElMessage({
        message: '数字中只能包含一个小数点',
        type: 'warning',
        duration: 2000
      });
      return;
    }

    // 确保小数点前有数字
    if (!/\d$/.test(beforeCursor)) {
      event.preventDefault();
      displayExpression.value = beforeCursor + '0.' + displayExpression.value.slice(cursorPosition);
      nextTick(() => {
        input.setSelectionRange(cursorPosition + 2, cursorPosition + 2);
      });
      return;
    }
  }
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

  // 应用自动校正
  const correctedInput = autoCorrectInput(before, num, safeVariables);
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

  // 应用自动校正，添加第三个参数
  const correctedInput = autoCorrectInput(before, operator, safeVariables);
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

  // 首先检查是否在变量内部或变量结尾
  const variableAtCursor = checkCursorInVariable(displayExpression.value, cursorPosition);
  // 检查是否在操作符位置
  const operatorAtCursor = checkCursorAtOperator(displayExpression.value, cursorPosition);

  // 如果光标在变量内部或变量结尾
  if (variableAtCursor) {
    // 检查变量前是否有操作符
    const prevOperator = checkCursorAtOperator(displayExpression.value, variableAtCursor.start);

    // 删除当前变量
    const before = displayExpression.value.slice(0, variableAtCursor.start);
    const after = displayExpression.value.slice(variableAtCursor.end);
    displayExpression.value = before + after;

    // 更新表达式和光标位置
    expression.value = convertDisplayToReal(displayExpression.value);
    nextTick(() => {
      const newPosition = variableAtCursor.start;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });

    // 如果删除后发现前面有孤立的操作符（操作符后面没有变量了），也删除该操作符
    if (prevOperator && !after.trim()) {
      const finalBefore = displayExpression.value.slice(0, prevOperator.start);
      displayExpression.value = finalBefore + after;
      expression.value = convertDisplayToReal(displayExpression.value);

      nextTick(() => {
        const newPosition = prevOperator.start;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      });
    }
  }
  // 如果光标在操作符上
  else if (operatorAtCursor) {
    const before = displayExpression.value.slice(0, operatorAtCursor.start);
    const after = displayExpression.value.slice(operatorAtCursor.end);
    displayExpression.value = before + after;
    expression.value = convertDisplayToReal(displayExpression.value);

    nextTick(() => {
      const newPosition = operatorAtCursor.start;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  }
  // 普通删除操作
  else {
    const before = displayExpression.value.slice(0, cursorPosition - 1);
    const after = displayExpression.value.slice(cursorPosition);
    displayExpression.value = before + after;
    expression.value = convertDisplayToReal(displayExpression.value);

    nextTick(() => {
      const newPosition = cursorPosition - 1;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  }

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

// 校验公式
const validateExpression = () => {
  const result = validateFormulaText(expression.value, props.variables);

  // 使用 Element Plus 的消息提示替代原有的验证消息显示
  if (result.isValid) {
    ElMessage({
      message: result.message,
      type: 'success',
      duration: 3000
    });
  } else {
    ElMessage({
      message: result.message,
      type: 'error',
      duration: 5000
    });
  }

  emit('validation-change', result.isValid, result.message);
};

// 切换键盘样式
const toggleKeyboardStyle = () => {
  isCircleStyle.value = !isCircleStyle.value;
};

// 修改复制公式功能，任何形式的复制都使用英文变量名
const copyFormula = () => {
  if (!displayExpression.value.trim()) {
    ElMessage({
      message: '公式为空，无法复制',
      type: 'warning',
      duration: 1500
    });
    return;
  }

  // 将公式中的中文变量名转换为英文名
  const realFormula = convertDisplayToReal(displayExpression.value);
  navigator.clipboard.writeText(realFormula).then(() => {
    ElMessage({
      message: '复制成功',
      type: 'success',
      duration: 1500
    });
  }).catch(() => {
    ElMessage({
      message: '复制失败',
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
      message: '剪贴板内容为空',
      type: 'warning',
      duration: 2000
    });
    return;
  }

  // 检查是否有特殊字符
  const specialChars = text.match(/[^0-9a-zA-Z_+\-*/(). ]/g);
  if (specialChars) {
    ElMessage({
      message: `粘贴的内容包含特殊字符: ${specialChars.join(' ')}，仅允许英文字母、数字和运算符`,
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
        message: '已自动转换变量代码为显示名称',
        type: 'success',
        duration: 2000
      });
    } else {
      ElMessage({
        message: '内容已粘贴',
        type: 'success',
        duration: 1500
      });
    }
  } catch (error) {
    ElMessage({
      message: '粘贴内容处理失败，请检查格式是否正确',
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
  }

  onUnmounted(() => {
    if (input) {
      input.removeEventListener('paste', handlePaste);
    }
  });
});

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
  const result = ExpressionService.calculateResult(expression.value, props.variables, variableValues.value);
  calculationResult.value = result;

  if (result === null && !calculateResult.errorShown) {
    calculateResult.errorShown = true;
    ElMessage.error('计算错误');
    setTimeout(() => {
      calculateResult.errorShown = false;
    }, 100);
  }
};

// 添加错误提示状态标记
calculateResult.errorShown = false;

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

// 处理 @ 符号取消的函数
const handleAtSymbolCancel = () => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const text = displayExpression.value;

  // 找到光标之前最近的 @ 符号位置
  const lastAtPosition = text.slice(0, cursorPosition).lastIndexOf('@');
  if (lastAtPosition === -1) return;

  // 移除这个 @ 符号
  const before = text.slice(0, lastAtPosition);
  const after = text.slice(cursorPosition);
  displayExpression.value = before + after;

  // 更新光标位置
  nextTick(() => {
    const newPosition = lastAtPosition;
    input.setSelectionRange(newPosition, newPosition);
  });
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
  const searchText = variableSearchText.value.toLowerCase();
  if (!searchText) return props.variables;

  return props.variables.filter(variable =>
    variable.name.toLowerCase().includes(searchText) ||
    variable.code.toLowerCase().includes(searchText)
  );
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
}) => {
  autoCompleteBrackets.value = settings.autoCompleteBrackets;
  bracketColorEnabled.value = settings.bracketColorEnabled;
  horizontalLayout.value = settings.horizontalLayout;
  localStorage.setItem('editor-settings', JSON.stringify(settings));
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