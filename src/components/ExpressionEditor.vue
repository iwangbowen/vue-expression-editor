<template>
  <div class="formula-editor">
    <div class="formula-display">
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
      <!-- 添加操作提示 -->
      <div class="input-tip">
        提示：输入 @ 可快速选择变量，支持键盘上下键选择，回车键确认了
      </div>
    </div>
    <div class="formula-info" v-if="showToolbar">
      <div class="left-actions">
        <!-- 添加条件表达式按钮 -->
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
        <!-- 实际公式显示框移到这里 -->
        <div v-if="showExpression" class="actual-expression">
          实际公式：<code>{{ expression }}</code>
        </div>
      </div>
      <div class="right-actions">
        <!-- 修改布局切换按钮图标 -->
        <el-button class="layout-toggle" :class="{ 'is-horizontal': horizontalLayout }"
          :title="horizontalLayout ? '切换为上下布局' : '切换为左右布局'" @click="toggleLayout">
          <el-icon>
            <component :is="CaretBottom" :class="['layout-icon', { 'rotate-90': horizontalLayout }]" />
          </el-icon>
        </el-button>
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
    <!-- 添加固定高度的校验信息容器 -->
    <ValidationMessage :message="validationMessage" :status="validationStatus" @close="clearValidation" />
    <div class="editor-content" :class="[
      { 'circle-style': isCircleStyle },
      { 'horizontal-layout': horizontalLayout }
    ]">
      <div class="variables-section">
        <!-- 添加变量搜索输入框 -->
        <div class="variables-search">
          <el-input v-model="variableSearchText" placeholder="搜索变量" clearable :prefix-icon="Search" />
        </div>
        <!-- 修改变量列表容器，添加虚拟滚动 -->
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
    <!-- 添加预览模式面板 -->
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
  <!-- 保留设置面板和变量建议组件 -->
  <EditorSettings v-model:visible="settingsDialogVisible" :initial-settings="{
    autoCompleteBrackets,
    bracketColorEnabled,
    horizontalLayout
  }" @save="handleSettingsSave" @cancel="handleSettingsCancel" />
  <VariableSuggestions v-model:visible="showVariableSuggestions" :suggestions="variableSuggestions"
    :selectedIndex="selectedSuggestionIndex" :wrapper-ref="wrapperRef" @select="handleVariableSelect"
    @close="handleSuggestionsClose" />
  <!-- 添加条件表达式弹窗 -->
  <ConditionalDialog v-model="conditionalDialogVisible" :variables="props.variables" @confirm="handleConditionalConfirm"
    @cancel="handleConditionalCancel" />
</template>

<script setup lang="ts">
import { Check, CopyDocument, InfoFilled, Moon, CirclePlus, Setting, Sunny, View, Operation, Search, CaretBottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import Calculator from './Calculator.vue';
import EditorSettings from './EditorSettings.vue';
import ValidationMessage from './ValidationMessage.vue';
import VariableSuggestions from './VariableSuggestions.vue';
import ConditionalDialog from './ConditionalDialog.vue';
import type { Variable } from '../types';

// 本地定义 Token 接口
interface Token {
  type: string;
  text: string;
  bracketStatus?: 'unmatched' | 'matched' | 'current';
  bracketIndex?: number;
}

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
  variables: () => [
    { name: '销售额', code: 'sales' },
    { name: '成本', code: 'cost' },
    { name: '利润', code: 'profit' }
  ],
  modelValue: '',
  readonly: false,
  disabled: false,
  maxLength: 1000,
  minFontSize: 18,
  maxFontSize: 24,
  autofocus: false
});


// 计算与校验相关变量
const validationStatus = ref<'success' | 'error' | null>(null);
const validationMessage = ref('');
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
const VARIABLE_TRIGGER = '@';

// 基础状态变量
const expression = ref('');
const displayExpression = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const formulaTextRef = ref<HTMLDivElement | null>(null);
const fontSize = ref(MAX_FONT_SIZE);
const isCircleStyle = ref(false);
const showExpression = ref(false);
const horizontalLayout = ref(false); // 添加horizontalLayout变量

// 允许的字符集合
const ALLOWED_CHARS = new Set([
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '+', '-', '*', '/',
  '(', ')',
  '.',
  '@'
]);

const ALLOWED_DIRECT_INPUT = new Set([
  ...Array.from(ALLOWED_CHARS),
  ' ' // 可选的空格
]);

const CONTROL_KEYS = new Set([
  'Backspace', 'Delete',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'Tab', 'Enter', 'Escape'
]);

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
  let result = display;
  props.variables.forEach(v => {
    result = result.replace(new RegExp(v.name, 'g'), v.code);
  });
  return result;
};

