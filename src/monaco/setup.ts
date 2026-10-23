import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// JSON 语言贡献：editor.api 本身不含任何语言，必须显式引入，
// 否则 JSON 语法高亮 + 校验 + worker 全都失效。
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import { loader } from '@monaco-editor/react';

// Monaco Worker 接入：JSON 语言需要 worker 做语法校验/智能提示。
// 通过 Vite 的 ?worker 语法打成独立 chunk，由本地静态服务器托管，
// 彻底去掉对 jsdelivr CDN 的运行时依赖（那是首屏最大瓶颈）。
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

(self as any).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

// 把 @monaco-editor/react 的 loader 指向本地打包的 monaco，
// 阻止它再去 CDN 拉 monaco-editor@x.y.z/min/vs
loader.config({ monaco });

export default monaco;