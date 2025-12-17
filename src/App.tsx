import { useEffect } from 'react';
import { Header } from './components/Header';
import { JsonEditor } from './components/JsonEditor';
import { Footer } from './components/Footer';
import { Notification } from './components/Notification';
import { useJsonStore } from './store/useJsonStore';
import { config } from './config';

function App() {
  const { formatJson, theme } = useJsonStore();

  useEffect(() => {
    // Log version info
    console.log(`JSON 格式化工具 v${config.version}`);
    console.log(`构建日期: ${config.buildDate}`);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!config.features.enableKeyboardShortcuts) return;

      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        formatJson();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formatJson]);

  // 同步主题到HTML类
  useEffect(() => {
    // 移除所有主题类
    document.documentElement.classList.remove('dark', 'kiro-dark', 'monokai');
    
    // 添加当前主题类
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'kiro-dark') {
      document.documentElement.classList.add('kiro-dark');
    } else if (theme === 'monokai') {
      document.documentElement.classList.add('monokai');
    }

    // 组件挂载后重新启用过渡动画
    setTimeout(() => {
      document.documentElement.style.removeProperty('--initial-transition');
    }, 100);
  }, [theme]);

  return (
    <div className="h-full flex flex-col transition-colors duration-200 bg-white dark:bg-gray-900">
      <Header />
      <JsonEditor />
      <Footer />
      <Notification />
    </div>
  );
}

export default App;