// 将实际表达式转换为显示表达式
const convertRealToDisplay = (real: string): string => {
  let result = real;
  props.variables.forEach(v => {
    result = result.replace(new RegExp(v.code, 'g'), v.name);
  });
  return result;
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

// 修改处理显示输入的函数
const handleDisplayInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  const cursorPosition = input.selectionStart || 0;

  // 清理多余的@符号
  const cleanedValue = cleanupAtSymbols(value);
  if (cleanedValue !== value) {
    value = cleanedValue;
    displayExpression.value = value;
    // 保持光标位置在最后一个@后
    nextTick(() => {
      const lastAtPosition = value.slice(0, cursorPosition).lastIndexOf('@');
      if (lastAtPosition !== -1) {
        input.setSelectionRange(lastAtPosition + 1, lastAtPosition + 1);
      }
    });
    return;
  }

  // 检查是否输入了 @ 符号
  const lastChar = value.charAt(cursorPosition - 1);
  if (lastChar === VARIABLE_TRIGGER) {
    // 检查是否能在当前位置插入变量
    const canInsertVariable = checkCanInsertVariable(value, cursorPosition);
    if (!canInsertVariable) {
      // 如果不能插入变量，移除@符号
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
      displayExpression.value = newValue;
      nextTick(() => {
        input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
      });
      return;
    }

    showVariableSuggestions.value = true;
    variableSuggestions.value = props.variables;
    selectedSuggestionIndex.value = 0;
  } else if (showVariableSuggestions.value) {
    // 如果用户在@后输入了其他字符，过滤变量列表
    const searchText = value.slice(value.lastIndexOf('@') + 1, cursorPosition).toLowerCase();
    if (searchText) {
      variableSuggestions.value = props.variables.filter(v =>
        v.name.toLowerCase().includes(searchText) ||
        v.code.toLowerCase().includes(searchText)
      );
      // 如果没有匹配项，关闭选择框
      if (variableSuggestions.value.length === 0) {
        showVariableSuggestions.value = false;
      } else {
        selectedSuggestionIndex.value = 0;
      }
    }
  }

  // 获取变更的字符
  const before = value.slice(0, cursorPosition - 1);
  const after = value.slice(cursorPosition);

  // 应用自动校正
  const correctedInput = autoCorrectInput(before, lastChar);
  if (correctedInput === before) {
    // 如果输入被拒绝，恢复之前的值，但保留 @ 符号
    if (lastChar === VARIABLE_TRIGGER) {
      displayExpression.value = before + VARIABLE_TRIGGER + after;
    } else {
      displayExpression.value = before + after;
    }
  } else {
    displayExpression.value = correctedInput + after;
  }

  expression.value = convertDisplayToReal(displayExpression.value);

  // 设置光标位置
  nextTick(() => {
    const newPosition = lastChar === VARIABLE_TRIGGER ?
      cursorPosition :
      correctedInput.length;
    input.setSelectionRange(newPosition, newPosition);
    calculateFontSize();
    scrollToCursor();
  });

  // 添加到历史记录
  addToHistory(displayExpression.value);

  // 更新计算结果时需要考虑是否正在选择变量
  if (previewMode.value && !showVariableSuggestions.value) {
    calculateResult();
  }

  emit('input', expression.value);
};

// 监听实际表达式变化，更新显示表达式
watch(expression, (newValue) => {
  displayExpression.value = convertRealToDisplay(newValue);
});

const addVariable = (variable: Variable) => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const before = displayExpression.value.slice(0, cursorPosition);
  const after = displayExpression.value.slice(cursorPosition);

  // 检查是否需要添加乘号
  let insertion = variable.name;
  if (before && (
    /[\d)]$/.test(before) ||
    props.variables.some(v => before.endsWith(v.name))
  )) {
    insertion = '*' + insertion;
  }

  // 检查后面的内容是否需要添加乘号
  if (after && (
    /^[\d(]/.test(after) ||
    props.variables.some(v => after.startsWith(v.name))
  )) {
    insertion = insertion + '*';
  }

  displayExpression.value = before + insertion + after;
  expression.value = convertDisplayToReal(displayExpression.value);

  // 设置光标位置到变量名后
  nextTick(() => {
    const newPosition = cursorPosition + insertion.length;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  });

  // 添加到历史记录
  addToHistory(displayExpression.value);
};

const focusInput = () => {
  inputRef.value?.focus();
};

