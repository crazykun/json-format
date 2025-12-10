import { AppConfig } from './types';

export const config: AppConfig = {
  version: '2.0.0',
  buildDate: new Date().toISOString().split('T')[0],
  features: {
    enableDragDrop: true,
    enableKeyboardShortcuts: true,
    enableNotifications: true,
    enableAutoFormat: true,
    showLineNumbers: true,
    enableCollapsible: true,
  },
  ui: {
    theme: 'light',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    debounceDelay: 300,
  },
  // 如果需要显示备案号，请取消注释并填写
  // icp: {
  //   number: '',
  //   link: '',
  // },
  // policeRegistration: {
  //   number: '',
  //   link: '',
  // },
};
