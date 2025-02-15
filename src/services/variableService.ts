import type { Variable } from '../types';
export class VariableService {
  /**
   * 格式化变量插入
   * @param variable 要插入的变量
   * @param before 光标前的文本
   * @param after 光标后的文本
   * @param variables 所有可用变量列表
   * @returns 格式化后的插入文本
   */
  static formatVariableInsertion(
    variable: Variable,
    before: string,
    after: string,
    variables: Variable[]
  ): string {
    // 检查前面是否需要添加运算符
    let insertion = variable.name;

    // 如果前面不是空的且不是运算符或左括号，自动插入乘号
    if (before && !/[-+*/(]$/.test(before)) {
      insertion = '*' + insertion;
    }

    return insertion;
  }

  /**
   * 生成变量插入内容和新的光标位置
   */
  static generateVariableInsertion(
    variable: Variable,
    text: string,
    cursorPos: number,
    trigger: string,
    variables: Variable[]
  ): { text: string; newPosition: number } {
    const before = text.slice(0, cursorPos);
    const after = text.slice(cursorPos);

    // 找到最后一个触发符号的位置
    const lastTriggerPos = before.lastIndexOf(trigger);
    if (lastTriggerPos === -1) return { text, newPosition: cursorPos };

    // 获取要替换的文本范围
    const beforeTrigger = text.slice(0, lastTriggerPos);
    const insertion = this.formatVariableInsertion(
      variable,
      beforeTrigger,
      after,
      variables
    );

    // 生成新文本
    const newText = beforeTrigger + insertion + after;
    const newPosition = lastTriggerPos + insertion.length;

    return { text: newText, newPosition };
  }

  /**
   * 检查光标是否在变量内部
   * @returns 如果在变量内，返回变量信息和位置；否则返回null
   */
  static checkCursorInVariable(
    text: string,
    cursorPos: number,
    variables: Variable[]
  ): { variable: Variable; start: number; end: number } | null {
    // 按变量名长度降序排序，确保优先匹配最长的变量名
    const sortedVariables = [...variables].sort(
      (a, b) => b.name.length - a.name.length
    );

    // 检查光标位置前后的文本
    for (let i = 0; i < text.length; i++) {
      for (const variable of sortedVariables) {
        // 如果找到变量
        if (text.substring(i).startsWith(variable.name)) {
          const start = i;
          const end = i + variable.name.length;
          // 检查光标是否在这个变量范围内
          if (cursorPos >= start && cursorPos <= end) {
            return { variable, start, end };
          }
          // 跳过这个变量的长度，避免重复检查
          i += variable.name.length - 1;
          break;
        }
      }
    }
    return null;
  }

  /**
   * 搜索变量
   */
  static searchVariables(
    searchText: string,
    variables: Variable[]
  ): Variable[] {
    const text = searchText.toLowerCase();
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(text) ||
        v.code.toLowerCase().includes(text)
    );
  }

  /**
   * 替换显示文本中的变量为实际代码
   */
  static replaceVariablesWithCodes(
    text: string,
    variables: Variable[]
  ): string {
    let result = text;
    // 按变量名长度降序排序，确保优先替换最长的变量名
    const sortedVariables = [...variables].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (const variable of sortedVariables) {
      const regex = new RegExp(variable.name, 'g');
      result = result.replace(regex, variable.code);
    }
    return result;
  }

  /**
   * 替换代码中的变量为显示文本
   */
  static replaceCodesWithVariables(
    text: string,
    variables: Variable[]
  ): string {
    let result = text;
    // 按代码长度降序排序，确保优先替换最长的代码
    const sortedVariables = [...variables].sort(
      (a, b) => b.code.length - a.code.length
    );

    for (const variable of sortedVariables) {
      const regex = new RegExp(variable.code, 'g');
      result = result.replace(regex, variable.name);
    }
    return result;
  }

  /**
   * 检查是否需要在变量前后添加乘号
   */
  static checkNeedMultiplyOperator(before: string, after: string, variables: Variable[]): {
    needBefore: boolean;
    needAfter: boolean;
  } {
    const needBefore = Boolean(before && (
      /[\d)]$/.test(before) ||
      variables.some(v => before.endsWith(v.name))
    ));

    const needAfter = Boolean(after && (
      /^[\d(]/.test(after) ||
      variables.some(v => after.startsWith(v.name))
    ));

    return { needBefore, needAfter };
  }

  /**
   * 过滤变量列表
   */
  static filterVariables(searchText: string, variables: Variable[]): Variable[] {
    const lowerSearchText = searchText.toLowerCase();
    return variables.filter(v =>
      v.name.toLowerCase().includes(lowerSearchText) ||
      v.code.toLowerCase().includes(lowerSearchText)
    );
  }

  /**
   * 处理变量相关的光标移动
   */
  static handleVariableCursorMovement(
    text: string,
    currentPos: number,
    direction: 'left' | 'right',
    variables: Variable[]
  ): number {
    const currentVariable = this.checkCursorInVariable(text, currentPos, variables);
    const nextPosition = direction === 'left' ? currentPos - 1 : currentPos + 1;
    const nextVariable = this.checkCursorInVariable(text, nextPosition, variables);

    if (!currentVariable && !nextVariable) {
      return nextPosition;
    }

    if (direction === 'left') {
      if (currentVariable && currentPos > currentVariable.start) {
        return currentVariable.start;
      }
      if (nextVariable) {
        return nextVariable.start;
      }
    } else {
      if (currentVariable && currentPos < currentVariable.end) {
        return currentVariable.end;
      }
      if (nextVariable) {
        return nextVariable.end;
      }
    }

    return Math.max(0, Math.min(nextPosition, text.length));
  }

  /**
   * 检查是否可以在当前位置插入变量
   */
  static canInsertVariable(text: string, position: number): boolean {
    if (position === 0) return true;

    const charBefore = text.charAt(position - 1);

    if (!charBefore || '+-*/('.includes(charBefore)) return true;

    if (/[\d)]/.test(charBefore)) return true;

    return false;
  }

  /**
   * 处理变量搜索
   */
  static handleVariableSearch(text: string, cursorPosition: number, triggerChar: string, variables: Variable[]): Variable[] {
    const searchText = text.slice(text.lastIndexOf(triggerChar) + 1, cursorPosition).toLowerCase();
    if (!searchText) return variables;

    return variables.filter(v =>
      v.name.toLowerCase().includes(searchText) ||
      v.code.toLowerCase().includes(searchText)
    );
  }

  /**
   * 处理触发字符的输入
   */
  static handleTriggerCharInput(value: string, cursorPosition: number, triggerChar: string): boolean {
    const lastChar = value.charAt(cursorPosition - 1);
    if (lastChar === triggerChar) {
      return this.canInsertVariable(value, cursorPosition);
    }
    return false;
  }

  /**
   * 查找光标位置之前的最近变量
   */
  static findPreviousVariable(
    text: string,
    cursorPos: number,
    variables: Variable[]
  ): { variable: Variable; start: number; end: number } | null {
    const sortedVariables = [...variables].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (let i = cursorPos - 1; i >= 0; i--) {
      for (const variable of sortedVariables) {
        if (text.substring(i).startsWith(variable.name)) {
          const start = i;
          const end = i + variable.name.length;
          return { variable, start, end };
        }
      }
    }
    return null;
  }
}