// 修改检查光标位置的函数
const checkCursorInVariable = (text: string, cursorPos: number): { variable: Variable, start: number, end: number } | null => {
  // 获取所有变量的位置信息
  const allVariables: Array<{ variable: Variable, start: number, end: number }> = [];

  for (const variable of props.variables) {
    let searchStartIndex = 0;
    while (true) {
      const startPos = text.indexOf(variable.name, searchStartIndex);
      if (startPos === -1) break;

      allVariables.push({
        variable,
        start: startPos,
        end: startPos + variable.name.length
      });
      searchStartIndex = startPos + 1;
    }
  }

  // 按照起始位置排序
  allVariables.sort((a, b) => a.start - b.start);

  // 找到光标所在的变量或最近的变量
  let foundVariable: { variable: Variable, start: number, end: number } | null = null;
  for (const varInfo of allVariables) {
    // 光标在变量内部或刚好在变量的开始/结束位置
    if (cursorPos >= varInfo.start && cursorPos <= varInfo.end) {
      foundVariable = varInfo;
      break;
    }
  }

  return foundVariable || null;
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

// 新增输入规则检查和自动校正函数
const autoCorrectInput = (before: string, current: string): string => {
  // 允许输入 @ 符号
  if (current === VARIABLE_TRIGGER) {
    return before + current;
  }

  // 处理开头的特殊情况
  if (!before) {
    // 不允许以运算符开头，除了负号和左括号
    if ('+-*/'.includes(current) && current !== '-') return '';
    if (current === '.') return '0.';
    if (current === ')') return ''; // 不允许以右括号开头
    return current;
  }

  const lastChar = before.slice(-1);

  // 特殊处理：如果上一个字符是'-'且当前输入是数字，则保留'-'并输入数字
  if (lastChar === '-' && /\d/.test(current)) {
    return before + current;
  }

  // 处理运算符
  if ('+-*/'.includes(current)) {
    // 如果前面没有内容，且不是负号，拒绝输入
    if (!before && current !== '-') {
      return before;
    }

    // 处理减号的特殊情况
    if (current === '-') {
      // 1. 作为负号：允许在表达式开头、左括号后、运算符后使用
      if (!before || before.endsWith('(') || '+-*/'.includes(before.slice(-1))) {
        return before + current;
      }
      // 2. 作为减号：允许在数字、变量名、右括号后使用
      if (/[\d)]/.test(before) || props.variables.some(v => before.endsWith(v.name))) {
        return before + current;
      }
      return before; // 其他情况拒绝输入
    }

    // 其他运算符的处理逻辑
    // 如果是负号，需要特殊处理
    if (current === '-') {
      // 允许在表达式开始、左括号后、运算符后的负号
      if (!before || before.endsWith('(') || '+-*/'.includes(before.slice(-1))) {
        return before + current;
      }
    }

    // 如果前一个字符是运算符，根据情况处理
    if ('+-*/'.includes(lastChar)) {
      // 如果前一个是乘号或除号，且当前是减号，允许输入（支持类似 3*-2 的形式）
      if ((lastChar === '*' || lastChar === '/') && current === '-') {
        return before + current;
      }
      // 其他情况替换前一个运算符
      return before.slice(0, -1) + current;
    }

    // 不允许在左括号后直接使用运算符，除了负号
    if (lastChar === '(' && current !== '-') {
      return before;
    }
  }

  // 处理数字
  if (/\d/.test(current)) {
    // 如果前一个是负号，需要检查负号的合法性
    if (lastChar === '-') {
      const beforeMinus = before.slice(0, -1);
      const lastCharBeforeMinus = beforeMinus.slice(-1);
      // 只有在表达式开头、左括号后、运算符后的负号才是合法的
      if (beforeMinus && !['(', '*', '/', '+', '-'].includes(lastCharBeforeMinus)) {
        return before.slice(0, -1) + current;
      }
    }

    // 避免数字前导零
    if (lastChar === '0' && !before.slice(0, -1).endsWith('.')) {
      const beforeLastChar = before.slice(-2, -1);
      // 检查0是否是一个独立的数字的开始
      if (!beforeLastChar || '+-*/('.includes(beforeLastChar)) {
        return before.slice(0, -1) + current;
      }
    }
  }

  // 检查是否需要在变量之间添加乘号
  // 1. 检查当前输入是否是变量的开始
  const potentialVariable = props.variables.find(v => v.name.startsWith(current));
  if (potentialVariable) {
    // 检查前面是否是变量的结束
    for (const variable of props.variables) {
      if (before.endsWith(variable.name)) {
        return before + '*' + current;
      }
    }
  }

  // 当输入变量时（通过变量选择器或粘贴），检查前后文是否需要添加乘号
  if (props.variables.some(v => current === v.name)) {
    // 检查前面的内容
    if (before) {
      // 如果前面是变量、数字或右括号，添加乘号
      if (/[\d)]/.test(before) || props.variables.some(v => before.endsWith(v.name))) {
        return before + '*' + current;
      }
    }
  }

  // 其他校正逻辑保持不变
  return before + current;
};

