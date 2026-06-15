<template>
  <a-modal
    :title="t('dialog.save.title')"
    :width="800"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="save-dialog-content">
      <a-form :label-col="{ style: { width: '90px' } }" :colon="false">
        <a-form-item :label="t('dialog.save.fileName')">
          <a-input
            v-model:value="fileName"
            ref="fileNameInput"
            style="width: 340px"
          />
        </a-form-item>

        <a-form-item :label="t('dialog.save.source')">
          <a-select
            v-model:value="selectedProvider"
            @change="handleProviderChange"
          >
            <a-select-option
              v-for="option in providerOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('dialog.save.currentPath')">
          <div class="path-content">
            <div class="path-breadcrumb">
              <span class="path-segment" @click="navigateToPath(-1)">/</span>
              <template v-for="(segment, index) in pathSegments" :key="'seg-' + index">
                <span class="path-segment" @click="navigateToPath(index)">
                  {{ segment }}
                </span>
                <span class="path-separator">/</span>
              </template>
            </div>
            <a-button
              v-if="canGoBack"
              @click="goBack"
              type="primary"
              size="small"
            >
              <template #icon><i class="iconfont icon-undo"></i></template>
              {{ t('dialog.save.backToParent') }}
            </a-button>
          </div>
        </a-form-item>
      </a-form>

      <div class="file-list-container table-wrapper">
        <a-spin :spinning="loading">
          <table class="table-container">
            <thead class="table-container-header">
              <tr>
                <th><span>{{ t('dialog.save.fileName') }}</span></th>
                <th style="width:200px;"><span>{{ t('dialog.save.modDate') }}</span></th>
                <th style="width:50px;"><span>{{ t('dialog.save.operator') }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, index) in currentReportFiles" :key="index" style="height: 35px;">
                <td>
                  <span
                    :class="{ 'folder-name': file.directory }"
                    @click="handleFileClick(file)"
                    :style="{ cursor: file.directory ? 'pointer' : 'default' }"
                  >
                    <i v-if="file.directory" class="iconfont icon-folder"></i>
                    {{ file.name }}
                  </span>
                </td>
                <td><span>{{ formatDateOf(file.updateDate) }}</span></td>
                <td class="table-container-btn">
                  <a-button
                    v-if="!file.directory"
                    type="link"
                    :title="t('dialog.open.del')"
                    style="color: red"
                    @click="deleteFile(file, index)"
                  >
                    <template #icon><i class="iconfont icon-delete"></i></template>
                  </a-button>
                </td>
              </tr>
            </tbody>
          </table>
        </a-spin>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleClose" type="primary" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
      <a-button type="primary" @click="handleSave">
        {{ t('dialog.save.save') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * SaveDialog 报表保存弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → loadReports 加载报表目录
 * 2. 切换 provider / 目录 → 更新 currentReportFiles
 * 3. 点击「保存」→ 校验文件名/重名 → saveReportFile
 * 4. 保存成功 → 更新 store.setIsSaved / setFileName → emit('save-after', fullFileName)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/USelect/UOption/UButton/UInput（自定义）→ a-modal/a-form/a-select/a-select-option/a-button/a-input
 * - v-loading 自定义指令 → a-spin
 * - mapGetters / Vuex → useReportStore
 * - $store.dispatch('report/X', y) → report.X(y)
 * - $emit → defineEmits
 * - beforeDestroy → onBeforeUnmount
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { formatDate, resetDirty, tableToXml } from '@/utils/table'
import { showAlert, showConfirm } from '@/utils/comnon'
import {
  saveReportFile,
  deleteReportFile,
  loadReportProviders,
  loadReportProvidersByPath
} from '@/api/designer'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'
import type { ReportContext } from '@/types/report-def'

defineOptions({ name: 'SaveDialog' })

/** 报表文件元数据 */
interface ReportFileItem {
  name: string
  path: string
  directory: boolean
  updateDate?: string | number | Date
  [key: string]: unknown
}

/** 报表提供者元数据 */
interface ReportProvider {
  prefix: string
  name: string
  reportFiles?: ReportFileItem[]
  [key: string]: unknown
}

/** 接口统一返回结构（可能直接是数组，也可能是 { data: [...] }） */
type ProvidersResponse = ReportProvider[] | { data?: ReportProvider[] } | null | undefined

const props = withDefaults(
  defineProps<{ visible: boolean }>(),
  { visible: false }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save-after', fullFile: string): void
}>()

const report = useReportStore()
const { t } = useI18n()

/** 文件名输入 */
const fileName = ref<string>('')

/** 当前选中的 provider 前缀 */
const selectedProvider = ref<string>('')

/** provider 列表 */
const providers = ref<ReportProvider[]>([])

/** 缓存各 provider / 路径下的报表文件 */
const reportFilesData = ref<Record<string, ReportFileItem[]>>({})

/** 当前展示的文件列表 */
const currentReportFiles = ref<ReportFileItem[]>([])

/** 当前 provider 前缀（用于删除等操作时拼接） */
const currentProviderPrefix = ref<string>('')

/** 当前路径 */
const currentPath = ref<string>('')

/** 路径历史栈 */
const pathHistory = ref<string[]>([])

/** 列表加载状态（v-loading） */
const loading = ref<boolean>(false)

/** a-select 所需的 {value,label} 选项 */
const providerOptions = computed<{ value: string; label: string }[]>(() =>
  providers.value.map((p) => ({ value: p.prefix, label: p.name }))
)

/** 是否能返回上一级 */
const canGoBack = computed<boolean>(() => pathHistory.value.length > 0)

/** 当前路径分段 */
const pathSegments = computed<string[]>(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

/** 当前报表上下文 */
const context = computed<ReportContext | null>(() => report.getContext)

/**
 * 弹窗打开时加载报表提供者列表
 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadReports()
    }
  }
)

/** 全局 ESC 关闭弹窗（与原实现对齐） */
function handleKeydown(e: KeyboardEvent): void {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/**
 * 把后端响应统一解析为 provider 数组
 */
function pickProviders(response: ProvidersResponse): ReportProvider[] | null {
  if (Array.isArray(response)) return response
  if (response && Array.isArray((response as { data?: ReportProvider[] }).data)) {
    return (response as { data: ReportProvider[] }).data
  }
  return null
}

/**
 * 拉取所有 provider
 */
function loadReports(): void {
  loading.value = true
  loadReportProviders()
    .then((response: ProvidersResponse) => {
      const list = pickProviders(response)
      if (!list) {
        showAlert(t('dialog.save.loadFail'))
        return
      }
      providers.value = list
      // 初始化报表文件数据
      for (const provider of providers.value) {
        const { reportFiles, prefix } = provider
        if (prefix) {
          reportFilesData.value[prefix] = reportFiles || []
        }
      }
      if (providers.value.length > 0) {
        selectedProvider.value = providers.value[0].prefix
        onProviderChange()
      }
    })
    .catch((error: { msg?: string }) => {
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.save.loadFail'))
      }
    })
    .finally(() => {
      loading.value = false
    })
}

/**
 * 拉取指定路径下的 provider 文件
 */
function loadProvidersByPath(path: string): void {
  loading.value = true
  loadReportProvidersByPath(path)
    .then((result: Record<string, { reportFiles: ReportFileItem[] }>) => {
      for (const prefix in result) {
        const providerData = result[prefix]
        reportFilesData.value[`${prefix}:${path}`] = providerData.reportFiles || []
      }
      onProviderChange()
    })
    .catch((error: { msg?: string }) => {
      console.error('Error loading providers by path:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.save.loadFail'))
      }
    })
    .finally(() => {
      loading.value = false
    })
}

/**
 * 根据 selectedProvider / currentPath 拉出当前展示的文件列表
 */
function onProviderChange(): void {
  if (!selectedProvider.value || selectedProvider.value === '') {
    currentReportFiles.value = []
    return
  }
  const key = currentPath.value
    ? `${selectedProvider.value}:${currentPath.value}`
    : selectedProvider.value
  currentReportFiles.value = reportFilesData.value[key] || []
  currentProviderPrefix.value = selectedProvider.value
}

/** provider 切换时清空路径上下文 */
function handleProviderChange(): void {
  currentPath.value = ''
  pathHistory.value = []
  onProviderChange()
}

/** 点击目录行：进入子目录 */
function handleFileClick(file: ReportFileItem): void {
  if (file.directory) {
    pathHistory.value.push(currentPath.value)
    currentPath.value = file.path
    loadProvidersByPath(currentPath.value)
  }
}

/** 返回上一级 */
function goBack(): void {
  if (pathHistory.value.length > 0) {
    currentPath.value = pathHistory.value.pop() || ''
    if (currentPath.value === '') {
      onProviderChange()
    } else {
      loadProvidersByPath(currentPath.value)
    }
  }
}

/** 面包屑点击：跳到指定段对应路径 */
function navigateToPath(index: number): void {
  if (index === -1) {
    currentPath.value = ''
    pathHistory.value = []
    onProviderChange()
    return
  }
  const segments = pathSegments.value.slice(0, index + 1)
  const newPath = segments.join('/')
  if (newPath !== currentPath.value) {
    currentPath.value = newPath
    pathHistory.value = []
    loadProvidersByPath(currentPath.value)
  }
}

/** 删除指定文件 */
function deleteFile(file: ReportFileItem, index: number): void {
  showConfirm(t('dialog.save.delConfirm') + file.name).then(() => {
    const fullFile = currentProviderPrefix.value + (file.path || file.name)
    deleteReportFile(fullFile)
      .then(() => {
        currentReportFiles.value.splice(index, 1)
        const reportFiles = reportFilesData.value[currentProviderPrefix.value]
        if (reportFiles) {
          const dataIndex = reportFiles.findIndex((f) => f.name === file.name)
          if (dataIndex > -1) {
            reportFiles.splice(dataIndex, 1)
          }
        }
      })
      .catch((error: { msg?: string }) => {
        console.error('删除文件失败:', error)
        if (error.msg) {
          showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
        } else {
          showAlert(t('dialog.save.delFail'))
        }
      })
  })
}

/** 格式化日期（透传 table.formatDate） */
function formatDateOf(date?: string | number | Date): string {
  return (formatDate as unknown as (d: unknown, fmt?: string) => string)(date, 'yyyy-MM-dd HH:mm:ss')
}

/**
 * 保存按钮：校验 → 序列化 → saveReportFile
 * - 同名文件拦截
 * - 成功后更新 store + emit('save-after')
 */
function handleSave(): void {
  if (fileName.value === '') {
    showAlert(t('dialog.save.nameTip'))
    return
  }

  if (!currentProviderPrefix.value || !currentReportFiles.value) {
    showAlert(t('dialog.save.locationTip'))
    return
  }

  for (const file of currentReportFiles.value) {
    if (!file.directory) {
      const fName = file.name
      const pos = fName.indexOf('.')
      const baseName = fName.substring(0, pos)
      if (baseName === fileName.value) {
        showAlert(
          t('dialog.save.file') + '[' + fileName.value + ']' + t('dialog.save.exist')
        )
        return
      }
    }
  }

  const filePath = currentPath.value
    ? currentPath.value + '/' + fileName.value
    : fileName.value
  const fullFileName = currentProviderPrefix.value + filePath + '.ureport.xml'
  const content = tableToXml(context.value)

  saveReportFile(fullFileName, content)
    .then(() => {
      report.setIsSaved(true)
      report.setFileName(fullFileName)
      resetDirty()
      showAlert(t('dialog.save.success')).then(() => {
        handleClose()
        emit('save-after', fullFileName)
      })
    })
    .catch((error: { msg?: string }) => {
      console.error('保存文件失败:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.save.fail'))
      }
    })
}

/** 关闭弹窗：清空表单字段（保留 300ms 缓冲避免动画中数据闪动） */
function handleClose(): void {
  emit('update:visible', false)
  setTimeout(() => {
    fileName.value = ''
    selectedProvider.value = ''
    currentReportFiles.value = []
    currentPath.value = ''
    pathHistory.value = []
  }, 300)
}
</script>

<style scoped>
.save-dialog-content {
  padding: 15px;
}
.file-list-container {
  height: 300px;
  overflow-y: auto;
}
.folder-name {
  color: #008ed3;
  font-weight: bold;
  cursor: pointer;
}
.folder-name:hover {
  text-decoration: underline;
}
.icon-folder {
  margin-right: 5px;
  color: #ffc107;
}
.path-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.path-breadcrumb {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.path-segment {
  cursor: pointer;
  color: #008ed3;
}
.path-segment:hover {
  text-decoration: underline;
}
.path-separator {
  margin: 0 4px;
  color: #999;
}
</style>
