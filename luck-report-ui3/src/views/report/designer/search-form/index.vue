<template>
  <div class="container">
    <div class="left-board">
      <div class="logo-wrapper">
        <div class="logo">
          <img :src="logo" alt="logo"> Form Generator
        </div>
      </div>
      <div class="left-scrollbar">
        <div class="components-list">
          <div class="components-title">
            {{ t('searchForm.inputComponents') }}
          </div>
          <VueDraggable
            v-model="inputComponents"
            class="components-draggable"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @start="onStart"
            @add="onAdd"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in inputComponents"
              :key="index"
              class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                {{ element.label }}
              </div>
            </div>
          </VueDraggable>
          <div class="components-title">
            {{ t('searchForm.selectComponents') }}
          </div>
          <VueDraggable
            v-model="selectComponents"
            class="components-draggable"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @start="onStart"
            @add="onAdd"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in selectComponents"
              :key="index"
              class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                {{ element.label }}
              </div>
            </div>
          </VueDraggable>
          <div class="components-title">
            {{ t('searchForm.layoutComponents') }}
          </div>
          <VueDraggable
            v-model="layoutComponents"
            class="components-draggable"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @start="onStart"
            @add="onAdd"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in layoutComponents"
              :key="index"
              class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                {{ element.label }}
              </div>
            </div>
          </VueDraggable>
        </div>
      </div>
    </div>

    <div class="center-board">
      <div class="action-bar">
        <a-button type="text" @click="download">
          <i class="iconfont icon-cloud-download" />
          {{ t('searchForm.exportVueFile') }}
        </a-button>
        <a-button class="copy-btn-main" type="text" @click="copy">
          <i class="iconfont icon-copy" />
          {{ t('searchForm.copyCode') }}
        </a-button>
        <a-button class="delete-btn" type="text" @click="empty">
          <i class="iconfont icon-delete" />
          {{ t('searchForm.clear') }}
        </a-button>
      </div>
      <div class="center-scrollbar">
        <a-row class="center-board-row" :gutter="formConf.gutter">
          <a-form
            :size="formSize"
            :label-position="formConf.labelPosition"
            :disabled="formConf.disabled"
            :label-width="formConf.labelWidth"
          >
            <VueDraggable
              v-model="drawingList"
              :animation="340"
              group="componentsGroup"
              class="drawing-board"
              @start="onStart"
              @add="onAdd"
              @end="onEnd"
            >
              <draggable-item
                v-for="(element, index) in drawingList"
                :key="element.renderKey"
                :drawing-list="drawingList"
                :element="element"
                :index="index"
                :active-id="activeId"
                :form-conf="formConf"
                @active-item="activeFormItem"
                @copy-item="drawingItemCopy"
                @delete-item="drawingItemDelete"
              />
            </VueDraggable>
            <div v-show="!drawingList.length" class="empty-info">
              {{ t('searchForm.dragComponents') }}
            </div>
          </a-form>
        </a-row>
      </div>
    </div>

    <right-panel
      :active-data="activeData"
      :form-conf="formConf"
      :show-field="!!drawingList.length"
      @tag-change="tagChange"
    />

    <code-type-dialog
      v-model:visible="dialogVisible"
      :title="t('searchForm.generateType')"
      :show-file-name="showFileName"
      @confirm="generate"
    />
    <input id="copyNode" type="hidden">
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import beautifier from 'js-beautify'
import ClipboardJS from 'clipboard'
import { VueDraggable } from 'vue-draggable-plus'

import RightPanel from './right-panel/index.vue'
import CodeTypeDialog from './code-type-dialog/index.vue'
import DraggableItem from './draggable-item/index.vue'

import {
  inputComponents as inputComponentsSrc,
  selectComponents as selectComponentsSrc,
  layoutComponents as layoutComponentsSrc,
  formConf as formConfSrc
} from './utils/config'
import { beautifierConf } from './utils'
import { makeUpHtml, vueTemplate, vueScript, cssStyle } from './utils/html'
import { makeUpJs } from './utils/js'
import { makeUpCss } from './utils/css'
import {
  drawingDefaultValue,
  initDrawingDefaultValue,
  cleanDrawingDefaultValue
} from './utils/drawingDefault'
import { showAlert, showConfirm, deepCopy } from '@/utils/comnon'
import logo from '@/assets/images/form-designer/logo.png'

