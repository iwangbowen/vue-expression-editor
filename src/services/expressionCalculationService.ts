import type { Variable } from '../types';
import { ExpressionService } from './expressionService';
import { VariableService } from './variableService';

export class ExpressionCalculationService {
  /**
   * 计算表达式结果
   */
  static calculateExpressionResult(
    expression: string,
    displayExpression: string,
    variables: Variable[],
    variableValues: Record<string, number>,
    isPreviewMode: boolean,
    isFormulaComplete: boolean
  ): number | null {
    // 如果表达式为空或不完整，不进行计算
    if (!displayExpression || !isFormulaComplete) {
      return null;
    }

    try {
      const result = ExpressionService.calculateResult(
        expression,
        variables,
        variableValues
      );
      return typeof result === 'number' ? Number(result.toFixed(2)) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 校验表达式
   */
  static validateExpression(expression: string, variables: Variable[]) {
    return ExpressionService.validateFormulaText(expression, variables);
  }

  /**
   * 将显示表达式转换为实际表达式
   */
  static convertDisplayToReal(display: string, variables: Variable[]): string {
    return VariableService.replaceVariablesWithCodes(display, variables);
  }

  /**
   * 将实际表达式转换为显示表达式
   */
  static convertRealToDisplay(real: string, variables: Variable[]): string {
    return VariableService.replaceCodesWithVariables(real, variables);
  }
}
