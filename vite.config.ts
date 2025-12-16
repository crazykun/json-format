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
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭 sourcemap
    rollupOptions: {
      output: {
        // 分割 chunks
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react'],
          'lodash': ['lodash-es'],
        }
      }
    }
  },
  // 优化预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@monaco-editor/react']
  }
})