// 修改添加数字的函数
const addNumber = (num: string) => {
  const input = inputRef.value;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const before = displayExpression.value.slice(0, cursorPosition);
  const after = displayExpression.value.slice(cursorPosition);

  // 应用自动校正
  const correctedInput = autoCorrectInput(before, num);
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

  // 应用自动校正
  const correctedInput = autoCorrectInput(before, operator);
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

// 首先添加一个检查光标位置是否在操作符上的函数
const checkCursorAtOperator = (text: string, cursorPos: number): { operator: string, start: number, end: number } | null => {
  if (cursorPos <= 0 || cursorPos > text.length) return null;

  // 检查光标前一个字符是否是操作符
  const beforeChar = text.charAt(cursorPos - 1);
  if ('+-*/'.includes(beforeChar)) {
    return {
      operator: beforeChar,
      start: cursorPos - 1,
      end: cursorPos
    };
  }
  return null;
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

// 调整光标位置时自动滚动到可见区域
const scrollToCursor = () => {
  const input = inputRef.value;
  const wrapper = wrapperRef.value;
  if (!input || !wrapper) return;

  const cursorPosition = input.selectionStart || 0;

  // 创建一个临时 span 来测量光标位置
  const span = document.createElement('span');
  span.style.font = window.getComputedStyle(input).font;
  span.style.visibility = 'hidden';
  span.textContent = displayExpression.value.slice(0, cursorPosition);
  document.body.appendChild(span);

  const cursorOffset = span.offsetWidth;
  document.body.removeChild(span);

  const scrollPosition = input.scrollLeft;
  const wrapperWidth = wrapper.offsetWidth;

  // 确保光标可见
  if (cursorOffset < scrollPosition) {
    // 光标在可视区域左侧
    input.scrollLeft = Math.max(0, cursorOffset - 50);
  } else if (cursorOffset > scrollPosition + wrapperWidth - 20) {
    // 光标在可视区域右侧
    input.scrollLeft = cursorOffset - wrapperWidth + 50;
  }
};

// 切换显示状态
const toggleShowExpression = () => {
  showExpression.value = !showExpression.value;
};

// 校验公式
const validateExpression = () => {
  if (!expression.value.trim()) {
    validationStatus.value = 'error';
    validationMessage.value = '公式不能为空';
    emit('validation-change', false, validationMessage.value);
    return;
  }

  try {
    // 简单的语法检查
    const hasInvalidChars = /[^0-9a-zA-Z_+\-*/(). ]/g.test(expression.value);
    if (hasInvalidChars) {
      throw new Error('公式包含无效字符');
    }

    // 检查括号匹配
    const brackets = expression.value.replace(/[^()]/g, '');
    let count = 0;
    for (const char of brackets) {
      if (char === '(') count++;
      if (char === ')') count--;
      if (count < 0) throw new Error('括号不匹配');
    }
    if (count !== 0) throw new Error('括号不匹配');

    // 检查运算符
    if (/[+\-*/]{2,}/.test(expression.value)) {
      throw new Error('运算符使用不正确');
    }

    // 检查变量是否存在
    const vars = expression.value.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    for (const v of vars) {
      if (!props.variables.some(variable => variable.code === v)) {
        throw new Error(`未知变量: ${v}`);
      }
    }

    // 检查小数点使用是否正确
    const numbers = expression.value.split(/[+\-*/()]/);
    for (const num of numbers) {
      if (num.trim() && (num.match(/\./g) || []).length > 1) {
        throw new Error('小数点使用不正确');
      }
    }

    validationStatus.value = 'success';
    validationMessage.value = '公式格式正确';
    emit('validation-change', true, validationMessage.value);

    // 3秒后清除成功提示
    setTimeout(() => {
      if (validationStatus.value === 'success') {
        validationStatus.value = null;
        validationMessage.value = '';
      }
    }, 3000);

  } catch (error) {
    validationStatus.value = 'error';
    validationMessage.value = (error as Error).message;
    emit('validation-change', false, validationMessage.value);
  }
};

// 清除校验结果
const clearValidation = () => {
  validationStatus.value = null;
  validationMessage.value = '';
};

// 切换键盘样式
const toggleKeyboardStyle = () => {
  isCircleStyle.value = !isCircleStyle.value;
};

// 修改复制公式功能，将所有变量转换为英文名后再复制
const copyFormula = () => {
  if (!displayExpression.value.trim()) {
    ElMessage({
      message: '当前公式为空，无法复制',
      type: 'warning',
      offset: 60,
      customClass: 'copy-message',
      duration: 1500
    });
    return;
  }

  // 将公式中的中文变量名转换为英文名
  const realFormula = convertDisplayToReal(displayExpression.value);
  navigator.clipboard.writeText(realFormula).then(() => {
    ElMessage({
      message: '已复制完整公式',
      type: 'success',
      offset: 60,
      customClass: 'copy-message',
      duration: 1500
    });
  }).catch(() => {
    ElMessage({
      message: '复制失败，请重试',
      type: 'error',
      offset: 60,
      customClass: 'copy-message',
      duration: 1500
    });
  });
};

// 修改粘贴事件处理函数
const handlePaste = async (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData('text');
  if (!text) return;

  // 检查粘贴的内容是否只包含允许的字符
  const hasInvalidChars = [...text].some(char => !ALLOWED_DIRECT_INPUT.has(char));
  if (hasInvalidChars) {
    ElMessage({
      message: '粘贴的内容包含不允许的字符',
      type: 'warning',
      duration: 2000
    });
    return;
  }

  try {
    // 预校验粘贴的内容
    const validationResult = validateFormulaText(text);
    if (!validationResult.isValid) {
      ElMessage.error(`粘贴的公式"${text}"，${validationResult.message}`);
      return;
    }

    // 转换变量名
    let displayText = text;
    props.variables.forEach(v => {
      displayText = displayText.replace(new RegExp(v.code, 'g'), v.name);
    });

    const input = inputRef.value;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const before = displayExpression.value.slice(0, cursorPosition);
    const after = displayExpression.value.slice(cursorPosition);

    displayExpression.value = before + displayText + after;
    expression.value = convertDisplayToReal(displayExpression.value);

    // 设置光标位置
    nextTick(() => {
      const newPosition = cursorPosition + displayText.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });

    // 添加到历史记录
    addToHistory(displayExpression.value);
  } catch (error) {
    ElMessage.error('粘贴内容处理失败');
  }
};

// 添加公式文本预校验函数
const validateFormulaText = (text: string): { isValid: boolean; message: string } => {
  if (!text.trim()) {
    return { isValid: false, message: '公式不能为空' };
  }

  // 检查无效字符
  if (/[^0-9a-zA-Z_+\-*/(). ]/g.test(text)) {
    return { isValid: false, message: '公式包含无效字符' };
  }

  // 检查括号匹配
  const brackets = text.replace(/[^()]/g, '');
  let count = 0;
  for (const char of brackets) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return { isValid: false, message: '括号不匹配' };
  }
  if (count !== 0) return { isValid: false, message: '括号不匹配' };

  // 检查运算符
  if (/[+\-*/]{2,}/.test(text)) {
    return { isValid: false, message: '运算符使用不正确' };
  }

  // 检查变量是否存在
  const vars = text.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  for (const v of vars) {
    if (!props.variables.some(variable => variable.code === v)) {
      return { isValid: false, message: `未知变量: ${v}` };
    }
  }

  // 检查小数点
  const numbers = text.split(/[+\-*/()]/);
  for (const num of numbers) {
    if (num.trim() && (num.match(/\./g) || []).length > 1) {
      return { isValid: false, message: '小数点使用不正确' };
    }
  }

  return { isValid: true, message: '' };
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
  if (!expression.value.trim() || expression.value.includes('@')) {
    calculationResult.value = null;
    return;
  }

  if (/[+\-*/]$/.test(expression.value) || /\($/.test(expression.value)) {
    calculationResult.value = null;
    return;
  }

  try {
    let formula = expression.value;
    // 预检查除数为零的情况
    const hasZeroDivision = /\/\s*0(?!\d)/.test(formula);
    if (hasZeroDivision) {
      throw new Error('除数不能为零');
    }

    props.variables.forEach(v => {
      const value = variableValues.value[v.code];
      formula = formula.replace(new RegExp(v.code, 'g'), value.toString());
    });

    const calculate = new Function(`return ${formula}`);
    const result = calculate();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('计算结果无效');
    }

    calculationResult.value = parseFloat(result.toFixed(2));
  } catch (error) {
    calculationResult.value = null;
    const errorMessage = error instanceof Error ? error.message : '计算错误';
    // 添加防抖处理，避免短时间内重复提示
    if (!calculateResult.errorShown) {
      calculateResult.errorShown = true;
      ElMessage.error(errorMessage);
      setTimeout(() => {
        calculateResult.errorShown = false;
      }, 100);
    }
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

  // 找到 @ 符号的位置
  const triggerCharPosition = displayExpression.value.slice(0, cursorPosition).lastIndexOf(VARIABLE_TRIGGER);
  if (triggerCharPosition === -1) return;

  // 移除 @ 及其后可能输入的字符
  const before = displayExpression.value.slice(0, triggerCharPosition);
  const after = displayExpression.value.slice(cursorPosition);

  let insertion = selectedVariable.name;

  // 检查是否需要添加乘号
  if (before && (
    /[\d)]/.test(before) ||
    props.variables.some(v => before.endsWith(v.name))
  )) {
    insertion = '*' + insertion;
  }

  // 检查后面的内容是否需要添加乘号
  if (after && (
    /^[\d(]/.test(after) ||
    props.variables.some(v => after.startsWith(v.name))
  )) {
    insertion = insertion + '*';
  }

  // 更新表达式并关闭选择框
  displayExpression.value = before + insertion + after;
  expression.value = convertDisplayToReal(displayExpression.value);
  showVariableSuggestions.value = false; // 确保关闭选择框

  // 设置光标位置到变量名后
  nextTick(() => {
    const newPosition = before.length + insertion.length;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
    scrollToCursor();

    // 更新计算结果
    if (previewMode.value) {
      calculateResult();
    }
  });

  // 重置建议状态和添加历史记录
  selectedSuggestionIndex.value = 0;
  variableSuggestions.value = props.variables;
  addToHistory(displayExpression.value);
};

// 添加新的辅助函数，用于检查和清理多余的@符号
const cleanupAtSymbols = (text: string): string => {
  // 如果存在连续的@，只保留最后一个
  return text.replace(/@+/g, '@');
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

// 添加新的辅助函数，检查是否可以在当前位置插入变量
const checkCanInsertVariable = (text: string, position: number): boolean => {
  // 如果是在开始位置，允许插入
  if (position === 0) return true;

  const charBefore = text.charAt(position - 2); // 位置-2是因为position-1是@符号

  // 检查前一个字符是否是运算符或左括号
  if (!charBefore || '+-*/('.includes(charBefore)) return true;

  // 检查是否在变量、数字或右括号后面，这种情况需要自动插入乘号
  if (/[\d)]/.test(charBefore) || props.variables.some(v => text.slice(0, position - 1).endsWith(v.name))) {
    return true;
  }

  return false;
};

// 修改选中建议项时自动滚动到可见区域
watch(selectedSuggestionIndex, (newIndex) => {
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
const handleVariableSelect = (variable: Variable) => {
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
</script>

<style lang="scss" scoped>
// 基础变量定义 - 这些值在多处重复使用,可以安全替换
$font-base: 1.5rem;
$font-lg: 1.2rem;
$font-sm: 14px;

$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 24px;

$button-size-sm: 32px;
$button-size-md: 40px;
$button-size-lg: 60px;

$radius-sm: 4px;
$radius-circle: 50%;

$transition-base: 0.2s;

// Mixins - 提取重复的样式模式
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin round-button {
  width: $button-size-sm;
  height: $button-size-sm;
  min-width: unset;
  padding: 0;
  border-radius: $radius-circle;
  border: none;
  @include flex-center;
  cursor: pointer;
  transition: all $transition-base;
  flex-shrink: 0;
}

// 原有样式中安全的改写部分
.formula-editor {
  display: flex;
  flex-direction: column;
  align-items: center;

  .formula-display {
    width: 100%;
    margin-bottom: $spacing-lg;
    text-align: center;

    input {
      width: 100%;
      padding: $spacing-md;
      font-size: $font-base;
      text-align: center;
      cursor: text;
      caret-color: var(--el-color-primary);
      outline: none;
      border: 2px solid var(--el-border-color);
      border-radius: $radius-sm;
      transition: border-color $transition-base;

      &:focus {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
      }
    }
  }
}

// 工具栏按钮基础样式
%tool-button {
  @include round-button;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);

  &.active {
    background-color: var(--el-color-primary);
    color: white;
  }
}

// 应用工具栏按钮样式
.info-button,
.validate-button,
.preview-button,
.copy-button,
.theme-toggle,
.settings-button,
.style-toggle {
  @extend %tool-button;
}

.formula-info {
  position: relative;
  width: 100%;
  max-width: none;
  height: $button-size-sm;
  margin: $spacing-sm 0 $spacing-lg;
  padding: 0 $spacing-sm;
  @include flex-center;
  justify-content: space-between;

  .left-actions,
  .right-actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
    flex: none;
  }
}

// 变量按钮样式
.variables {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding-right: $spacing-lg;

  button {
    min-width: 80px;
    width: auto;
    height: $button-size-md;
    padding: 0 $spacing-lg;
    font-size: $font-sm;
    color: var(--el-text-color-regular);
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 20px;
    transition: all $transition-base;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
      background-color: var(--el-color-primary-light-9);
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// 其余样式保持不变...
/* 居中对齐 */

.editor-content {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin: 12px auto;
  gap: 12px;
  flex-direction: column;
  align-items: center;

  &.horizontal-layout {
    flex-direction: row;
    justify-content: center;
    margin: 12px auto; /* 确保水平布局时也居中 */
    width: fit-content; /* 让容器宽度适应内容 */
    max-width: 800px; /* 保持最大宽度限制 */

    .variables-section {
      width: 240px;
      margin: 0; /* 移除原有的 margin-right */
    }
  }
}

/* 添加变量区域容器样式 */
.variables-section {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  margin: 0 auto; /* 确保垂直布局时居中 */
}

/* 添加 Calculator 组件的样式 */
:deep(.calculator) {
  margin: 0 auto; /* 确保计算器组件居中 */
}

/* 变量搜索框样式 */
.variables-search {
  padding: 0 12px;

  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 20px;
      /* 搜索框使用较大的圆角 */
      background-color: var(--el-fill-color-light);
      box-shadow: none;
      border: 1px solid var(--el-border-color-light);

      &:hover,
      &:focus {
        border-color: var(--el-color-primary);
      }

      .el-input__inner {
        height: 36px;
      }
    }
  }
}

/* 修改变量列表容器样式 */
.variables {
  flex: 1;
  overflow: hidden;
  padding-right: 12px;

  :deep(.el-scrollbar) {
    height: 100%;
  }

  :deep(.el-scrollbar__wrap) {
    padding: 0 12px;
  }

  button {
    width: 100%;
    height: 32px;
    /* 减小按钮高度 */
    margin-bottom: 8px;
    text-align: left;
    padding: 0 16px;
    border-radius: 4px;
    /* 变量按钮使用小圆角 */
    font-size: 14px;
    transition: all 0.2s ease;
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-regular);

    &:hover {
      background-color: var(--el-fill-color-light);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }

    &:active {
      background-color: var(--el-color-primary-light-9);
    }
  }
}

/* 暗色模式适配 */
:root.dark-mode {
  --editor-bg: #ffffff;
  --editor-text: #303133;
  --editor-border: #dcdfe6;
  --editor-shadow: rgba(0, 0, 0, 0.1);
  --editor-hover: #f5f5f5;
  --editor-active: #e6e6e6;

  .variables-search {
    :deep(.el-input__wrapper) {
      background-color: var(--editor-hover);
    }
  }
}

/* 修改变量按钮容器样式 */

/* 修改变量按钮样式 */

button {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #f5f5f5;
}

button:active {
  background-color: #e0e0e0;
}

.formula-text {
  position: relative;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  /* 添加垂直居中 */
  gap: 8px;
}

.input-wrapper {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: hidden;
  /* 控制滚动 */
}

.formula-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0 12px;
  /* 修改内边距 */
  font-size: 1.5rem;
  /* 这个会被动态计算的fontSize覆盖 */
  text-align: left;
  /* 取消居中 */
  border: 2px solid var(--el-border-color);
  border-radius: 4px;
  background: transparent;
  color: transparent;
  /* 修改为transparent使文本透明 */
  font-family: monospace;
  /* 改为等宽字体 */
  z-index: 2;
  /* 确保输入框在上层 */
  transition: font-size 0.2s ease;
  /* 添加字体大小过渡效果 */
  overflow-x: auto;
  /* 允许水平滚动 */
  white-space: pre;
  /* 保持空格和格式 */
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary) transparent;
}

