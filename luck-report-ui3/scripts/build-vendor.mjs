/**
 * vendor 构建脚本
 * ----------------------------------------------------------------------
 * 目标：把 vite lib 配置 (vite.config.ts) external 列表中的 UI 依赖
 *       全部打成单个 IIFE，挂到 window 上（全局变量名与 vite.config.ts
 *       中 rollupOptions.output.globals 保持一致），输出到
 *       dist/luck-report-ui/vendor.js，与 lib UMD 一并塞进 jar。
 *
 * 为什么不直接用 vite 打 vendor：
 *   - vite lib 模式要求 entry 导出特定形状（具名 export），不适合"挂全局"
 *   - esbuild IIFE 一次成型，单文件，适合浏览器直接 <script> 加载
 *
 * esbuild 是 vite 的传递依赖，node_modules 中已存在，无需额外安装。
 *
 * 关键：必须把每个全局包成 ESM 兼容形态
 *   window[name] = { default: originalDefault, __esModule: true, ...namespace }
 * 否则 rollup UMD 内部对 default import 的 _interopDefault() 会失败：
 *   - 没标 __esModule 时 _interopDefault(global) 直接返回 global
 *   - 但 lib 里有 `import { Select, Button, ... } from 'ant-design-vue'` 这种具名导入
 *   - 具名导入的 rollup 实现是 global.Select，如果 vendor 只挂了 default（即 plugin 对象），
 *     global.Select 就是 undefined，于是出现 `Cannot read properties of undefined`
 *     之类的连锁报错（典型表现：访问 `Select.Option` 失败）。
 * ----------------------------------------------------------------------
 */
import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'

await mkdir('dist/luck-report-ui', { recursive: true })

await build({
  bundle: true,
  format: 'iife',
  globalName: '__VENDOR__',
  outfile: 'dist/luck-report-ui/vendor.js',
  platform: 'browser',
  target: ['es2018'],
  minify: true,
  legalComments: 'none',
  // 防止 vue / pinia 等运行时检测 process.env.NODE_ENV 报错
  define: {
    'process.env.NODE_ENV': '"production"',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  stdin: {
    contents: `
      import * as VueNS          from 'vue'
      import * as VueRouterNS    from 'vue-router'
      import * as PiniaNS        from 'pinia'
      import * as AntdNS         from 'ant-design-vue'
      import AntdDefault         from 'ant-design-vue'
      import axios               from 'axios'
      import * as AxiosNS        from 'axios'
      import * as AntdIconsNS    from '@ant-design/icons-vue'
      import * as VueI18nNS      from 'vue-i18n'
      import { marked }          from 'marked'
      import * as MarkedNS       from 'marked'
      import DOMPurify           from 'dompurify'
      import hljs                from 'highlight.js'
      import * as HljsNS         from 'highlight.js'

      // 把一个值包装成 ES Module 形态：
      //   - default  : 原始 default export（让 \`import X from 'pkg'\` 命中）
      //   - __esModule: true（让 rollup UMD 的 _interopDefault 走 .default 分支而不是 wrap）
      //   - ...rest  : 具名导出（让 \`import { Foo } from 'pkg'\` 命中）
      // 注意：对于 default 本身是个函数 / 类（如 axios / marked / hljs），
      // 不能用 Object.assign(fn, ...) 覆盖函数本身，而是把属性挂到函数对象上。
      function esm(defaultExport, namespace) {
        return Object.assign(
          typeof defaultExport === 'function' ? defaultExport : {},
          namespace || {},
          { default: defaultExport, __esModule: true }
        )
      }

      // ——— 默认形态：namespace 即 default 本身（vue / pinia / vue-router / vue-i18n） ———
      window.Vue       = esm(VueNS, VueNS)
      window.Pinia     = esm(PiniaNS, PiniaNS)
      window.VueRouter = esm(VueRouterNS, VueRouterNS)
      window.VueI18n   = esm(VueI18nNS, VueI18nNS)

      // ——— ant-design-vue：default 是 plugin，具名导出有 Select/Button/... ———
      window.antd = esm(AntdDefault, AntdNS)

      // ——— axios：default 是函数（带 create/interceptors/...），具名导出有 Axios/AxiosError ———
      window.axios = esm(axios, AxiosNS)

      // ——— @ant-design/icons-vue：具名导出是所有图标组件（CustomerServiceOutlined 等） ———
      window.antdIcons = esm(undefined, AntdIconsNS)

      // ——— marked：lib 用 \`import { Marked } from 'marked'\`（注意大小写：Marked 类） ———
      window.marked = esm(marked, MarkedNS)

      // ——— dompurify：default 是工厂函数，lib 用 default ———
      window.DOMPurify = DOMPurify

      // ——— highlight.js：default 是 namespace 本身（含 hljs.highlight 等） ———
      window.hljs = esm(hljs, HljsNS)
    `,
    resolveDir: process.cwd(),
    loader: 'ts'
  }
})

console.log('[vendor] built -> dist/luck-report-ui/vendor.js')
