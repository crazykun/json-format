import { useJsonStore } from '../store/useJsonStore';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';

export const Header = () => {
  const {
    formatJson,
    compressJson,
    validateJson,
    clearAll,
    outputJson,
    addNotification,
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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 py-2">
        <div className="flex justify-between items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-gray-800">
            <span className="text-green-600">JSON</span>
            <span className="hidden xs:inline"> 格式化</span>
          </h1>

          <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-end">
            <ToolButton
              icon="🎨"
              text="格式化"
              onClick={formatJson}
              variant="primary"
            />
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
              icon="📋"
              text="复制"
              onClick={handleCopy}
              variant="secondary"
            />
            <ToolButton
              icon="💾"
              text="下载"
              onClick={handleDownload}
              variant="secondary"
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
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
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
