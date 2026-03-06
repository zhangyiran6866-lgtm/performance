import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 81, // 端口号
      host: '0.0.0.0',
      open: env.VITE_OPEN === 'true', // 运行 npm run dev 时自动打开浏览器
      // 由于后端服务已经支持服务端跨域，此处不再需要本地反向代理配置
      // proxy: {
      //   '/admin-api': {
      //     target: env.VITE_API_TARGET_URL || 'http://192.168.10.108',
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/admin-api/, ''),
      //   },
      // },
    },
  };
});