import type { FormField, FormConf } from './utils/types'

// —— 顶层 ref 状态 ——
// 注意：先初始化默认值，再创建 ref（vue2 中是 beforeCreate 调用）
initDrawingDefaultValue()

const idGlobal = ref(100)
const formConf = reactive<FormConf>(deepCopy(formConfSrc))
const inputComponents = ref<FormField[]>(deepCopy(inputComponentsSrc))
const selectComponents = ref<FormField[]>(deepCopy(selectComponentsSrc))
const layoutComponents = ref<FormField[]>(deepCopy(layoutComponentsSrc))
const drawingList = ref<FormField[]>(deepCopy(drawingDefaultValue))
const activeId = ref<number>(drawingDefaultValue[0]?.formId ?? 0)
const activeData = ref<FormField>(deepCopy(drawingDefaultValue[0] ?? ({} as FormField)))
const dialogVisible = ref(false)
const showFileName = ref(false)
const operationType = ref<'download' | 'copy' | 'run' | ''>('')
const formData = reactive<{ fields?: FormField[] } & FormConf>({
  formRef: formConfSrc.formRef,
  formModel: formConfSrc.formModel,
  formRules: formConfSrc.formRules,
  size: formConfSrc.size,
  labelPosition: formConfSrc.labelPosition,
  labelWidth: formConfSrc.labelWidth,
  gutter: formConfSrc.gutter,
  disabled: formConfSrc.disabled,
  span: formConfSrc.span,
  formBtns: formConfSrc.formBtns
})
const generateConf = ref<{ type: 'file' | 'dialog'; fileName?: string } | null>(null)

let oldActiveId = 0
let tempActiveData: FormField | null = null
let clipboard: ClipboardJS | null = null

interface Props {
  searchFormConfig?: { fields?: FormField[] } & Partial<FormConf>
}
const props = withDefaults(defineProps<Props>(), { searchFormConfig: () => ({}) as never })

// created：防止 firefox 下拖拽打开新选项卡
if (typeof document !== 'undefined') {
  document.body.ondrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
}

watch(activeId, (val) => {
  oldActiveId = val
}, { immediate: true })

watch(
  () => props.searchFormConfig,
  (val) => {
    // 仅在传入的 searchFormConfig 包含有效内容时才覆盖（避免默认空对象把初始示例擦掉）
    if (!val || (val.fields === undefined && Object.keys(val).length === 0)) return
    const { fields, ...rest } = val
    // 同步 formConf 字段：先删旧 key，再写入新 key，保证 rest 中未出现的 key 不会残留
    const restCopy = deepCopy(rest) as Partial<FormConf>
    Object.keys(formConf).forEach(key => {
      if (!(key in restCopy)) {
        delete (formConf as Record<string, unknown>)[key]
      }
    })
    Object.assign(formConf, restCopy)
    drawingList.value = deepCopy(fields || [])
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  clipboard = new ClipboardJS('#copyNode', {
    text: () => {
      const codeStr = generateCode()
      showAlert(t('searchForm.codeCopied') as string)
      return codeStr
    }
  })
  clipboard.on('error', () => {
    showAlert(t('searchForm.codeCopyFailed') as string)
  })
})

onBeforeUnmount(() => {
  clipboard?.destroy()
})

// 国际化
const { t } = useI18n()

// ant-design-vue Form size 映射：medium -> middle, mini -> small
const formSize = computed(() => {
  const s = formConf.size
  if (s === 'mini') return 'small'
  if (s === 'medium') return 'middle'
  return s
})

function activeFormItem(element: FormField) {
  activeData.value = element
  activeId.value = element.formId
}

