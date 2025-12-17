import { ThemeType } from './monacoTheme';

// localStorage 缓存工具
const STORAGE_KEYS = {
  THEME: 'json-formatter-theme',
  NESTED_PARSE: 'json-formatter-nested-parse',
  INPUT_JSON: 'json-formatter-input-json',
} as const;

// 带过期时间的数据结构
interface StorageData<T> {
  value: T;
  timestamp: number;
  expiresAt?: number; // 过期时间戳，undefined 表示永不过期
}

// 默认过期时间（毫秒）- 1天
const DEFAULT_EXPIRE_TIME = 24 * 60 * 60 * 1000;

export const storage = {
  // 主题设置
  getTheme: (): ThemeType => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeType;
      return ['light', 'dark', 'kiro-dark', 'monokai'].includes(saved) ? saved : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme: (theme: ThemeType) => {
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
      const item = localStorage.getItem(STORAGE_KEYS.INPUT_JSON);
      if (!item) return '';

      const data: StorageData<string> = JSON.parse(item);
      
      // 检查是否过期
      if (data.expiresAt && Date.now() > data.expiresAt) {
        // 过期则删除并返回空字符串
        localStorage.removeItem(STORAGE_KEYS.INPUT_JSON);
        return '';
      }
      
      return data.value || '';
    } catch {
      return '';
    }
  },

  setInputJson: (json: string) => {
    try {
      // 只缓存非空且长度合理的JSON（避免缓存过大数据）
      if (json && json.length < 50000) {
        const data: StorageData<string> = {
          value: json,
          timestamp: Date.now(),
          expiresAt: Date.now() + DEFAULT_EXPIRE_TIME // 1天后过期
        };
        localStorage.setItem(STORAGE_KEYS.INPUT_JSON, JSON.stringify(data));
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