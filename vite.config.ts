import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import { getMonacoEditorCdnUrl } from './cdn.config.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭 sourcemap
    minify: 'terser', // 使用 terser 进行 JS 压缩
    cssMinify: true, // CSS 压缩
    rollupOptions: {
      output: {
        // 分割 chunks
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react'],
          'lodash': ['lodash-es'],
          'react-vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
        }
      }
    },
    // 启用 brotli/gzip 压缩
    reportCompressedSize: true,
  },
  // 优化预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@monaco-editor/react', 'tailwindcss']
  },
  // 生产环境移除 console 和 debugger
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // Monaco Editor CDN 配置（可选）
  // 如果本地加载慢，可以启用以下配置使用国内 CDN
  // 取消注释下面的配置即可使用阿里云 CDN
  /*
  define: {
    'process.env.MONACO_EDITOR_CDN': JSON.stringify(getMonacoEditorCdnUrl('aliyun'))
  },
  */
})