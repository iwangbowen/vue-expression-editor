import type { Variable } from '../types';

export class ExpressionService {
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

  // 计算表达式结果
  static calculateResult(expression: string, variables: Variable[], variableValues: Record<string, number>): number | null {
    if (!expression.trim() || expression.includes('@')) {
      return null;
    }

    if (/[+\-*/]$/.test(expression) || /\($/.test(expression)) {
      return null;
    }

    try {
      let formula = expression;
      // 预检查除数为零的情况
      const hasZeroDivision = /\/\s*0(?!\d)/.test(formula);
      if (hasZeroDivision) {
        throw new Error('除数不能为零');
      }

      variables.forEach(v => {
        const value = variableValues[v.code];
        formula = formula.replace(new RegExp(v.code, 'g'), value.toString());
      });

      const calculate = new Function(`return ${formula}`);
      const result = calculate();

      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('计算结果无效');
      }

      return parseFloat(result.toFixed(2));
    } catch (error) {
      return null;
    }
  }

  // 校验公式格式
  static validateExpression(expression: string): boolean {
    // 1. 检查括号匹配
    const stack: string[] = [];
    for (const char of expression) {
      if (char === '(') {
        stack.push(char);
      } else if (char === ')') {
        if (stack.length === 0) return false;
        stack.pop();
      }
    }
    if (stack.length > 0) return false;

    // 2. 检查运算符
    if (/[+\-*/]{2,}/.test(expression)) return false;

    // 3. 检查表达式是否以运算符结尾
    if (/[+\-*/]$/.test(expression)) return false;

    // 4. 检查表达式是否以运算符开始（除了负号）
    if (/^[+*/]/.test(expression)) return false;

    return true;
  }
}