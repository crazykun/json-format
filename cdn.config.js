/**
 * CDN 配置文件
 * 
 * 使用方法：
 * 1. 根据需要取消注释对应的 CDN 配置
 * 2. 重新构建：npm run build
 * 
 * 注意：默认使用本地包，不需要启用 CDN
 */

// 阿里云 NPM 镜像（推荐，国内最快）⭐
export const ALIYUN_CDN = 'https://npm.elemecdn.com';

// 腾讯云 NPM 镜像
export const TENCENT_CDN = 'https://mirrors.cloud.tencent.com/npm';

// UNPKG（国际通用）
export const UNPKG_CDN = 'https://unpkg.com';

// jsDelivr（不推荐，国内慢）
export const JSDELIVR_CDN = 'https://cdn.jsdelivr.net';

// Monaco Editor 版本（需与 package.json 中的 @monaco-editor/react 版本匹配）
export const MONACO_VERSION = '0.44.0';

/**
 * 获取 Monaco Editor CDN URL
 * @param {string} cdnProvider - CDN 提供商
 * @returns {string} CDN URL
 */
export function getMonacoEditorCdnUrl(cdnProvider = 'aliyun') {
  const cdnMap = {
    aliyun: ALIYUN_CDN,
    tencent: TENCENT_CDN,
    unpkg: UNPKG_CDN,
    jsdelivr: JSDELIVR_CDN,
  };
  
  const baseUrl = cdnMap[cdnProvider] || ALIYUN_CDN;
  return `${baseUrl}/monaco-editor@${MONACO_VERSION}/min/vs`;
}

/**
 * 测试 CDN 速度
 * @param {string} url - CDN URL
 * @returns {Promise<number>} 响应时间（毫秒）
 */
export async function testCdnSpeed(url) {
  const start = performance.now();
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    const end = performance.now();
    return Math.round(end - start);
  } catch (error) {
    return Infinity;
  }
}

/**
 * 自动选择最快的 CDN
 * @returns {Promise<string>} 最快的 CDN URL
 */
export async function getFastestCdn() {
  const providers = ['aliyun', 'tencent', 'unpkg'];
  const speeds = await Promise.all(
    providers.map(provider => 
      testCdnSpeed(getMonacoEditorCdnUrl(provider))
    )
  );
  
  const fastestIndex = speeds.indexOf(Math.min(...speeds));
  return providers[fastestIndex];
}

// 示例：在 vite.config.ts 中使用
// import { getMonacoEditorCdnUrl } from './cdn.config.js';
// 
// export default defineConfig({
//   define: {
//     'process.env.MONACO_EDITOR_CDN': JSON.stringify(getMonacoEditorCdnUrl('aliyun'))
//   }
// })
