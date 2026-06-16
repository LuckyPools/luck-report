import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
// 关键点：
// 1) base：dev 用 '/'，production 用 './'，让打包后 chunk 在 Thymeleaf 嵌套页里以相对路径解析
// 2) build.outDir：直输出到后端 resources/html，目录固定，不读取后端 yml
// 3) build.rollupOptions.output.entryFileNames：固定为 assets/index.js，模板里直接写死，避免 hash 同步
// 4) server.proxy['/api']：与后端 luck-report.servletPrefix 对齐；当前默认值 'report'，改前缀时同步改这里
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // dev / preview 走绝对根路径，build 走相对路径（适配 Thymeleaf 嵌入）
  const base = mode === 'production' ? './' : '/'
  // 输出到后端 luck-report-web 模块的 resources/html
  const webResourcesHtml = fileURLToPath(
    new URL(
      '../luck-report-server/luck-report-web/src/main/resources/html',
      import.meta.url,
    ),
  )

  return {
    base,
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      outDir: webResourcesHtml,
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // 固定入口文件名，Thymeleaf 模板里直接写 th:src="@{/manage/assets/index.js}"
          entryFileNames: 'assets/index.js',
          chunkFileNames: 'assets/chunk-[name].js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
    server: {
      port: 8995,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8994',
          changeOrigin: true,
          // 与后端 luck-report.servletPrefix 对齐；改前缀时同步改这里
          rewrite: (path) => path.replace(/^\/api/, '/report')
        }
      }
    }
  }
})
