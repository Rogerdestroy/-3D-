import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 1. 關鍵修正：設定基礎路徑為相對路徑，解決 Vercel 找不到資源(黑畫面)的問題
      base: './', 

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [react()],

      // 2. 建議加入：明確指定打包輸出目錄
      build: {
        outDir: 'dist',
      },

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
