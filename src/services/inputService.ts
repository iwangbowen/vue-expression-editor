import type { Variable } from '../types';
import { VariableService } from './variableService';

export interface CursorInfo {
  start: number;
  end: number;
  operator?: string;
}

export interface InputValidationResult {
  isValid: boolean;
  value: string;
  cursorPosition: number;
}

export class InputService {
  /**
   * 校验和处理输入字符
   */
  static validateAndProcessInput(
    currentValue: string,
    input: string,
    cursorPosition: number
  ): InputValidationResult {
    // 处理小数点
    if (input === '.') {
      return this.handleDecimalPoint(currentValue, cursorPosition);
    }

    // 处理运算符
    if ('+-*/'.includes(input)) {
      return this.handleOperator(currentValue, input, cursorPosition);
    }

    // 处理括号
    if (input === '(' || input === ')') {
      return this.handleBracket(currentValue, input, cursorPosition);
    }

    // 处理数字
    if (/^\d$/.test(input)) {
      return this.handleNumber(currentValue, input, cursorPosition);
    }

    // 默认结果：不允许输入
    return {
      isValid: false,
      value: currentValue,
      cursorPosition
    };
  }

  /**
   * 处理小数点输入
   */
  private static handleDecimalPoint(
    currentValue: string,
    cursorPosition: number
  ): InputValidationResult {
    const beforeCursor = currentValue.slice(0, cursorPosition);
    const currentNumber = beforeCursor.split(/[-+*/()]/).pop() ?? '';

    // 检查当前数字是否已包含小数点
    if (currentNumber.includes('.')) {
      return {
        isValid: false,
        value: currentValue,
        cursorPosition
      };
    }

    // 确保小数点前有数字
    if (!/\d$/.test(beforeCursor)) {
      return {
        isValid: true,
        value: beforeCursor + '0.' + currentValue.slice(cursorPosition),
        cursorPosition: cursorPosition + 2
      };
    }

    return {
      isValid: true,
      value: currentValue.slice(0, cursorPosition) + '.' + currentValue.slice(cursorPosition),
      cursorPosition: cursorPosition + 1
    };
  }

  /**
   * 处理运算符输入
   */
  private static handleOperator(
    currentValue: string,
    operator: string,
    cursorPosition: number
  ): InputValidationResult {
    const beforeCursor = currentValue.slice(0, cursorPosition);

    // 特殊处理负号
    if (operator === '-') {
      // 允许在表达式开始、左括号后或运算符后使用负号
      if (!beforeCursor || beforeCursor.endsWith('(') || /[-+*/]$/.test(beforeCursor)) {
        return {
          isValid: true,
          value: currentValue.slice(0, cursorPosition) + operator + currentValue.slice(cursorPosition),
          cursorPosition: cursorPosition + 1
        };
      }
    }

    // 防止运算符连用
    if (/[-+*/]$/.test(beforeCursor)) {
      return {
        isValid: true,
        value: beforeCursor.slice(0, -1) + operator + currentValue.slice(cursorPosition),
        cursorPosition
      };
    }

    // 不允许在表达式开始或左括号后直接使用运算符（除了负号）
    if (!beforeCursor || beforeCursor.endsWith('(')) {
      return {
        isValid: false,
        value: currentValue,
        cursorPosition
      };
    }

    return {
      isValid: true,
      value: currentValue.slice(0, cursorPosition) + operator + currentValue.slice(cursorPosition),
      cursorPosition: cursorPosition + 1
    };
  }

  /**
   * 处理括号输入
   */
  private static handleBracket(
    currentValue: string,
    bracket: string,
    cursorPosition: number
  ): InputValidationResult {
    if (bracket === ')') {
      // 计算左括号和右括号的数量
      const leftCount = (currentValue.match(/\(/g) || []).length;
      const rightCount = (currentValue.match(/\)/g) || []).length;

      // 如果右括号数量已经等于左括号数量，阻止输入
      if (rightCount >= leftCount) {
        return {
          isValid: false,
          value: currentValue,
          cursorPosition
        };
      }

      // 允许在左括号后直接输入右括号
      const beforeCursor = currentValue.slice(0, cursorPosition);
      if (!beforeCursor) {
        return {
          isValid: false,
          value: currentValue,
          cursorPosition
        };
      }
    }

    return {
      isValid: true,
      value: currentValue.slice(0, cursorPosition) + bracket + currentValue.slice(cursorPosition),
      cursorPosition: cursorPosition + 1
    };
  }

  /**
   * 处理数字输入
   */
  private static handleNumber(
    currentValue: string,
    num: string,
    cursorPosition: number
  ): InputValidationResult {
    return {
      isValid: true,
      value: currentValue.slice(0, cursorPosition) + num + currentValue.slice(cursorPosition),
      cursorPosition: cursorPosition + 1
    };
  }

  /**
   * 检查光标是否在变量内部
   */
  static checkCursorInVariable(
    text: string,
    cursorPos: number,
    variables: Variable[]
  ): { variable: Variable; start: number; end: number } | null {
    return VariableService.checkCursorInVariable(text, cursorPos, variables);
  }