function onEnd(obj: any) {
  // 【DEBUG】拖拽结束事件
  console.log('[search-form][onEnd]', {
    from: obj.from,
    to: obj.to,
    from_list_kind: obj.from?.classList?.contains('components-draggable') ? 'left-board' : (obj.from?.classList?.contains('drawing-board') ? 'center-board' : 'unknown'),
    to_list_kind: obj.to?.classList?.contains('components-draggable') ? 'left-board' : (obj.to?.classList?.contains('drawing-board') ? 'center-board' : 'unknown'),
    oldIndex: obj.oldIndex,
    newIndex: obj.newIndex,
    oldDraggableIndex: obj.oldDraggableIndex,
    newDraggableIndex: obj.newDraggableIndex,
    item: obj.item?.outerHTML?.slice(0, 80),
    drawingListLen: drawingList.value.length,
    drawingList: JSON.parse(JSON.stringify(drawingList.value.map((item: FormField) => ({ formId: item.formId, label: item.label }))))
  })
  // 只在跨列表拖拽时才把新克隆的元素置为激活项，
  // 画布内排序时 vue-draggable-plus 也会调用 clone 函数，tempActiveData 会被赋值，
  // 此时不应把 activeData 错误地更新为 tempActiveData
  if (obj.from !== obj.to && tempActiveData) {
    activeData.value = tempActiveData
    activeId.value = idGlobal.value
  }
}

function onAdd(obj: any) {
  console.log('[search-form][onAdd]', {
    from: obj.from,
    to: obj.to,
    newIndex: obj.newIndex,
    item: obj.item?.outerHTML?.slice(0, 80)
  })
}

function onStart(obj: any) {
  console.log('[search-form][onStart]', {
    from: obj.from
  })
}

function addComponent(item: FormField) {
  const clone = cloneComponent(item)
  drawingList.value.push(clone)
  activeFormItem(clone)
}

function cloneComponent(origin: FormField): FormField {
  const clone: FormField = JSON.parse(JSON.stringify(origin))
  clone.formId = ++idGlobal.value
  clone.span = formConf.span
  // 改变 renderKey 后可强制刷新组件（与原版一致）
  clone.renderKey = +new Date()
  if (!clone.layout) clone.layout = 'colFormItem'
  if (clone.layout === 'colFormItem') {
    clone.vModel = `field${idGlobal.value}`
    if (clone.placeholder !== undefined) clone.placeholder += clone.label
    tempActiveData = clone
  } else if (clone.layout === 'rowFormItem') {
    delete clone.label
    clone.componentName = `row${idGlobal.value}`
    clone.gutter = formConf.gutter
    // 给 rowFormItem 也设置 __key，保证 right-panel 中 a-tree(node-key="__key") 能定位到该节点
    clone.__key = `a-row-${idGlobal.value}-${clone.renderKey}`
    tempActiveData = clone
  }
  return tempActiveData as FormField
}

function assembleFormData() {
  formData.fields = JSON.parse(JSON.stringify(drawingList.value))
  Object.assign(formData, formConf)
}

function generate(data: { type: 'file' | 'dialog'; fileName?: string }) {
  generateConf.value = data
  switch (operationType.value) {
    case 'download':
      execDownload(data)
      break
    case 'copy':
      execCopy()
      break
    case 'run':
      execRun()
      break
    default:
      break
  }
}

function execRun() {
  assembleFormData()
  // drawerVisible：vue2 中是抽屉打开；vue3 暂保留占位
  // drawerVisible.value = true
}

