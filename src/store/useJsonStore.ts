import { create } from 'zustand';
import { JsonState, Notification, NotificationType } from '../types';

interface JsonStore extends JsonState {
  notifications: Notification[];

  // Actions
  setInputJson: (json: string) => void;
  setOutputJson: (json: string) => void;
  setError: (error: string | null) => void;
  setIsValid: (isValid: boolean) => void;
  setIsCompressed: (isCompressed: boolean) => void;

  // JSON Operations
  formatJson: () => void;
  compressJson: () => void;
  validateJson: () => boolean;
  clearAll: () => void;

  // Notifications
  addNotification: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
}

export const useJsonStore = create<JsonStore>((set, get) => ({
  // Initial state
  inputJson: '',
  outputJson: '',
  isValid: false,
  isCompressed: false,
  error: null,
  notifications: [],

  // Setters
  setInputJson: (json) => set({ inputJson: json }),
  setOutputJson: (json) => set({ outputJson: json }),
  setError: (error) => set({ error }),
  setIsValid: (isValid) => set({ isValid }),
  setIsCompressed: (isCompressed) => set({ isCompressed }),

  // JSON Operations
  formatJson: () => {
    const { inputJson } = get();
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
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
