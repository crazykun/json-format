export interface AppConfig {
  version: string;
  buildDate: string;
  features: {
    enableDragDrop: boolean;
    enableKeyboardShortcuts: boolean;
    enableNotifications: boolean;
    enableAutoFormat: boolean;
    showLineNumbers: boolean;
    enableCollapsible: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    maxFileSize: number;
    debounceDelay: number;
  };
  icp?: {
    number: string;
    link: string;
  };
  policeRegistration?: {
    number: string;
    link: string;
  };
}

export type NotificationType = 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export interface JsonState {
  inputJson: string;
  outputJson: string;
  isValid: boolean;
  isCompressed: boolean;
  error: string | null;
}
