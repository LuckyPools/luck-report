/**
 * Vue 单文件组件类型声明 shim
 * 说明：允许在 .ts 中 `import App from './App.vue'`，由 vue-loader 在编译期注入实际组件类型
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}
