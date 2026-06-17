/**
 * 产物发布脚本
 * ----------------------------------------------------------------------
 * 把 dist/luck-report-ui/ 下的浏览器可用产物拷贝到后端 resources：
 *   - vendor.js              IIFE，外部依赖全局
 *   - luck-report-ui.umd.js  lib UMD 主体
 *   - style.css              全部 CSS（含 antd reset + iconfont + 公共）
 *   - favicon.ico            图标
 *   - assets/**              iconfont 字体 / 图片等静态资源（如 lib 构建 emit 了）
 *
 * 浏览器不需要的产物（es / mjs chunk / source map）已过滤掉。
 *
 * 兜底：vite lib 模式有时不会 emit CSS 中 url() 引用的字体文件，
 * 这里再从 src/assets/css/iconfont/ 手动补一份 iconfont.* 到 lib/assets/。
 * ----------------------------------------------------------------------
 */
import { copyFile, mkdir, readdir, stat, rm } from 'node:fs/promises'
import { join, relative } from 'node:path'

const SRC = 'dist/luck-report-ui'
const DST = '../luck-report-server/luck-report-web/src/main/resources/html/lib'
const ICONFONT_SRC = 'src/assets/css/iconfont'

// 清空目标目录，避免历史产物残留
await rm(DST, { recursive: true, force: true })
await mkdir(DST, { recursive: true })

const ALLOW_TOP_FILES = new Set([
  'vendor.js',
  'luck-report-ui.umd.js',
  'style.css',
  'favicon.ico'
])

async function walk(dir, base = dir) {
  const out = []
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) {
      out.push(...(await walk(p, base)))
    } else {
      out.push({ abs: p, rel: relative(base, p).replaceAll('\\', '/') })
    }
  }
  return out
}

const files = await walk(SRC)
let count = 0
for (const { abs, rel } of files) {
  const top = rel.split('/')[0]
  const isTopFile = !rel.includes('/')
  if (isTopFile && !ALLOW_TOP_FILES.has(top)) {
    console.log(`[publish] skip  ${rel}`)
    continue
  }
  const target = join(DST, rel)
  await mkdir(join(target, '..'), { recursive: true })
  await copyFile(abs, target)
  console.log(`[publish] copy  ${rel}`)
  count++
}

// 兜底拷贝 iconfont 字体（如果 lib 构建没 emit）。
// 注意：src/assets/css/iconfont/iconfont.css 里的 url() 是相对路径
// (例如 url('iconfont.woff2')，对应 lib/style.css 同级目录)，
// 所以字体要直接放在 lib/ 根目录，而不是 lib/assets/。
try {
  const fonts = (await readdir(ICONFONT_SRC)).filter(f => /\.(ttf|woff2?|eot|svg)$/i.test(f))
  if (fonts.length) {
    for (const f of fonts) {
      await copyFile(join(ICONFONT_SRC, f), join(DST, f))
      console.log(`[publish] copy  ${f} (iconfont 兜底)`)
      count++
    }
  }
} catch {
  // 源目录不存在则忽略
}

console.log(`[publish] done, ${count} files -> ${DST}`)
