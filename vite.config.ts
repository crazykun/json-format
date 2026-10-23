import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // esbuild 比 terser 快 5-10x，产物体积差异 <1%
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2020',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // 用函数式 manualChunks，让 monaco 相关的所有模块进同一个 chunk。
        // 原配置按包名切分时只写了 @monaco-editor/react（外壳），
        // 真正的 monaco-editor 实体反而被 rollup 自动拆散 → 碎片式并发请求。
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('monaco-editor')) return 'monaco-core'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor'
          }
          if (id.includes('zustand') || id.includes('use-sync-external-store')) return 'zustand'
          return 'vendor'
        },
        hoistTransitiveImports: false,
      },
    },
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
    // monaco 走本地打包，worker 依赖 esm 子路径，不做预构建
    exclude: ['@monaco-editor/react', 'monaco-editor'],
  },
  // 生产环境移除 console 和 debugger
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})