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
      // 如果表达式为空，返回 null
      if (!expression.trim()) {
        return null;
      }

      // 替换变量为实际值
      let evalExpression = expression;
      variables.forEach(variable => {
        const value = variableValues[variable.code] ?? 0;
        evalExpression = evalExpression.replace(
          new RegExp(variable.code, 'g'),
          value.toString()
        );
      });

      // 检查表达式是否以运算符结尾
      if (/[-+*/]$/.test(evalExpression)) {
        return null;
      }

      // 检查括号是否匹配
      const leftBrackets = (evalExpression.match(/\(/g) || []).length;
      const rightBrackets = (evalExpression.match(/\)/g) || []).length;
      if (leftBrackets !== rightBrackets) {
        return null;
      }

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

  /**
   * 检查光标是否位于操作符位置
   */
  static checkCursorAtOperator(expression: string, cursorPosition: number): { start: number; end: number; operator: string } | null {
    const operators = ['+', '-', '*', '/'];
    if (cursorPosition <= 0 || cursorPosition > expression.length) return null;

    const char = expression.charAt(cursorPosition - 1);
    if (operators.includes(char)) {
      return {
        start: cursorPosition - 1,
        end: cursorPosition,
        operator: char
      };
    }

    return null;
  }

  /**
   * 自动校正输入值
   */
  static autoCorrectInput(
    beforeText: string,
    input: string,
    variables: Variable[]
  ): string {
    // 处理特殊情况：输入为空
    if (!input) return beforeText;

    // 处理第一个字符
    if (!beforeText) {
      // 第一个字符只能是数字、左括号或负号
      if (input === '-' || input === '(' || /^\d$/.test(input)) {
        return input;
      }
      if (input === '.') {
        return '0.';
      }
      return beforeText;
    }

    const lastChar = beforeText.slice(-1);
    const operators = ['+', '-', '*', '/'];

    // 处理运算符
    if (operators.includes(input)) {
      // 不能在表达式开始使用运算符（除了负号）
      if (!beforeText && input !== '-') {
        return beforeText;
      }

      // 处理连续运算符的情况
      if (operators.includes(lastChar)) {
        // 如果上一个是减号，且再上一个是运算符，不允许继续添加
        if (lastChar === '-' && beforeText.length > 1 && operators.includes(beforeText.charAt(beforeText.length - 2))) {
          return beforeText;
        }
        // 允许在其他运算符后使用负号
        if (input === '-') {
          return beforeText + input;
        }
        // 替换最后一个运算符
        return beforeText.slice(0, -1) + input;
      }

      // 不允许在左括号后直接使用运算符（除了负号）
      if (lastChar === '(' && input !== '-') {
        return beforeText;
      }

      return beforeText + input;
    }

    // 处理括号
    if (input === '(' || input === ')') {
      // 处理左括号
      if (input === '(') {
        // 左括号前必须是运算符或另一个左括号或表达式开始
        if (!beforeText || operators.includes(lastChar) || lastChar === '(') {
          return beforeText + input;
        }
        return beforeText;
      }

      // 处理右括号
      if (input === ')') {
        // 计算括号数量
        const leftCount = (beforeText.match(/\(/g) || []).length;
        const rightCount = (beforeText.match(/\)/g) || []).length;

        // 确保有未匹配的左括号
        if (rightCount >= leftCount) {
          return beforeText;
        }

        // 右括号前不能是运算符或左括号
        if (operators.includes(lastChar) || lastChar === '(') {
          return beforeText;
        }

        return beforeText + input;
      }
    }

    // 处理数字和小数点
    if (/^\d$/.test(input) || input === '.') {
      // 如果是小数点
      if (input === '.') {
        // 获取最后一个数字串
        const lastNumber = beforeText.split(/[-+*/()]/).pop() || '';
        // 如果已经包含小数点，不允许再添加
        if (lastNumber.includes('.')) {
          return beforeText;
        }
        // 如果前面没有数字，自动补0
        if (!/\d$/.test(beforeText)) {
          return beforeText + '0.';
        }
      }

      return beforeText + input;
    }

    // 其他情况保持原样
    return beforeText;
  }

  /**
   * 清理多余的@符号
   */
  static cleanupAtSymbols(value: string): string {
    // 删除连续的@符号，只保留最后一个
    return value.replace(/(@+)/g, (match) => match.slice(-1));
  }

  /**
   * 格式化括号
   */
  static formatBrackets(expression: string): string {
    let formatted = expression;
    // 在左括号后添加空格
    formatted = formatted.replace(/\(/g, '( ');
    // 在右括号前添加空格
    formatted = formatted.replace(/\)/g, ' )');
    return formatted;
  }

  /**
   * 格式化操作符
   */
  static formatOperators(expression: string): string {
    let formatted = expression;
    // 在运算符前后添加空格（除了负号）
    formatted = formatted.replace(/([+*\/])/g, ' $1 ');
    formatted = formatted.replace(/(-)/g, ' $1 ');
    // 修复负号前的空格
    formatted = formatted.replace(/(\d|\))\s*-\s*(\d|\()/g, '$1 - $2');
    return formatted;
  }

  /**
   * 验证表达式格式
   */
  static validateFormulaText(expression: string, variables: Variable[]): ValidationResult {
    // 检查表达式是否为空
    if (!expression.trim()) {
      return {
        isValid: false,
        message: '表达式不能为空'
      };
    }

    // 检查表达式是否以运算符结尾
    if (/[-+*/]$/.test(expression)) {
      return {
        isValid: false,
        message: '表达式不能以运算符结尾'
      };
    }

    // 检查表达式中是否有连续的运算符（除了负号）
    if (/[-+*/][-+*/]/.test(expression.replace(/[-+*/]\s*-/g, ''))) {
      return {
        isValid: false,
        message: '运算符使用不正确，不能有连续的运算符'
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

      // 检查表达式是否包含无效字符
      const invalidChars = expression.match(/[^0-9a-zA-Z_+\-*/(). ]/g);
      if (invalidChars) {
        return {
          isValid: false,
          message: `表达式包含无效字符: ${invalidChars.join(' ')}`
        };
      }

      // 尝试计算结果
      const result = this.calculateResult(expression, variables);
      if (result === null) {
        return {
          isValid: false,
          message: '表达式无法计算，请检查格式'
        };
      }

      return {
        isValid: true,
        message: '表达式格式正确'
      };
    } catch (error) {
      return {
        isValid: false,
        message: '表达式格式错误，请检查输入'
      };
    }
  }
}
