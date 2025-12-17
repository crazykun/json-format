import type { editor } from 'monaco-editor';

// Kiro Dark 主题配色 - 基于 Kiro IDE 的深色主题
export const kiroDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // 基础语法高亮
    { token: '', foreground: 'E5E7EB' }, // gray-200
    { token: 'comment', foreground: '9CA3AF', fontStyle: 'italic' }, // gray-400
    { token: 'keyword', foreground: '8B5CF6' }, // violet-500
    { token: 'operator', foreground: '06B6D4' }, // cyan-500
    { token: 'string', foreground: '10B981' }, // emerald-500
    { token: 'number', foreground: 'F59E0B' }, // amber-500
    { token: 'regexp', foreground: '10B981' }, // emerald-500
    { token: 'type', foreground: '3B82F6' }, // blue-500
    { token: 'delimiter', foreground: 'D1D5DB' }, // gray-300
    { token: 'delimiter.bracket', foreground: 'D1D5DB' },
    { token: 'delimiter.array', foreground: 'D1D5DB' },
    { token: 'delimiter.parenthesis', foreground: 'D1D5DB' },
    
    // JSON 特定的语法高亮
    { token: 'string.key.json', foreground: '06B6D4' }, // cyan-500 for keys
    { token: 'string.value.json', foreground: '10B981' }, // emerald-500 for values
    { token: 'number.json', foreground: 'F59E0B' }, // amber-500
    { token: 'keyword.json', foreground: '8B5CF6' }, // violet-500
    
    // 其他语言元素
    { token: 'attribute.name', foreground: '06B6D4' },
    { token: 'attribute.value', foreground: '10B981' },
    { token: 'variable', foreground: 'E5E7EB' },
    { token: 'function', foreground: '3B82F6' },
    { token: 'identifier', foreground: 'E5E7EB' },
  ],
  colors: {
    // 编辑器背景 - Kiro 风格的深色背景
    'editor.background': '#0F172A', // slate-900
    'editor.foreground': '#E5E7EB', // gray-200
    
    // 行号
    'editorLineNumber.foreground': '#64748B', // slate-500
    'editorLineNumber.activeForeground': '#94A3B8', // slate-400
    
    // 光标
    'editorCursor.foreground': '#06B6D4', // cyan-500
    
    // 选择
    'editor.selectionBackground': '#1E293B', // slate-800
    'editor.selectionHighlightBackground': '#1E293B80',
    'editor.inactiveSelectionBackground': '#1E293B60',
    
    // 当前行高亮
    'editor.lineHighlightBackground': '#1E293B40', // slate-800 with opacity
    'editor.lineHighlightBorder': '#1E293B40',
    
    // 查找匹配
    'editor.findMatchBackground': '#F59E0B', // amber-500
    'editor.findMatchHighlightBackground': '#F59E0B80',
    'editor.findRangeHighlightBackground': '#1E293B80',
    
    // 括号匹配
    'editorBracketMatch.background': '#334155', // slate-700
    'editorBracketMatch.border': '#06B6D4', // cyan-500
    
    // 滚动条
    'scrollbar.shadow': '#00000080',
    'scrollbarSlider.background': '#334155A0', // slate-700
    'scrollbarSlider.hoverBackground': '#475569A0', // slate-600
    'scrollbarSlider.activeBackground': '#64748BA0', // slate-500
    
    // 边框
    'editorWidget.border': '#334155', // slate-700
    'editorWidget.background': '#0F172A', // slate-900
    
    // 建议框
    'editorSuggestWidget.background': '#1E293B', // slate-800
    'editorSuggestWidget.border': '#334155', // slate-700
    'editorSuggestWidget.foreground': '#E5E7EB', // gray-200
    'editorSuggestWidget.selectedBackground': '#334155', // slate-700
    
    // 悬停提示
    'editorHoverWidget.background': '#1E293B', // slate-800
    'editorHoverWidget.border': '#334155', // slate-700
    'editorHoverWidget.foreground': '#E5E7EB', // gray-200
    
    // 错误和警告
    'editorError.foreground': '#EF4444', // red-500
    'editorWarning.foreground': '#F59E0B', // amber-500
    'editorInfo.foreground': '#06B6D4', // cyan-500
    
    // 缩进参考线
    'editorIndentGuide.background': '#33415540',
    'editorIndentGuide.activeBackground': '#33415580',
    
    // 空白字符
    'editorWhitespace.foreground': '#33415580',
  }
};

