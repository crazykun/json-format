// 配置项
const CONFIG = {
    // 版本信息
    version: '1.0.0',
    buildDate: '2024-11-05',
    author: 'JSON Tool Team',
    
    // 备案号配置 - 如果需要显示备案号，请在这里设置
    icpNumber: '', // 例如: '京ICP备12345678号-1'
    // 如果有公安备案号也可以添加
    policeNumber: '', // 例如: '京公网安备 11010802012345号'
    
    // 功能开关
    features: {
        enableDragDrop: true,      // 启用拖拽上传
        enableKeyboardShortcuts: true, // 启用键盘快捷键
        enableNotifications: true,  // 启用通知提示
        enableAutoFormat: true,     // 启用自动格式化
        showLineNumbers: true,      // 显示行号
        enableCollapsible: true     // 启用可折叠功能
    },
    
    // UI 配置
    ui: {
        theme: 'light',            // 主题：light/dark
        maxFileSize: 10 * 1024 * 1024, // 最大文件大小 10MB
        debounceDelay: 300         // 输入防抖延迟（毫秒）
    }
};