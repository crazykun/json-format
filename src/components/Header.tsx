import { useJsonStore } from '../store/useJsonStore';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { storage } from '../utils/storage';

export const Header = () => {
  const {
    formatJson,
    compressJson,
    validateJson,
    clearAll,
    outputJson,
    addNotification,
    enableNestedParse,
    toggleNestedParse,
    theme,
    toggleTheme,
  } = useJsonStore();

  const handleCopy = async () => {
    if (!outputJson) {
      addNotification('warning', '没有可复制的内容');
      return;
    }

    try {
      await copyToClipboard(outputJson);
      addNotification('success', '复制成功');
    } catch (error) {
      addNotification('error', '复制失败');
    }
  };

  const handleDownload = () => {
    if (!outputJson) {
      addNotification('warning', '没有可下载的内容');
      return;
    }

    try {
      downloadJsonFile(outputJson);
      addNotification('success', '下载成功');
    } catch (error) {
      addNotification('error', '下载失败');
    }
  };

  const handleClearCache = () => {
    storage.clearAll();
    addNotification('success', '缓存已清除，刷新页面生效');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm border border-green-400/20">
              <span className="text-white text-base font-mono font-bold tracking-tight">{`{}`}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">JSON</span>
              <span className="hidden xs:inline text-gray-700 dark:text-gray-300"> 格式化工具</span>
            </h1>
          </div>

          <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-end">
            <ToolButton
              icon="📦"
              text="压缩"
              onClick={compressJson}
              variant="secondary"
            />
            <ToolButton
              icon="✓"
              text="验证"
              onClick={validateJson}
              variant="secondary"
            />
            <ToolButton
              icon="🗑️"
              text="清空"
              onClick={clearAll}
              variant="secondary"
            />
            <ToolButton
              icon="💾"
              text="下载"
              onClick={handleDownload}
              variant="secondary"
            />
            <ToolButton
              icon="📋"
              text="复制"
              onClick={handleCopy}
              variant="secondary"
            />
            <ToggleButton
              icon="🔗"
              text="嵌套解析"
              active={enableNestedParse}
              onClick={toggleNestedParse}
            />
            <ToggleButton
              icon={theme === 'light' ? '🌙' : '☀️'}
              text={theme === 'light' ? '深色模式' : '浅色模式'}
              active={theme === 'dark'}
              onClick={toggleTheme}
            />
            <ToolButton
              icon="🎨"
              text="格式化"
              onClick={formatJson}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

interface ToolButtonProps {
  icon: string;
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const ToolButton = ({ icon, text, onClick, variant = 'secondary' }: ToolButtonProps) => {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-sm font-medium
                 transition-colors duration-150 ${variants[variant]}`}
      title={text}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
};

interface ToggleButtonProps {
  icon: string;
  text: string;
  active: boolean;
  onClick: () => void;
}

const ToggleButton = ({ icon, text, active, onClick }: ToggleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-sm font-medium
                 transition-colors duration-150 ${active
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
        }`}
      title={text}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
};