/* 自定义 Webkit 滚动条样式 */
.formula-input::-webkit-scrollbar {
  height: 6px;
}

.formula-input::-webkit-scrollbar-track {
  background: transparent;
}

.formula-input::-webkit-scrollbar-thumb {
  background-color: var(--el-color-primary);
  border-radius: 3px;
}

.formula-input::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-color-primary-dark-2);
}

.formula-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-8);
}

.highlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: fit-content;
  /* 允许内容超出 */
  min-width: 100%;
  /* 至少和容器一样宽 */
  height: 100%;
  padding: 0 12px;
  /* 修改内边距 */
  font-size: 1.5rem;
  /* 这个会被动态计算的fontSize覆盖 */
  text-align: left;
  /* 取消居中 */
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  /* 确保高亮层在输入框下方 */
  user-select: none;
  /* 防止文本被选中影响光标显示 */
  font-family: monospace;
  /* 改为等宽字体 */
  transition: font-size 0.2s ease;
  /* 添加字体大小过渡效果 */
  white-space: pre;
  /* 改为 pre 以保持空格和格式 */
  overflow: visible;
  /* 允许显示完整内容，避免内容被隐藏 */
}

/* 变量样式 */
.highlight-overlay .variable {
  color: var(--el-color-primary);
  font-weight: 500;
}

