import { create } from 'zustand';
import { JsonState, Notification, NotificationType } from '../types';
import { storage } from '../utils/storage';

interface JsonStore extends JsonState {
  notifications: Notification[];
  enableNestedParse: boolean;
  theme: 'light' | 'dark';

  // Actions
  setInputJson: (json: string) => void;
  setOutputJson: (json: string) => void;
  setError: (error: string | null) => void;
  setIsValid: (isValid: boolean) => void;
  setIsCompressed: (isCompressed: boolean) => void;
  toggleNestedParse: () => void;
  toggleTheme: () => void;

  // JSON Operations
  parseNestedJson: (obj: any) => any;
  formatJson: () => void;
  compressJson: () => void;
  validateJson: () => boolean;
  clearAll: () => void;

  // Notifications
  addNotification: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
}

export const useJsonStore = create<JsonStore>((set, get) => ({
  // Initial state - 从缓存中恢复
  inputJson: storage.getInputJson(),
  outputJson: '',
  isValid: false,
  isCompressed: false,
  error: null,
  notifications: [],
  enableNestedParse: storage.getNestedParse(),
  theme: storage.getTheme(),

  // Setters
  setInputJson: (json) => {
    set({ inputJson: json });
    storage.setInputJson(json);
  },
  setOutputJson: (json) => set({ outputJson: json }),
  setError: (error) => set({ error }),
  setIsValid: (isValid) => set({ isValid }),
  setIsCompressed: (isCompressed) => set({ isCompressed }),
  toggleNestedParse: () => {
    const newValue = !get().enableNestedParse;
    set({ enableNestedParse: newValue });
    storage.setNestedParse(newValue);
    get().addNotification(
      'success',
      newValue ? '已启用嵌套解析' : '已禁用嵌套解析'
    );
    // 切换后自动执行一次格式化
    if (get().inputJson) {
      setTimeout(() => {
        get().formatJson();
      }, 100);
    }
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    storage.setTheme(newTheme);
    get().addNotification('success', `已切换到${newTheme === 'light' ? '浅色' : '深色'}主题`);
  },

  // 递归解析嵌套的 JSON 字符串
  parseNestedJson: (obj: any): any => {
    if (typeof obj === 'string') {
      try {
        // 尝试解析字符串为 JSON
        const parsed = JSON.parse(obj);
        // 递归处理解析后的对象
        return get().parseNestedJson(parsed);
      } catch {
        // 不是有效的 JSON 字符串，直接返回
        return obj;
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => get().parseNestedJson(item));
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = get().parseNestedJson(obj[key]);
      }
      return result;
    }
    return obj;
  },

  // JSON Operations
  formatJson: () => {
    const { inputJson, enableNestedParse } = get();
    try {
      const parsed = JSON.parse(inputJson);
      // 根据开关决定是否递归解析嵌套的 JSON 字符串
      const result = enableNestedParse ? get().parseNestedJson(parsed) : parsed;
      const formatted = JSON.stringify(result, null, 2);
      set({
        outputJson: formatted,
        isValid: true,
        isCompressed: false,
        error: null,
      });
      get().addNotification('success', 'JSON 格式化成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON 格式错误';
      set({
        outputJson: '',
        isValid: false,
        error: errorMessage,
      });
      get().addNotification('error', errorMessage);
    }
  },

  compressJson: () => {
    const { inputJson } = get();
    try {
      const parsed = JSON.parse(inputJson);
      const compressed = JSON.stringify(parsed);
      set({
        outputJson: compressed,
        isValid: true,
        isCompressed: true,
        error: null,
      });
      get().addNotification('success', 'JSON 压缩成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON 格式错误';
      set({
        outputJson: '',
        isValid: false,
        error: errorMessage,
      });
      get().addNotification('error', errorMessage);
    }
  },

  validateJson: () => {
    const { inputJson } = get();
    try {
      JSON.parse(inputJson);
      set({
        isValid: true,
        error: null,
      });
      get().addNotification('success', 'JSON 格式正确');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JSON 格式错误';
      set({
        isValid: false,
        error: errorMessage,
      });
      get().addNotification('error', errorMessage);
      return false;
    }
  },

  clearAll: () => {
    set({
      inputJson: '',
      outputJson: '',
      isValid: false,
      isCompressed: false,
      error: null,
    });
    storage.setInputJson('');
    get().addNotification('success', '已清空所有内容');
  },

  // Notifications
  addNotification: (type, message) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message };
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto remove after 3 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 3000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