// Monokai 主题配色
export const monokaiTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // 基础语法高亮
    { token: '', foreground: 'F8F8F2' },
    { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'F92672' },
    { token: 'operator', foreground: 'F92672' },
    { token: 'string', foreground: 'E6DB74' },
    { token: 'number', foreground: 'AE81FF' },
    { token: 'regexp', foreground: 'E6DB74' },
    { token: 'type', foreground: '66D9EF' },
    { token: 'delimiter', foreground: 'F8F8F2' },
    { token: 'delimiter.bracket', foreground: 'F8F8F2' },
    { token: 'delimiter.array', foreground: 'F8F8F2' },
    { token: 'delimiter.parenthesis', foreground: 'F8F8F2' },
    
    // JSON 特定的语法高亮
    { token: 'string.key.json', foreground: 'A6E22E' },
    { token: 'string.value.json', foreground: 'E6DB74' },
    { token: 'number.json', foreground: 'AE81FF' },
    { token: 'keyword.json', foreground: 'F92672' },
    
    // 其他语言元素
    { token: 'attribute.name', foreground: 'A6E22E' },
    { token: 'attribute.value', foreground: 'E6DB74' },
    { token: 'variable', foreground: 'F8F8F2' },
    { token: 'function', foreground: 'A6E22E' },
    { token: 'identifier', foreground: 'F8F8F2' },
  ],
  colors: {
    // 编辑器背景
    'editor.background': '#272822',
    'editor.foreground': '#F8F8F2',
    
    // 行号
    'editorLineNumber.foreground': '#90908A',
    'editorLineNumber.activeForeground': '#F8F8F2',
    
    // 光标
    'editorCursor.foreground': '#F8F8F0',
    
    // 选择
    'editor.selectionBackground': '#49483E',
    'editor.selectionHighlightBackground': '#49483E80',
    'editor.inactiveSelectionBackground': '#49483E60',
    
    // 当前行高亮
    'editor.lineHighlightBackground': '#3E3D32',
    'editor.lineHighlightBorder': '#3E3D32',
    
    // 查找匹配
    'editor.findMatchBackground': '#FFE792',
    'editor.findMatchHighlightBackground': '#FFE79280',
    'editor.findRangeHighlightBackground': '#49483E80',
    
    // 括号匹配
    'editorBracketMatch.background': '#49483E',
    'editorBracketMatch.border': '#888888',
    
    // 滚动条
    'scrollbar.shadow': '#00000080',
    'scrollbarSlider.background': '#49483E80',
    'scrollbarSlider.hoverBackground': '#49483EA0',
    'scrollbarSlider.activeBackground': '#49483EC0',
    
    // 边框
    'editorWidget.border': '#49483E',
    'editorWidget.background': '#272822',
    
    // 建议框
    'editorSuggestWidget.background': '#272822',
    'editorSuggestWidget.border': '#49483E',
    'editorSuggestWidget.foreground': '#F8F8F2',
    'editorSuggestWidget.selectedBackground': '#49483E',
    
    // 悬停提示
    'editorHoverWidget.background': '#272822',
    'editorHoverWidget.border': '#49483E',
    'editorHoverWidget.foreground': '#F8F8F2',
    
    // 错误和警告
    'editorError.foreground': '#F92672',
    'editorWarning.foreground': '#E6DB74',
    'editorInfo.foreground': '#66D9EF',
    
    // 缩进参考线
    'editorIndentGuide.background': '#49483E40',
    'editorIndentGuide.activeBackground': '#49483E80',
    
    // 空白字符
    'editorWhitespace.foreground': '#49483E80',
  }
};

// 注册自定义主题到 Monaco Editor
export const registerCustomThemes = (monaco: any) => {
  monaco.editor.defineTheme('kiro-dark', kiroDarkTheme);
  monaco.editor.defineTheme('monokai', monokaiTheme);
};

// 主题选项
export const THEME_OPTIONS = {
  light: 'vs',
  dark: 'vs-dark',
  'kiro-dark': 'kiro-dark',
  monokai: 'monokai'
} as const;

export type ThemeType = keyof typeof THEME_OPTIONS;

// 获取安全的主题名称，如果自定义主题未注册则回退到 vs-dark
export const getSafeTheme = (theme: ThemeType, areCustomThemesRegistered: boolean = false): string => {
  if ((theme === 'monokai' || theme === 'kiro-dark') && !areCustomThemesRegistered) {
    return 'vs-dark'; // 回退到深色主题
  }
  return THEME_OPTIONS[theme];
};