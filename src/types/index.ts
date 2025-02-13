export interface Variable {
    code: string;
    name: string;
    value?: number;
}

export interface Token {
    type: 'text' | 'operator' | 'bracket' | 'variable';
    text: string;
    start: number;
    end: number;
    bracketStatus?: 'matched' | 'unmatched';
    bracketIndex?: number;
}
