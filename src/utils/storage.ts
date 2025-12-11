// localStorage 缓存工具
const STORAGE_KEYS = {
  THEME: 'json-formatter-theme',
  NESTED_PARSE: 'json-formatter-nested-parse',
  INPUT_JSON: 'json-formatter-input-json',
} as const;

export const storage = {
  // 主题设置
  getTheme: (): 'light' | 'dark' => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme: (theme: 'light' | 'dark') => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // 忽略存储错误
    }
  },

  // 嵌套解析设置
  getNestedParse: (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NESTED_PARSE);
      return saved === 'true';
    } catch {
      return false;
    }
  },

  setNestedParse: (enabled: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NESTED_PARSE, enabled.toString());
    } catch {
      // 忽略存储错误
    }
  },

  // 输入JSON内容（可选，用户可能不希望缓存敏感数据）
  getInputJson: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.INPUT_JSON) || '';
    } catch {
      return '';
    }
  },

  setInputJson: (json: string) => {
    try {
      // 只缓存非空且长度合理的JSON（避免缓存过大数据）
      if (json && json.length < 50000) {
        localStorage.setItem(STORAGE_KEYS.INPUT_JSON, json);
      } else if (!json) {
        localStorage.removeItem(STORAGE_KEYS.INPUT_JSON);
      }
    } catch {
      // 忽略存储错误
    }
  },

  // 清除所有缓存
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {
      // 忽略存储错误
    }
  }
};