  /**
   * 检查光标是否在运算符前后
   */
  static checkCursorAroundOperator(
    text: string,
    cursorPos: number
  ): { operator: string; start: number; end: number } | null {
    // 检查光标前后的字符
    const before = cursorPos > 0 ? text.charAt(cursorPos - 1) : '';
    const current = text.charAt(cursorPos);
    const beforePrev = cursorPos > 1 ? text.charAt(cursorPos - 2) : '';
    const next = cursorPos < text.length - 1 ? text.charAt(cursorPos + 1) : '';

    // 如果光标在运算符之前且不在数字之后
    if ('+-*/'.includes(current) && !(/\d/.test(before))) {
      return {
        operator: current,
        start: cursorPos,
        end: cursorPos + 1
      };
    }

    // 如果光标在运算符之后且不在数字之前
    if ('+-*/'.includes(before) && !(/\d/.test(current))) {
      // 特殊处理：如果是负号（减号）且前面是运算符或左括号或开头，则不视为运算符
      if (before === '-' && (beforePrev === '' || '+-*/('.includes(beforePrev))) {
        return null;
      }
      return {
        operator: before,
        start: cursorPos - 1,
        end: cursorPos
      };
    }

    return null;
  }

  /**
   * 获取光标左侧最近的运算符位置
   */
  static findPreviousOperator(text: string, cursorPos: number): { operator: string; position: number } | null {
    for (let i = cursorPos - 1; i >= 0; i--) {
      if ('+-*/'.includes(text[i])) {
        return {
          operator: text[i],
          position: i
        };
      }
    }
    return null;
  }

  /**
   * 获取光标右侧最近的运算符位置
   */
  static findNextOperator(text: string, cursorPos: number): { operator: string; position: number } | null {
    for (let i = cursorPos; i < text.length; i++) {
      if ('+-*/'.includes(text[i])) {
        return {
          operator: text[i],
          position: i
        };
      }
    }
    return null;
  }

  /**
   * 检查指定位置是否在数字内部
   */
  private static isInNumber(text: string, position: number): { start: number; end: number } | null {
    let start = position;
    let end = position;

    // 向左寻找数字开始
    while (start > 0 && /[\d.]/.test(text[start - 1])) {
      start--;
    }

    // 向右寻找数字结束
    while (end < text.length && /[\d.]/.test(text[end])) {
      end++;
    }

    // 验证提取的字符串是否为有效数字（包括小数）
    const number = text.slice(start, end);
    if (/^\d*[.]?\d*$/.test(number) && number.length > 0 && number !== '.') {
      // 确保小数点前后至少有一个数字
      if (number.includes('.')) {
        const [before, after] = number.split('.');
        if (before.length === 0 && after.length === 0) {
          return null;
        }
      }
      return { start, end };
    }

    return null;
  }

  /**
   * 分离光标移动逻辑为更小的函数
   */
  private static handleRightMovement(
    text: string,
    currentPos: number,
    variables: Variable[]
  ): number {
    // 首先检查是否在数字内部
    const currentNumber = this.isInNumber(text, currentPos);
    if (currentNumber && currentPos < currentNumber.end) {
      return currentNumber.end;
    }

    // 检查当前位置是否在变量内
    const currentVariable = this.checkCursorInVariable(text, currentPos, variables);
    if (currentVariable && currentPos < currentVariable.end) {
      return currentVariable.end;
    }

    // 检查是否在运算符位置
    const currentOperator = this.checkCursorAroundOperator(text, currentPos);
    if (currentOperator?.start === currentPos) {
      return currentOperator.end;
    }

    // 检查下一个可能的变量
    const nextVariable = this.checkCursorInVariable(text, currentPos + 1, variables);
    if (nextVariable) {
      return nextVariable.end;
    }

    // 检查下一个数字
    for (let i = currentPos + 1; i < text.length; i++) {
      const nextNumber = this.isInNumber(text, i);
      if (nextNumber) {
        return nextNumber.start;
      }
    }

    // 检查是否有下一个运算符
    const nextOp = this.findNextOperator(text, currentPos);
    if (nextOp) {
      return nextOp.position;
    }

    return Math.min(currentPos + 1, text.length);
  }

  /**
   * 分离光标左移逻辑为更小的函数
   */
  private static handleLeftMovement(
    text: string,
    currentPos: number,
    variables: Variable[]
  ): number {
    // 首先检查是否在数字内部
    const currentNumber = this.isInNumber(text, currentPos);
    if (currentNumber && currentPos > currentNumber.start) {
      return currentNumber.start;
    }

    // 检查当前位置是否在变量内
    const currentVariable = this.checkCursorInVariable(text, currentPos, variables);
    if (currentVariable && currentPos > currentVariable.start) {
      return currentVariable.start;
    }

    // 检查是否在运算符位置
    const currentOperator = this.checkCursorAroundOperator(text, currentPos);
    if (currentOperator?.end === currentPos) {
      // 如果前面有数字，移动到数字的结尾
      for (let i = currentOperator.start - 1; i >= 0; i--) {
        const prevNumber = this.isInNumber(text, i);
        if (prevNumber) {
          return prevNumber.end;
        }
      }
      return currentOperator.start;
    }

    // 检查前一个可能的变量
    const prevVariable = VariableService.findPreviousVariable(text, currentPos, variables);
    if (prevVariable) {
      return prevVariable.end;
    }

    // 检查前一个数字
    for (let i = currentPos - 1; i >= 0; i--) {
      const prevNumber = this.isInNumber(text, i);
      if (prevNumber) {
        return prevNumber.end;
      }
    }

    // 检查是否有前一个运算符
    const prevOp = this.findPreviousOperator(text, currentPos);
    if (prevOp) {
      return prevOp.position + 1;
    }

    return Math.max(currentPos - 1, 0);
  }

  /**
   * 获取下一个光标位置
   */
  static getNextCursorPosition(
    text: string,
    currentPos: number,
    direction: 'left' | 'right',
    variables: Variable[]
  ): number {
    return direction === 'right'
      ? this.handleRightMovement(text, currentPos, variables)
      : this.handleLeftMovement(text, currentPos, variables);
  }
}
