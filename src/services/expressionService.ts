import type { Variable } from '../types';

interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * 表达式服务类 - 处理表达式计算和验证
 */
export class ExpressionService {
  /**
   * 校验表达式合法性
   */
  static validateExpression(
    expression: string,
    variables: Variable[]
  ): ValidationResult {
    if (!expression.trim()) {
      return {
        isValid: false,
        message: '表达式不能为空'
      };
    }

    try {
      // 检查括号匹配
      const bracketResult = this.checkBrackets(expression);
      if (!bracketResult.isValid) {
        return bracketResult;
      }

      // 检查运算符
      const operatorResult = this.checkOperators(expression);
      if (!operatorResult.isValid) {
        return operatorResult;
      }

      // 检查变量
      const variableResult = this.checkVariables(expression, variables);
      if (!variableResult.isValid) {
        return variableResult;
      }

      // 尝试计算结果
      this.calculateResult(expression, variables);

      return {
        isValid: true,
        message: '表达式格式正确'
      };
    } catch (e) {
      return {
        isValid: false,
        message: `表达式格式错误: ${(e as Error).message}`
      };
    }
  }

  /**
   * 计算表达式结果
   */
  static calculateResult(
    expression: string,
    variables: Variable[],
    variableValues: Record<string, number> = {}
  ): number | null {
    try {
      // 替换变量为实际值
      let evalExpression = expression;
      variables.forEach(variable => {
        const value = variableValues[variable.code] ?? 0;
        evalExpression = evalExpression.replace(
          new RegExp(variable.code, 'g'),
          value.toString()
        );
      });

      // 使用 Function 构造器创建一个安全的计算环境
      const calculate = new Function(`return ${evalExpression}`);
      const result = calculate();

      // 验证结果是否为有效数字
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return null;
      }

      return result;
    } catch (e) {
      console.error('计算错误:', e);
      return null;
    }
  }

  /**
   * 检查括号是否匹配
   */
  private static checkBrackets(expression: string): ValidationResult {
    const stack: string[] = [];
    const pairs: { '(': ')' } = { '(': ')' };
    const openBrackets = Object.keys(pairs);
    const closeBrackets = Object.values(pairs);

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (openBrackets.includes(char)) {
        stack.push(char);
      } else if (closeBrackets.includes(char)) {
        const lastOpen = stack.pop();
        if (!lastOpen || pairs[lastOpen] !== char) {
          return {
            isValid: false,
            message: `括号不匹配: 位置 ${i + 1}`
          };
        }
      }
    }

    if (stack.length > 0) {
      return {
        isValid: false,
        message: '存在未闭合的括号'
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 检查运算符使用是否合法
   */
  private static checkOperators(expression: string): ValidationResult {
    const operators = ['+', '-', '*', '/'];

    // 检查表达式是否以运算符开头（除了负号）
    if (operators.filter(op => op !== '-').some(op => expression.startsWith(op))) {
      return {
        isValid: false,
        message: '表达式不能以运算符开头（除负号外）'
      };
    }

    // 检查表达式是否以运算符结尾
    if (operators.some(op => expression.endsWith(op))) {
      return {
        isValid: false,
        message: '表达式不能以运算符结尾'
      };
    }

    // 检查运算符是否连续使用
    for (let i = 0; i < expression.length - 1; i++) {
      const current = expression[i];
      const next = expression[i + 1];
      if (operators.includes(current) && operators.includes(next)) {
        // 允许负号作为第二个运算符
        if (next === '-') continue;
        return {
          isValid: false,
          message: `运算符不能连续使用: 位置 ${i + 1}`
        };
      }
    }

    return { isValid: true, message: '' };
  }

  /**
   * 检查变量使用是否合法
   */
  private static checkVariables(
    expression: string,
    variables: Variable[]
  ): ValidationResult {
    // 创建一个包含所有变量代码的数组，按长度降序排序
    const variableCodes = variables
      .map(v => v.code)
      .sort((a, b) => b.length - a.length);

    // 标记所有已识别的部分
    const recognized = new Array(expression.length).fill(false);

    // 标记所有运算符和括号
    const operators = ['+', '-', '*', '/', '(', ')'];
    for (let i = 0; i < expression.length; i++) {
      if (operators.includes(expression[i])) {
        recognized[i] = true;
      }
    }

    // 标记所有数字
    const numberRegex = /\d+(\.\d+)?/g;
    let match;
    while ((match = numberRegex.exec(expression)) !== null) {
      for (let i = match.index; i < match.index + match[0].length; i++) {
        recognized[i] = true;
      }
    }

    // 标记所有变量
    for (const code of variableCodes) {
      let pos = -1;
      while ((pos = expression.indexOf(code, pos + 1)) !== -1) {
        // 检查是否为完整的变量（前后不能是字母或数字）
        const before = pos === 0 ? '' : expression[pos - 1];
        const after = pos + code.length >= expression.length ? '' : expression[pos + code.length];

        if (!/[a-zA-Z0-9_]/.test(before) && !/[a-zA-Z0-9_]/.test(after)) {
          for (let i = pos; i < pos + code.length; i++) {
            recognized[i] = true;
          }
        }
      }
    }

    // 检查是否存在未识别的字符
    const unrecognized = recognized.findIndex(r => !r);
    if (unrecognized !== -1) {
      return {
        isValid: false,
        message: `存在无法识别的字符: 位置 ${unrecognized + 1}`
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * 格式化表达式
   */
  static formatExpression(expression: string): string {
    // 移除多余的空格
    let formatted = expression.replace(/\s+/g, '');

    // 在运算符前后添加空格（除了负号）
    formatted = formatted.replace(/([+*\/])/g, ' $1 ');
    formatted = formatted.replace(/(-)/g, ' $1 ');

    // 处理括号
    formatted = formatted.replace(/\(/g, '( ');
    formatted = formatted.replace(/\)/g, ' )');

    // 修复负号前的空格
    formatted = formatted.replace(/(\d|\))\s*-\s*(\d|\()/g, '$1 - $2');

    // 移除多余的空格
    formatted = formatted.replace(/\s+/g, ' ').trim();

    return formatted;
  }

  /**
   * 解析表达式成语法树（用于未来扩展）
   */
  static parseExpression(expression: string): any {
    // TODO: 实现表达式解析为语法树的功能
    throw new Error('Not implemented');
  }

  // 将显示表达式转换为实际表达式
  static convertDisplayToReal(display: string, variables: Variable[]): string {
    let result = display;
    variables.forEach(v => {
      result = result.replace(new RegExp(v.name, 'g'), v.code);
    });
    return result;
  }

  // 将实际表达式转换为显示表达式
  static convertRealToDisplay(real: string, variables: Variable[]): string {
    let result = real;
    variables.forEach(v => {
      result = result.replace(new RegExp(v.code, 'g'), v.name);
    });
    return result;
  }
}