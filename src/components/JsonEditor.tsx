import { useRef, useEffect } from 'react';
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
  } = useJsonStore();

  const inputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const outputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const formatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputMount: OnMount = (editor) => {
    inputEditorRef.current = editor;
  };

  const handleOutputMount: OnMount = (editor) => {
    outputEditorRef.current = editor;
  };

  // 监听输入变化，自动格式化
  useEffect(() => {
    if (!inputJson) return;

    // 清除之前的定时器
    if (formatTimerRef.current) {
      clearTimeout(formatTimerRef.current);
    }

    // 500ms 后自动格式化
    formatTimerRef.current = setTimeout(() => {
      try {
        JSON.parse(inputJson);
        formatJson();
      } catch {
        // 忽略格式错误
      }
    }, 500);

    return () => {
      if (formatTimerRef.current) {
        clearTimeout(formatTimerRef.current);
      }
    };
  }, [inputJson, formatJson]);

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

  return (
    <main className="flex-1 overflow-hidden flex flex-col md:flex-row gap-2 sm:gap-3 p-2 sm:p-3">
      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-600">输入</span>
          {error && (
            <span className="text-xs text-red-600">{error}</span>
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
            theme="vs"
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
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-600">输出</span>
          {outputJson && (
            <span className="text-xs text-green-600">✓ 格式化完成</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={outputJson}
            onMount={handleOutputMount}
            theme="vs"
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
    </main>
  );
};
