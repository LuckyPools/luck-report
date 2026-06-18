<template>
  <div class="search-box">
    <div class="tools-content">
      <SearchOutlined style="margin-left: 15px;" />
      <span class="title">{{ t('preview.searchBox.title') }}</span>
    </div>
    <div class="main">
      <div ref="searchFormRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 搜索表单渲染容器
 *
 * 改造要点：
 * 1. 由 Vue2 Options API + 自定义组件 改为 Vue3 <script setup> + TypeScript
 * 2. iconfont 搜索图标替换为 ant-design-vue 的 SearchOutlined
 * 3. renderTemplateToComponent 的实例句柄不再有 $emit；事件统一由全局 emitter 转发
 * 4. $destroy / formInstance 清理逻辑合并为 formInstance?.$destroy() + null 赋值
 */
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { SearchOutlined } from '@ant-design/icons-vue'
import { renderTemplateToComponent, type PreviewRenderInstance } from '@/views/report/preview/utils/render'
import { beautifierConf, deepClone } from '@/views/report/designer/search-form/utils'
import { cssStyle, makeUpHtml, vueScript, vueTemplate } from '@/views/report/designer/search-form/utils/html'
import { makeUpJs } from '@/views/report/designer/search-form/utils/js'
import { makeUpCss } from '@/views/report/designer/search-form/utils/css'
import beautifier from 'js-beautify'
import emitter from '@/utils/emitter'

/** 搜索表单配置（来自服务端 / 设计器） */
interface SearchFormConfigShape {
  fields?: unknown[]
  formConf?: unknown
  [key: string]: unknown
}

const props = defineProps<{
  searchFormConfig: SearchFormConfigShape | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'submit', formData: Record<string, unknown>): void
}>()

/** 渲染出的动态表单实例句柄（用于 unmount） */
const formInstance = ref<PreviewRenderInstance | null>(null)
/** 容器 DOM 引用 */
const searchFormRef = ref<HTMLElement | null>(null)
/** 提交事件处理函数引用，便于在 unmount 时移除监听 */
let submitHandler: ((payload?: unknown) => void) | null = null

/**
 * 将动态生成的 form 字符串渲染为组件挂载到 searchFormRef 容器中
 * 组件内部通过 this.$emit('on-submit', data) 提交数据，由 emitter 转发
 * @param searchFormConfig 表单配置
 */
function init(searchFormConfig: SearchFormConfigShape): void {
  console.log('[search-box init] 入参 searchFormConfig:', searchFormConfig)
  console.log('[search-box init] searchFormConfig.fields:', searchFormConfig?.fields)
  destroyFormInstance()
  if (!searchFormRef.value) {
    console.error('[search-box init] searchFormRef.value 为空，终止渲染')
    return
  }
  console.log('[search-box init] searchFormRef.value:', searchFormRef.value)

  const generateType = 'file'
  const script = vueScript(makeUpJs(searchFormConfig as never, generateType))
  const html = vueTemplate(makeUpHtml(searchFormConfig as never, generateType))
  const css = cssStyle(makeUpCss(searchFormConfig))
  console.log('[search-box init] 生成 script 长度:', script?.length, '前 200 字符:', script?.slice(0, 200))
  console.log('[search-box init] 生成 html 长度:', html?.length, '前 200 字符:', html?.slice(0, 200))
  console.log('[search-box init] 生成 css 长度:', css?.length)
  const formJs = beautifier.html(html + script + css, beautifierConf.html)
  console.log('[search-box init] formJs 长度:', formJs?.length)
  console.log('[search-box init] formJs 前 500 字符:', formJs?.slice(0, 500))

  formInstance.value = renderTemplateToComponent(formJs, searchFormRef.value)
  console.log('[search-box init] formInstance:', formInstance.value)
  // 在 formInstance 创建之后再注册 emitter 监听，与实例生命周期对齐，
  // 避免在父组件 v-if 反复挂载时出现重复监听
  registerSubmitHandler()
}

/** 注册 emitter 监听：仅注册一次 */
function registerSubmitHandler(): void {
  if (submitHandler) return
  submitHandler = (payload?: unknown) => handleSubmit(payload)
  emitter.on('search-form:on-submit', submitHandler)
}

/** 卸载 emitter 监听 */
function unregisterSubmitHandler(): void {
  if (!submitHandler) return
  emitter.off('search-form:on-submit', submitHandler)
  submitHandler = null
}

/** 销毁当前 formInstance */
function destroyFormInstance(): void {
  if (formInstance.value) {
    formInstance.value.$destroy()
    formInstance.value = null
  }
}

/**
 * 接收 emitter 转发的 on-submit 事件，进行深拷贝后 emit 给父组件
 * @param formData 表单数据
 */
function handleSubmit(formData: unknown): void {
  const clonedData = deepClone(formData) as Record<string, unknown>
  emit('submit', clonedData)
}

watch(
  () => props.searchFormConfig,
  (newVal) => {
    if (newVal) {
      void nextTick(() => init(newVal))
    }
  },
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  unregisterSubmitHandler()
  destroyFormInstance()
})
</script>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.tools-content {
  border-bottom: solid 1px #ddd;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding: 0 7.5px;
  gap: 6px;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 14px;
}

.main {
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px 20px 10px;
}
</style>