/* 运算符样式 - 修改为更协调的颜色 */
.highlight-overlay .operator {
  color: #606266cc;
  /* Element Plus 常规文本颜色加透明度 */
  font-weight: 600;
  /* 加粗以突出显示 */
}

/* 修改括号相关样式 */
.highlight-overlay .bracket {
  font-weight: bold;
  transition: all 0.3s ease;
}

/* 未匹配括号样式 */
.highlight-overlay .bracket.unmatched {
  opacity: 0.6;
}

/* 匹配括号样式 - 移除下划线相关代码 */
.highlight-overlay .bracket.matched {
  font-weight: bold;
}

/* 数字样式 */
.highlight-overlay .text {
  color: var(--el-text-color-primary);
  /* 使用主要文本颜色 */
}

.clear-button {
  width: auto;
  min-width: 48px;
  height: 100%;
  font-size: 1.2rem;
  background-color: #F56C6C;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-button i {
  font-size: 16px;
}

.clear-button:hover {
  background-color: #f78989;
}

.clear-button:active {
  background-color: #e45656;
}

.undo-button,
.redo-button {
  font-size: 1.5rem;
  background-color: #F2F6FC;
}

.undo-button:disabled,
.redo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动指示器样式 */
.scroll-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 3;
  opacity: 0.6;
}

