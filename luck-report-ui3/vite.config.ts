import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite 配置
 * 迁移自原 vue.config.js：保留了 devServer proxy、publicPath、@ alias、langchain chunk 拆分
 *
 * 入口 HTML 放在项目根 index.html，由 Vite 的 transformIndexHtml 处理 base 注入。
 * 访问 http://localhost:<port>/<VITE_PUBLIC_PATH> 即可进入应用。
 */
export default defineConfig(({ mode }) => {
  // 第三参数传空字符串 '' 表示不限制前缀（白名单为「空字符串」会匹配所有变量），
  // 这样 `port=8081` 这类无前缀变量也能被读取
  const env = loadEnv(mode, process.cwd(), '')

  // 取 base 路径（如 '/luck-report/'）
  const base = env.VITE_PUBLIC_PATH || '/'

  return {
    plugins: [vue()],
    base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: Number(env.port) || 3000,
      host: '0.0.0.0',
      proxy: {
        '^/api': {
          target: env.VITE_API_BASE_URL,
          rewrite: (path) => path.replace(/^\/api/, '/report'),
          ws: true,
          changeOrigin: true
        }
      },
      open: false
    },
    build: {
      // 与 webpack outDir 保持一致：dist/<mode>
      outDir: `dist/${mode === 'prod' ? 'prod' : 'dev'}`,
      assetsDir: 'assets',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // 将 langchain 拆出为独立 chunk，避免主包膨胀
          manualChunks(id) {
            if (id.includes('node_modules/@langchain/')) {
              return 'langchain'
            }
          }
        }
      },
      // 提升对大库的 warn 阈值
      chunkSizeWarningLimit: 2000
    },
    // 兼容浏览器侧流式 API：Vite 不内置 polyfill，按需引入
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'ant-design-vue',
        'marked',
        'dompurify',
        'highlight.js',
        // handsontable 内部引用 @babel/polyfill，提前预构建避免 onResolve 错误
        '@babel/polyfill'
      ]
    },
    css: {
      devSourcemap: true
    }
  }
})
