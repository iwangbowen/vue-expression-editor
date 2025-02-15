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
}