.scroll-indicator.left {
  left: 0;
  background: linear-gradient(to right, rgba(64, 158, 255, 0.2), transparent);
}

.scroll-indicator.right {
  right: 0;
  background: linear-gradient(to left, rgba(64, 158, 255, 0.2), transparent);
}

.scroll-indicator.left::after,
.scroll-indicator.right::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-width: 2px;
  border-style: solid;
  border-color: var(--el-color-primary);
  transform: translateY(-50%) rotate(45deg);
}

.scroll-indicator.left::after {
  left: 8px;
  border-right: none;
  border-top: none;
}

.scroll-indicator.right::after {
  right: 8px;
  border-left: none;
}

/* 预留右侧按钮组的空间 */
.validation-container {
  width: 100%;
  max-width: 400px;
  height: 36px;
  /* 固定高度 */
  margin: 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes slide-in {
  from {
    transform: translateY(-4px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 样式切换按钮 */

/* 键盘样式相关 - 修改选择器的优先级和具体性 */
.editor-content .right-operators button,
.editor-content .top-operators button,
.editor-content .numeric-keypad button {
  border-radius: 4px !important;
  transition: all 0.3s ease;
}

/* 圆形样式 - 增加优先级和具体性 */
.editor-content.circle-style .right-operators button,
.editor-content.circle-style .top-operators button,
.editor-content.circle-style .numeric-keypad button {
  border-radius: 50% !important;
}

/* 圆形样式下的特殊效果 */
.editor-content.circle-style .right-operators button,
.editor-content.circle-style .top-operators button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 操作符样式调整 */

/* 删除按钮样式 */
.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button .el-icon {
  font-size: 24px;
  /* 调整删除图标大小 */
}

/* 复制按钮样式 */

/* 预览模式样式 */
.preview-panel {
  width: 100%;
  max-width: 400px;
  margin: 16px 0;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.variables-input {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.variable-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.variable-name {
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}

.preview-result {
  text-align: center;
  font-size: 16px;
  color: var (--el-text-color-primary);
}

.result-value {
  font-weight: bold;
  color: var(--el-color-primary);
  margin-left: 8px;
}

/* 预览按钮样式 */

/* 删除所有变量提示框相关的样式 */

/* 添加滚动条样式 */

/* 修改操作符按钮样式 */

/* 操作符按钮悬停效果 */

/* 操作符按钮激活效果 */

/* 圆形样式下的特殊效果 */

/* 主题切换和设置按钮样式 */

/* 暗色模式样式 */
:root {
  --editor-bg: #ffffff;
  --editor-text: #303133;
  --editor-border: #dcdfe6;
  --editor-shadow: rgba(0, 0, 0, 0.1);
  --editor-hover: #f5f5f5;
  --editor-active: #e6e6e6;
}

:root.dark-mode {
  --editor-bg: #1e1e1e;
  --editor-text: #ffffff;
  --editor-border: #4c4c4c;
  --editor-shadow: rgba(0, 0, 0, 0.3);

  /* 覆盖一些基础样式 */
  --el-bg-color: #1e1e1e;
  --el-text-color-primary: #ffffff;
  --el-border-color: #4c4c4c;
  --el-fill-color-blank: #1e1e1e;
}

/* 适配暗色模式的组件样式 */
:root.dark-mode .formula-editor {
  background-color: var(--editor-bg);
  color: var(--editor-text);
}

:root.dark-mode .formula-input {
  background-color: var(--editor-bg);
  border-color: var (--editor-border);
  color: var(--editor-text);
}

:root.dark-mode .highlight-overlay .text {
  color: var(--editor-text);
}

:root.dark-mode .numeric-keypad button,
:root.dark-mode .right-operators button,
:root.dark-mode .top-operators button {
  background-color: var(--editor-hover);
  border-color: var (--editor-border);
  color: var(--editor-text);
}

:root.dark-mode .numeric-keypad button:hover,
:root.dark-mode .right-operators button:hover,
:root.dark-mode .top-operators button:hover {
  background-color: var(--editor-active);
}

:root.dark-mode .preview-panel {
  background-color: var(--editor-hover);
  box-shadow: 0 2px 12px var(--editor-shadow);
}

:root.dark-mode .validation-message.success {
  background-color: rgba(103, 194, 58, 0.2);
}

:root.dark-mode .validation-message.error {
  background-color: rgba(245, 108, 108, 0.2);
}

:root.dark-mode .actual-expression {
  background-color: var(--editor-hover);
}

:root.dark-mode .operator-add {
  background-color: rgba(103, 194, 58, 0.2) !important;
}

:root.dark-mode .operator-subtract {
  background-color: rgba(230, 162, 60, 0.2) !important;
}

:root.dark-mode .operator-multiply {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

:root.dark-mode .operator-divide {
  background-color: rgba(245, 108, 108, 0.2) !important;
}

:root.dark-mode .operator-bracket {
  background-color: rgba(144, 147, 153, 0.2) !important;
}

:root.dark-mode .scroll-indicator.left {
  background: linear-gradient(to right, rgba(64, 158, 255, 0.1), transparent);
}

:root.dark-mode .scroll-indicator.right {
  background: linear-gradient(to left, rgba(64, 158, 255, 0.1), transparent);
}

:root.dark-mode .clear-button {
  background-color: rgba(245, 108, 108, 0.8);
}

:root.dark-mode .clear-button:hover {
  background-color: rgba(245, 108, 108, 1);
}

/* 暗色模式下的设置弹窗样式 */
:root.dark-mode .settings-cancel {
  background-color: var(--editor-hover);
  border-color: var(--editor-border);
  color: var(--editor-text);
}

:root.dark-mode .settings-confirm {
  background-color: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-dark-2);
  color: white;
}

:root.dark-mode .settings-cancel:hover {
  background-color: var(--editor-active);
}

:root.dark-mode .settings-confirm:hover {
  background-color: var(--el-color-primary-dark-1);
}

/* 暗色模式下的括号颜色调整 */
:root.dark-mode .highlight-overlay .bracket.matched {
  opacity: 0.9;
  /* 在暗色模式下略微降低不透明度 */
}

/* 添加消息提示样式 */
:deep(.copy-message) {
  min-width: 120px;
  padding: 8px 12px;
  font-size: 14px;
  z-index: 9999;
}

.condition-button {
  @extend %tool-button;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  width: auto;
  border-radius: 16px;

  .el-icon {
    font-size: 16px;
  }
}

.condition-button {
  @extend %tool-button;
  font-size: 20px;

  .el-icon {
    margin: 0;
    font-size: inherit;
  }

  &:hover {
    background-color: var(--el-color-primary-light-8);
  }

  &:active {
    background-color: var(--el-color-primary-light-5);
  }
}

/* 修改编辑器内容区域样式 */
.editor-content {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin: 12px auto;
  gap: 12px;
  flex-direction: column;
  align-items: center;

  &.horizontal-layout {
    flex-direction: row;
    justify-content: center;
    margin: 12px auto; /* 确保水平布局时也居中 */
    width: fit-content; /* 让容器宽度适应内容 */
    max-width: 800px; /* 保持最大宽度限制 */

    .variables-section {
      width: 240px;
      margin: 0; /* 移除原有的 margin-right */
    }
  }
}

/* 修改变量区域容器样式 */
.variables-section {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  margin: 0 auto; /* 确保垂直布局时居中 */
}

/* 添加 Calculator 组件的样式 */
:deep(.calculator) {
  margin: 0 auto; /* 确保计算器组件居中 */
}
</style>