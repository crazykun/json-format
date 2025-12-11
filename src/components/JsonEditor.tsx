import { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useJsonStore } from '../store/useJsonStore';
import { readFileAsText } from '../utils/fileUtils';
import type { editor } from 'monaco-editor';

export const JsonEditor = () => {
  const {
    inputJson,
    outputJson,
    setInputJson,
    formatJson,
    error,
    addNotification,
    theme,
  } = useJsonStore();

  const inputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const outputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const formatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFormattedInitialRef = useRef(false);
  const lastInputRef = useRef('');

  // 左侧面板宽度百分比 (0-100)
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleInputMount: OnMount = (editor) => {
    inputEditorRef.current = editor;
  };

  const handleOutputMount: OnMount = (editor) => {
    outputEditorRef.current = editor;
  };

  // 监听输入变化，自动格式化
  useEffect(() => {
    console.log('JsonEditor useEffect triggered:', {
      inputJson: inputJson ? inputJson.substring(0, 50) + '...' : 'empty',
      hasFormattedInitial: hasFormattedInitialRef.current,
      lastInput: lastInputRef.current ? lastInputRef.current.substring(0, 50) + '...' : 'empty'
    });

    // 如果输入为空，跳过
    if (!inputJson) {
      console.log('Skipping: inputJson is empty');
      return;
    }

    // 如果已经格式化过初始内容且内容与上次相同，跳过
    if (hasFormattedInitialRef.current && inputJson === lastInputRef.current) {
      console.log('Skipping: already formatted initial and same as last input');
      return;
    }

    lastInputRef.current = inputJson;

    // 初始加载时立即格式化，后续变化延迟格式化
    const delay = hasFormattedInitialRef.current ? 500 : 100;
    console.log('Will format with delay:', delay, 'ms');

    // 清除之前的定时器
    if (formatTimerRef.current) {
      clearTimeout(formatTimerRef.current);
    }

    // 延迟格式化
    formatTimerRef.current = setTimeout(() => {
      console.log('Executing formatJson...');
      try {
        JSON.parse(inputJson);
        formatJson();
        // 标记已经格式化过初始内容
        if (!hasFormattedInitialRef.current) {
          hasFormattedInitialRef.current = true;
        }
      } catch (error) {
        console.log('JSON parse error:', error);
        // 忽略格式错误
      }
    }, delay);

    return () => {
      if (formatTimerRef.current) {
        clearTimeout(formatTimerRef.current);
      }
    };
  }, [inputJson]); // 移除 formatJson 依赖，避免重复触发

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(
      (file) => file.name.endsWith('.json') || file.type === 'application/json'
    );

    if (!jsonFile) {
      addNotification('error', '请拖入 JSON 文件');
      return;
    }

    try {
      const content = await readFileAsText(jsonFile);
      setInputJson(content);
      addNotification('success', '文件加载成功');
    } catch (error) {
      addNotification('error', '文件读取失败');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 处理分隔条拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    // 限制在 20% 到 80% 之间
    const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <main className="flex-1 overflow-hidden flex flex-col md:flex-row p-2 sm:p-3">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
      >
        <div
          className="flex flex-col bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-0 transition-colors duration-200"
          style={{
            width: window.innerWidth >= 768 ? `${leftWidth}%` : '100%',
            marginBottom: window.innerWidth < 768 ? '0.75rem' : '0'
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">输入</span>
            {error && (
              <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
            )}
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex-1 overflow-hidden"
          >
            <Editor
              height="100%"
              defaultLanguage="json"
              value={inputJson}
              onChange={(value) => setInputJson(value || '')}
              onMount={handleInputMount}
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                fontFamily: "'Consolas', 'Monaco', monospace",
                padding: { top: 8, bottom: 8 },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                placeholder: '在此输入或粘贴 JSON 数据...\n支持拖拽 .json 文件',
              }}
            />
          </div>
        </div>

        {/* 分隔条 - 只在桌面端显示 */}
        <div
          className="hidden md:flex items-center justify-center w-2 cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-gray-400 dark:group-hover:bg-gray-500 transition-colors"></div>
        </div>

        <div
          className="flex flex-col bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-0 transition-colors duration-200"
          style={{
            width: window.innerWidth >= 768 ? `${100 - leftWidth}%` : '100%'
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">输出</span>
            {outputJson && (
              <span className="text-xs text-green-600 dark:text-green-400">✓ 格式化完成</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={outputJson}
              onMount={handleOutputMount}
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                fontFamily: "'Consolas', 'Monaco', monospace",
                padding: { top: 8, bottom: 8 },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
};
