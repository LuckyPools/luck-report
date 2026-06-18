import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * 支持两种构建模式（通过 --mode 切换）：
 * - SPA 模式（默认 / dev / prod）：输出到 ../luck-report-server/luck-report-web/src/main/resources/html/luck-report
 * - lib 模式（--mode lib）：输出 UMD + ES 包到 dist/luck-report-ui/，第三方依赖 external
 */
export default defineConfig(({ mode }) => {
  // 第三个参数 '' 表示读取所有变量（含无前缀的 port=8081）
  const env = loadEnv(mode, process.cwd(), '')

  const isLib = mode === 'lib'
  const base = isLib ? './' : env.VITE_PUBLIC_PATH || '/'

  return {
    plugins: [vue()],
    base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 运行时模板编译需要带 compiler 的版本（render.ts 中通过 new Function 动态渲染 template 字符串）
        vue: 'vue/dist/vue.esm-bundler.js'
      }
    },
    server: isLib
      ? undefined
      : {
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
    build: isLib ? buildLibOptions() : buildSpaOptions(),
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

function buildSpaOptions() {
  return {
    outDir: `../luck-report-server/luck-report-web/src/main/resources/html/luck-report`,
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // langchain 拆出独立 chunk，避免主包膨胀
        manualChunks(id: string) {
          if (id.includes('node_modules/@langchain/')) {
            return 'langchain'
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000
  } as const
}

function buildLibOptions() {
  return {
    outDir: 'dist/luck-report-ui',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/lib-entry.ts', import.meta.url)),
      name: 'LuckReport',
      formats: ['es', 'umd'] as ('es' | 'umd')[],
      fileName: (format: string) => `luck-report-ui.${format}.js`
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-router',
        'pinia',
        'ant-design-vue',
        'axios',
        '@ant-design/icons-vue',
        'vue-i18n',
        'marked',
        'dompurify',
        'highlight.js'
      ],
      output: {
        // UMD 模式下为 external 依赖提供全局变量名
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
          'ant-design-vue': 'antd',
          axios: 'axios',
          '@ant-design/icons-vue': 'antdIcons',
          'vue-i18n': 'VueI18n',
          marked: 'marked',
          dompurify: 'DOMPurify',
          'highlight.js': 'hljs'
        }
      }
    },
    chunkSizeWarningLimit: 2000
  } as const
}
