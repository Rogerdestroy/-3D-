import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 使用 process.cwd() 確保在不同環境下都能正確讀取環境變數
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      // 關鍵修正：設定為相對路徑，避免 Vercel 找不到資源
      base: './', 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // 確保構建時清空舊檔案
        emptyOutDir: true, 
      },
      define: {
        // 加入 || '' 防止變數未定義時報錯
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
