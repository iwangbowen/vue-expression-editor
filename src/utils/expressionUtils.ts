import type { Variable } from '../types';

// 检查是否可以在当前位置插入变量
export const checkCanInsertVariable = (text: string, position: number): boolean => {
  // 如果是在开始位置，允许插入
  if (position === 0) return true;

  const charBefore = text.charAt(position - 2); // 位置-2是因为position-1是@符号

  // 检查前一个字符是否是运算符或左括号
  if (!charBefore || '+-*/('.includes(charBefore)) return true;

  // 检查是否在变量、数字或右括号后面，这种情况需要自动插入乘号
  if (/[\d)]/.test(charBefore)) return true;

  return false;
};

// 清理多余的@符号
export const cleanupAtSymbols = (text: string): string => {
  // 如果存在连续的@，只保留最后一个
  return text.replace(/@+/g, '@');
};

// 检查光标是否在操作符上
export const checkCursorAtOperator = (text: string, cursorPos: number): { operator: string, start: number, end: number } | null => {
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

// 辅助函数：检查括号匹配
const checkBrackets = (text: string): boolean => {
  const brackets = text.replace(/[^()]/g, '');
  let count = 0;
  for (const char of brackets) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return false;
  }
  return count === 0;
};

// 辅助函数：检查变量是否存在
const checkVariables = (text: string, variables: Variable[]): string | null => {
  const vars = text.match(/\w+/g) || [];
  for (const v of vars) {
    if (!variables.some(variable => variable.code === v)) {
      return `未知变量: ${v}`;
    }
  }
  return null;
};

// 辅助函数：检查小数点
const checkDecimalPoints = (text: string): boolean => {
  const numbers = text.split(/[+\-*/()]/);
  for (const num of numbers) {
    if (num.trim() && (num.match(/\./g) || []).length > 1) {
      return false;
    }
  }
  return true;
};

export const validateFormulaText = (text: string, variables: Variable[]): { isValid: boolean; message: string } => {
  if (!text.trim()) {
    return { isValid: false, message: '公式不能为空' };
  }

  // 检查无效字符
  if (/[^0-9a-zA-Z_+\-*/(). ]/g.test(text)) {
    return { isValid: false, message: '公式包含无效字符' };
  }

  // 检查括号匹配
  if (!checkBrackets(text)) {
    return { isValid: false, message: '括号不匹配' };
  }

  // 检查运算符
  if (/[+\-*/]{2,}/.test(text)) {
    return { isValid: false, message: '运算符使用不正确' };
  }

  // 检查变量是否存在
  const variableError = checkVariables(text, variables);
  if (variableError) {
    return { isValid: false, message: variableError };
  }

  // 检查小数点
  if (!checkDecimalPoints(text)) {
    return { isValid: false, message: '数字格式不正确' };
  }

  return { isValid: true, message: '公式格式正确' };
};

// 辅助函数：处理运算符
const handleOperator = (before: string, current: string, variables: Variable[]): string => {
  const lastChar = before.slice(-1);

  // 如果前面没有内容，且不是负号，拒绝输入
  if (!before && current !== '-') {
    return before;
  }

  // 处理减号的特殊情况
  if (current === '-') {
    // 允许在表达式开头、左括号后、运算符后使用
    if (!before || before.endsWith('(') || '+-*/'.includes(before.slice(-1))) {
      return before + current;
    }
    // 作为减号：允许在数字、变量名、右括号后使用
    if (/"/.test(before) || variables.some(v => before.endsWith(v.name)) || /\w+$/.test(before) || /[a-zA-Z_][a-zA-Z0-9_]*$/.test(before)) {
      return before + current;
    }
    return before;
  }

  // 如果前一个字符是运算符，替换它
  if ('+-*/'.includes(lastChar)) {
    return before.slice(0, -1) + current;
  }

  // 不允许在左括号后直接使用运算符，除了负号
  if (lastChar === '(' && current !== '-') {
    return before;
  }

  return before + current;
};

export const autoCorrectInput = (before: string, current: string, variables: Variable[]): string => {
  // 允许输入 @ 符号
  if (current === '@') {
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

  // 处理运算符
  if ('+-*/'.includes(current)) {
    return handleOperator(before, current, variables);
  }

  // 处理数字
  if (/\d/.test(current)) {
    // 避免数字前导零
    if (lastChar === '0' && !before.slice(0, -1).endsWith('.')) {
      return before.slice(0, -1) + current;
    }
  }

  return before + current;
};