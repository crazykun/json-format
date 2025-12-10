import { useEffect } from 'react';
import { Header } from './components/Header';
import { JsonEditor } from './components/JsonEditor';
import { Footer } from './components/Footer';
import { Notification } from './components/Notification';
import { useJsonStore } from './store/useJsonStore';
import { config } from './config';

function App() {
  const { setInputJson, formatJson } = useJsonStore();

  useEffect(() => {
    // Log version info
    console.log(`JSON 格式化工具 v${config.version}`);
    console.log(`构建日期: ${config.buildDate}`);

    // Load sample JSON on mount
    fetch('/sample.json')
      .then((res) => res.text())
      .then((data) => {
        setInputJson(data);
        formatJson();
      })
      .catch((error) => {
        console.error('Failed to load sample JSON:', error);
      });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!config.features.enableKeyboardShortcuts) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        formatJson();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setInputJson, formatJson]);

  return (
    <div className="h-full flex flex-col">
      <Header />
      <JsonEditor />
      <Footer />
      <Notification />
    </div>
  );
}

export default App;