function execDownload(data: { fileName?: string }) {
  const codeStr = generateCode()
  const blob = new Blob([codeStr], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = data.fileName || 'search-form.vue'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function execCopy() {
  document.getElementById('copyNode')?.click()
}

function empty() {
  showConfirm(t('searchForm.confirmClear') as string, { type: 'warning' }).then(() => {
    drawingList.value = []
    cleanDrawingDefaultValue()
  })
}

function drawingItemCopy(item: FormField, parent?: FormField[]) {
  let clone = JSON.parse(JSON.stringify(item)) as FormField
  clone = createIdAndKey(clone)
  ;(parent || drawingList.value).push(clone)
  activeFormItem(clone)
}

function createIdAndKey(item: FormField): FormField {
  item.formId = ++idGlobal.value
  // 同步刷新 renderKey，强制 v-for 重建组件（v-for 的 :key 用的是 renderKey）
  item.renderKey = +new Date()
  item.__key = `${item.__key || item.tag}-${idGlobal.value}-${item.renderKey}`
  if (item.layout === 'colFormItem') {
    item.vModel = `field${idGlobal.value}`
  } else if (item.layout === 'rowFormItem') {
    item.componentName = `row${idGlobal.value}`
  }
  if (Array.isArray(item.children)) {
    item.children = item.children.map(childItem => createIdAndKey(childItem))
  }
  return item
}

function drawingItemDelete(index: number, parent: FormField[]) {
  parent.splice(index, 1)
  setTimeout(() => {
    const len = drawingList.value.length
    if (len) activeFormItem(drawingList.value[len - 1])
  }, 0)
}

function generateCode(): string {
  const { type } = generateConf.value || { type: 'file' as const }
  assembleFormData()
  const script = vueScript(makeUpJs(formData, type))
  const html = vueTemplate(makeUpHtml(formData, type))
  const css = cssStyle(makeUpCss(formData))
  return beautifier.html(html + script + css, beautifierConf.html)
}

function download() {
  dialogVisible.value = true
  showFileName.value = true
  operationType.value = 'download'
}

function copy() {
  dialogVisible.value = true
  showFileName.value = false
  operationType.value = 'copy'
}

function tagChange(newTag: FormField) {
  const replaced: FormField = cloneComponent(newTag)
  replaced.vModel = activeData.value.vModel
  replaced.formId = activeId.value
  replaced.span = activeData.value.span
  // 副作用改在 replaced 上操作，避免在 drawingList 引用上 delete 引发中间态
  delete (replaced as Record<string, unknown>).tag
  delete (replaced as Record<string, unknown>).tagIcon
  delete (replaced as Record<string, unknown>).document
  Object.keys(replaced).forEach(key => {
    const oldVal = (activeData.value as Record<string, unknown>)[key]
    const newVal = (replaced as Record<string, unknown>)[key]
    if (oldVal !== undefined && typeof oldVal === typeof newVal) {
      ;(replaced as Record<string, unknown>)[key] = oldVal
    }
  })
  activeData.value = replaced
  updateDrawingList(replaced)
}

function updateDrawingList(newTag: FormField) {
  // 递归：drawingList 本身 + 任意深度的 children
  const targetId = activeId.value
  const findAndReplace = (list: FormField[]): boolean => {
    const idx = list.findIndex(item => item.formId === targetId)
    if (idx > -1) {
      list.splice(idx, 1, newTag)
      return true
    }
    for (const item of list) {
      if (Array.isArray(item.children) && findAndReplace(item.children)) {
        return true
      }
    }
    return false
  }
  findAndReplace(drawingList.value)
}
</script>

<style>
:root {
  --dialog-height: 560px;
}
.editor-tabs {
  background: #121315;
}

.center-tabs ul {
  width: 100%;
}
.center-tabs ul li {
  width: 50%;
  border: none !important;
  padding: 0.785em 0 !important;
  text-align: center;
}

.reg-item {
  padding: 12px 6px;
  background: #f8f8f8;
  position: relative;
  border-radius: 4px;
}
.reg-item .close-btn {
  position: absolute;
  right: -6px;
  top: -6px;
  display: block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  color: #fff;
  text-align: center;
  z-index: 1;
  cursor: pointer;
  font-size: 12px;
}
.reg-item + .reg-item {
  margin-top: 18px;
}
.action-bar i {
  font-size: 20px;
  vertical-align: middle;
  position: relative;
  top: -1px;
}

.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.components-list {
  padding: 8px;
  box-sizing: border-box;
  height: 100%;
}
.components-list .components-item {
  display: inline-block;
  width: 48%;
  margin: 1%;
  transition: transform 0ms !important;
}
.components-draggable {
  padding-bottom: 20px;
}
.components-title {
  font-size: 14px;
  color: #222;
  margin: 6px 2px;
}
.components-body {
  padding: 8px 10px;
  background: #f6f7ff;
  font-size: 12px;
  cursor: move;
  border: 1px dashed #f6f7ff;
  border-radius: 3px;
}
.components-body:hover {
  border: 1px dashed #787be8;
  color: #787be8;
}

.left-board {
  width: 260px;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
}
.left-scrollbar {
  height: var(--dialog-height);
  overflow: hidden;
}
.center-scrollbar {
  border-left: 1px solid #f1e8e8;
  border-right: 1px solid #f1e8e8;
  box-sizing: border-box;
}
.center-board {
  width: auto;
  margin: 0 350px 0 260px;
  box-sizing: border-box;
}
.empty-info {
  position: absolute;
  top: 46%;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  color: #ccb1ea;
  letter-spacing: 4px;
}
.action-bar {
  position: relative;
  height: 42px;
  text-align: right;
  padding: 0 15px;
  box-sizing: border-box;
  border: 1px solid #f1e8e8;
  border-top: none;
  border-left: none;
}
.action-bar .delete-btn {
  color: #f56c6c;
}
.logo-wrapper {
  position: relative;
  height: 42px;
  background: #fff;
  border-bottom: 1px solid #f1e8e8;
  box-sizing: border-box;
}
.logo {
  position: absolute;
  left: 12px;
  top: 6px;
  line-height: 30px;
  color: #00afff;
  font-weight: 600;
  font-size: 17px;
  white-space: nowrap;
}
.logo > img {
  width: 30px;
  height: 30px;
  vertical-align: top;
}

.center-board-row {
  padding: 12px 12px 15px 12px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.center-board-row > .ant-form {
  height: 100%;
  width: 100%;
}
.drawing-board {
  height: var(--dialog-height);
  overflow-y: scroll;
  overflow-x: hidden;
  position: relative;
  min-height: 200px;
}
.drawing-board .components-body {
  padding: 0;
  margin: 0;
  font-size: 0;
}
.drawing-board .sortable-ghost {
  position: relative;
  display: block;
  overflow: hidden;
}
.drawing-board .sortable-ghost::before {
  content: " ";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: rgb(89, 89, 223);
  z-index: 2;
}
.drawing-board .components-item.sortable-ghost {
  width: 100%;
  height: 60px;
  background-color: #f6f7ff;
}
.drawing-board .active-from-item > .ant-form-item {
  background: #f6f7ff;
  border-radius: 6px;
}
.drawing-board .active-from-item > .drawing-item-copy,
.drawing-board .active-from-item > .drawing-item-delete {
  display: initial;
}
.drawing-board .active-from-item > .component-name {
  color: #409eff;
}
.drawing-board .ant-form-item {
  margin-bottom: 15px;
}
.drag-item-wrapper {
  width: 100%;
}
.drawing-item {
  position: relative;
  cursor: move;
}
.drawing-item.unfocus-bordered:not(.active-from-item) > div:first-child {
  border: 1px dashed #ccc;
}
.drawing-item .ant-form-item {
  padding: 12px 10px;
}
.drawing-row-item {
  position: relative;
  cursor: move;
  box-sizing: border-box;
  border: 1px dashed #ccc;
  border-radius: 3px;
  padding: 0 2px;
  margin-bottom: 15px;
}
.drawing-row-item .drawing-row-item {
  margin-bottom: 2px;
}
.drawing-row-item .ant-col {
  margin-top: 22px;
}
.drawing-row-item .ant-form-item {
  margin-bottom: 0;
}
.drawing-row-item .drag-wrapper {
  min-height: 80px;
}
.drawing-row-item.active-from-item {
  border: 1px dashed #409eff;
}
.drawing-row-item .component-name {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 12px;
  color: #bbb;
  display: inline-block;
  padding: 0 6px;
}
.drawing-item:hover > .ant-form-item,
.drawing-row-item:hover > .ant-form-item {
  background: #f6f7ff;
  border-radius: 6px;
}
.drawing-item:hover > .drawing-item-copy,
.drawing-item:hover > .drawing-item-delete,
.drawing-row-item:hover > .drawing-item-copy,
.drawing-row-item:hover > .drawing-item-delete {
  display: initial;
}
.drawing-item > .drawing-item-copy,
.drawing-item > .drawing-item-delete,
.drawing-row-item > .drawing-item-copy,
.drawing-row-item > .drawing-item-delete {
  display: none;
  position: absolute;
  top: -10px;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  border: 1px solid;
  cursor: pointer;
  z-index: 1;
}
.drawing-item > .drawing-item-copy,
.drawing-row-item > .drawing-item-copy {
  right: 56px;
  border-color: #409eff;
  color: #409eff;
  background: #fff;
}
.drawing-item > .drawing-item-delete,
.drawing-row-item > .drawing-item-delete {
  right: 24px;
  border-color: #f56c6c;
  color: #f56c6c;
  background: #fff;
}
</style>
