import { useJsonStore } from '../store/useJsonStore';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { ThemeType } from '../utils/monacoTheme';
import { NestedParseMode } from '../utils/storage';

export const Header = () => {
  const {
    formatJson,
    compressJson,
    validateJson,
    clearAll,
    outputJson,
    addNotification,
    nestedParseMode,
    setNestedParseMode,
    theme,
    setTheme,
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
            <NestedParseSelector
              currentMode={nestedParseMode}
              onModeChange={setNestedParseMode}
            />
            <ThemeSelector
              currentTheme={theme}
              onThemeChange={setTheme}
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

interface NestedParseSelectorProps {
  currentMode: NestedParseMode;
  onModeChange: (mode: NestedParseMode) => void;
}

const NestedParseSelector = ({ currentMode, onModeChange }: NestedParseSelectorProps) => {
  const modes = [
    { key: 'off' as const, icon: '🔗', name: '嵌套关闭', desc: '不解析嵌套JSON' },
    { key: 'level1' as const, icon: '1️⃣', name: '1层', desc: '解析1层嵌套' },
    { key: 'level2' as const, icon: '2️⃣', name: '2层', desc: '解析2层嵌套' },
    { key: 'all' as const, icon: '🔄', name: '全部', desc: '解析所有嵌套层级' },
  ];

  const currentModeInfo = modes.find(m => m.key === currentMode) || modes[0];

  return (
    <div className="relative group">
      <button
        className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-sm font-medium
                   transition-colors duration-150 min-w-[50px] sm:min-w-[90px] ${
                     currentMode === 'off'
                       ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                       : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300'
                   }`}
        title="嵌套解析模式"
      >
        <span className="text-base leading-none">{currentModeInfo.icon}</span>
        <span className="hidden sm:inline">{currentModeInfo.name}</span>
        <span className="text-xs ml-auto">▼</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                      dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 
                      group-hover:visible transition-all duration-200 z-50 min-w-[160px]">
        <div className="p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">嵌套解析模式</div>
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              className={`w-full flex items-start gap-2 px-2 py-2 text-sm hover:bg-gray-50 
                         dark:hover:bg-gray-700 transition-colors rounded
                         ${currentMode === mode.key 
                           ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                           : 'text-gray-700 dark:text-gray-200'}`}
            >
              <span className="text-base mt-0.5">{mode.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{mode.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</div>
              </div>
              {currentMode === mode.key && <span className="text-blue-600 mt-0.5">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ThemeSelectorProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

const ThemeSelector = ({ currentTheme, onThemeChange }: ThemeSelectorProps) => {
  const themes = [
    { key: 'light' as const, icon: '☀️', name: '浅色' },
    { key: 'dark' as const, icon: '🌙', name: '深色' },
    { key: 'kiro-dark' as const, icon: '💎', name: 'Kiro' },
    { key: 'monokai' as const, icon: '🎨', name: 'Monokai' },
  ];

  const currentThemeInfo = themes.find(t => t.key === currentTheme) || themes[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-sm font-medium
                   transition-colors duration-150 bg-gray-100 hover:bg-gray-200 text-gray-700 
                   dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 w-[60px] sm:w-[115px]"
        title="切换主题"
      >
        <span className="text-base leading-none">{currentThemeInfo.icon}</span>
        <span className="hidden sm:inline">{currentThemeInfo.name}</span>
        <span className="text-xs ml-auto">▼</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                      dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 
                      group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
        {themes.map((theme) => (
          <button
            key={theme.key}
            onClick={() => onThemeChange(theme.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 
                       dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg
                       ${currentTheme === theme.key 
                         ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                         : 'text-gray-700 dark:text-gray-200'}`}
          >
            <span className="text-base">{theme.icon}</span>
            <span>{theme.name}</span>
            {currentTheme === theme.key && <span className="ml-auto text-green-600">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
