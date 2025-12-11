import { useEffect } from 'react';
import { Header } from './components/Header';
import { JsonEditor } from './components/JsonEditor';
import { Footer } from './components/Footer';
import { Notification } from './components/Notification';
import { useJsonStore } from './store/useJsonStore';
import { config } from './config';

function App() {
  const { formatJson, theme, inputJson } = useJsonStore();

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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
