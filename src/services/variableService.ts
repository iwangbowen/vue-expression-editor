import type { Variable } from '../types';

export class VariableService {
  /**
   * 检查是否在变量内部或变量的边界
   */
  static checkCursorInVariable(text: string, cursorPos: number, variables: Variable[]): { variable: Variable, start: number, end: number } | null {
    const allVariables: Array<{ variable: Variable, start: number, end: number }> = [];

    for (const variable of variables) {
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

    allVariables.sort((a, b) => a.start - b.start);

    let foundVariable: { variable: Variable, start: number, end: number } | null = null;
    for (const varInfo of allVariables) {
      if (cursorPos >= varInfo.start && cursorPos <= varInfo.end) {
        foundVariable = varInfo;
        break;
      }
    }

    return foundVariable;
  }

  /**
   * 检查是否需要在变量前后添加乘号
   */
  static checkNeedMultiplyOperator(before: string, after: string, variables: Variable[]): {
    needBefore: boolean;
    needAfter: boolean;
  } {
    const needBefore = before && (
      /[\d)]$/.test(before) ||
      variables.some(v => before.endsWith(v.name))
    );

    const needAfter = after && (
      /^[\d(]/.test(after) ||
      variables.some(v => after.startsWith(v.name))
    );

    return { needBefore, needAfter };
  }

  /**
   * 格式化变量插入
   */
  static formatVariableInsertion(variable: Variable, before: string, after: string, variables: Variable[]): string {
    let insertion = variable.name;
    const { needBefore, needAfter } = this.checkNeedMultiplyOperator(before, after, variables);

    if (needBefore) {
      insertion = '*' + insertion;
    }
    if (needAfter) {
      insertion = insertion + '*';
    }

    return insertion;
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
    const currentVariable = this.checkCursorInVariable(text, currentPos);
    const nextPosition = direction === 'right' ? currentPos + 1 : currentPos - 1;
    const nextVariable = this.checkCursorInVariable(text, nextPosition);

    if (currentVariable || nextVariable) {
      let newPos = currentPos;

      if (direction === 'left') {
        if (currentVariable && currentPos > currentVariable.start) {
          newPos = currentVariable.start;
        } else if (nextVariable) {
          newPos = nextVariable.start;
        } else {
          newPos = currentPos - 1;
        }
      } else {
        if (currentVariable && currentPos < currentVariable.end) {
          newPos = currentVariable.end;
        } else if (nextVariable) {
          newPos = nextVariable.end;
        } else {
          newPos = currentPos + 1;
        }
      }

      return Math.max(0, Math.min(newPos, text.length));
    }

    return direction === 'right' ? currentPos + 1 : currentPos - 1;
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
  static handleTriggerCharInput(value: string, cursorPosition: number, triggerChar: string, variables: Variable[]): boolean {
    const lastChar = value.charAt(cursorPosition - 1);
    if (lastChar === triggerChar) {
      return this.canInsertVariable(value, cursorPosition);
    }
    return false;
  }

  /**
   * 生成变量插入的文本
   */
  static generateVariableInsertion(
    variable: Variable,
    text: string,
    cursorPosition: number,
    triggerChar: string,
    variables: Variable[]
  ): {
    text: string;
    newPosition: number;
  } {
    // 找到触发字符的位置
    const triggerCharPosition = text.slice(0, cursorPosition).lastIndexOf(triggerChar);
    if (triggerCharPosition === -1) return { text, newPosition: cursorPosition };

    const before = text.slice(0, triggerCharPosition);
    const after = text.slice(cursorPosition);
    const insertion = this.formatVariableInsertion(variable, before, after, variables);

    return {
      text: before + insertion + after,
      newPosition: triggerCharPosition + insertion.length
    };
  }
}