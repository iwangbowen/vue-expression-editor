// 基础常量定义
export const FONT_SIZES = {
  MAX: 24,
  MIN: 18,
  PADDING: 24
};

// 允许的字符集合
export const ALLOWED_CHARS = new Set([
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '+', '-', '*', '/',
  '(', ')',
  '.',
  '@'
]);

export const ALLOWED_DIRECT_INPUT = new Set([
  ...Array.from(ALLOWED_CHARS),
  ' ' // 可选的空格
]);

export const CONTROL_KEYS = new Set([
  'Backspace', 'Delete',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'Tab', 'Enter', 'Escape'
]);

// 变量触发字符
export const VARIABLE_TRIGGER = '@';

// 括号颜色配置
export const BRACKET_COLORS = [
  '#409EFF',  // Element Plus 主题蓝色
  '#67C23A',  // Element Plus 成功绿色
  '#E6A23C',  // Element Plus 警告橙色
  '#8E44AD',  // 柔和紫色
  '#16A085'   // 柔和青色
].map(color => `${color}CC`); // CC 表示约 80% 的不透明度
