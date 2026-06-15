/**
 * Babel 配置
 * 说明：
 * - 默认沿用 Vue CLI 5 提供的 babel preset，开启 @babel/preset-env 等基础能力
 * - 由于项目已升级为 TypeScript，通过 @vue/cli-plugin-typescript 自动注入
 *   @babel/preset-typescript 即可在打包阶段转译 .ts/.tsx 文件
 * - 类型检查由 fork-ts-checker-webpack-plugin 在独立进程执行（仅做编译期校验，不影响运行）
 */
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ]
}
