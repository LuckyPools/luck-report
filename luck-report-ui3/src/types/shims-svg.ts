/**
 * svg 资源模块声明
 *
 * 工作流程：
 * - CellRenderer 等模块用 `import icon from '@/assets/icons/xxx.svg'` 形式导入图标
 * - 实际加载交给 webpack 的 svg-loader（vue.config.js chainWebpack 中已配）
 * - 运行时拿到的就是文件 URL（字符串）
 * - 此处只补 TS 类型声明，避免 TS2307 报错
 */

declare module '*.svg' {
  /** webpack 处理后产出的资源 URL（dataURL 或 public path） */
  const src: string
  export default src
}
