export interface Variable {
  name: string;
  code: string;
}

export interface Token {
  type: string;
  text: string;
  bracketStatus?: 'unmatched' | 'matched' | 'current';
  bracketIndex?: number;
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}
