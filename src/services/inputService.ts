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
    cursorPosition: number,
    variables: Variable[]
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
    const currentNumber = beforeCursor.split(/[-+*/()]/).pop() || '';

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

      // 不允许在空表达式或运算符后直接输入右括号
      const beforeCursor = currentValue.slice(0, cursorPosition);
      if (!beforeCursor || /[-+*/]$/.test(beforeCursor)) {
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
}