<template>
  <a-modal
    :title="t('dialog.open.title')"
    :width="800"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="open-dialog-content">
      <a-form :label-col="{ style: { width: '80px' } }" label-align="left">
        <a-form-item :label="t('dialog.open.source')" class="property-label">
          <a-select
            v-model:value="selectedProvider"
            @change="handleProviderChange"
            style="width: 200px"
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

        <a-form-item :label="t('dialog.save.currentPath')" class="property-label">
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
            <a-button v-if="canGoBack" @click="goBack" type="primary" size="small">
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
                <th><span>{{ t('dialog.open.fileName') }}</span></th>
                <th style="width:200px;"><span>{{ t('dialog.open.modDate') }}</span></th>
                <th style="width:80px;"><span>{{ t('dialog.open.operator') }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, index) in currentFiles" :key="index" style="height: 35px;">
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
                <td><span>{{ formatDate(file.updateDate, 'yyyy-MM-dd HH:mm:ss') }}</span></td>
                <td>
                  <a-button
                    type="link"
                    :title="t('dialog.open.open')"
                    @click="openFile(file)"
                  >
                    <template #icon><i class="iconfont icon-open"></i></template>
                  </a-button>
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
      <a-button @click="handleClose" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * OpenDialog 打开报表弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → loadProviders 拉取报表目录
 * 2. 切换 provider / 目录 → 更新 currentFiles
 * 3. 点击文件 / 目录 → openFile / handleFileClick
 * 4. 删除文件 → deleteReportFile
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/USelect/UOption/UButton（自定义）→ a-modal/a-form/a-select/a-select-option/a-button
 * - v-loading 自定义指令 → a-spin
 * - mapGetters / Vuex → useReportStore
 * - 父组件传入 visible 子组件 emit('update:visible', ...) → 通过 v-model:visible 由父级统一管理
 */
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/table'
import { showAlert, showConfirm } from '@/utils/comnon'
import {
  loadReportProviders,
  loadReportProvidersByPath,
  deleteReportFile
} from '@/api/designer'
import { useI18n } from 'vue-i18n'
import { getRequestToken } from '@/utils/token'

defineOptions({ name: 'OpenDialog' })

/** 报表文件元数据 */
interface ReportFileItem {
  name: string
  path: string
  directory: boolean
  updateDate?: string | number | Date
}

/** 报表提供者元数据 */
interface ReportProvider {
  prefix: string
  name: string
  reportFiles?: ReportFileItem[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{ visible: boolean }>(),
  { visible: false }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const { t } = useI18n()

/** 当前选中的 provider 前缀 */
const selectedProvider = ref<string>('')

/** 报表提供者列表 */
const providers = ref<ReportProvider[]>([])

/** 缓存各 provider / 路径下的报表文件，避免重复请求 */
const reportFilesData = ref<Record<string, ReportFileItem[]>>({})

/** 当前展示的文件列表 */
const currentFiles = ref<ReportFileItem[]>([])

/** 当前路径（拼接形式） */
const currentPath = ref<string>('')

/** 路径历史栈，用于回退 */
const pathHistory = ref<string[]>([])

/** 列表加载状态（绑定 v-loading） */
const loading = ref<boolean>(false)

/** a-select 所需的 {value,label} 选项 */
const providerOptions = computed<{ value: string; label: string }[]>(() =>
  providers.value.map((p) => ({ value: p.prefix, label: p.name }))
)

/** 是否能返回上一级 */
const canGoBack = computed<boolean>(() => pathHistory.value.length > 0)

/** 当前路径分段（用于面包屑渲染） */
const pathSegments = computed<string[]>(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

/**
 * 弹窗打开时加载报表提供者
 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadProviders()
    }
  }
)

/**
 * 拉取所有 provider 的根目录文件
 */
function loadProviders(): void {
  loading.value = true
  loadReportProviders()
    .then((list: ReportProvider[]) => {
      providers.value = list || []
      // 把每个 provider 的 reportFiles 按 prefix 缓存
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
      console.error('Error loading providers:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.open.loadFail'))
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
        showAlert(t('dialog.open.loadFail'))
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
  if (!selectedProvider.value) {
    currentFiles.value = []
    return
  }
  const key = currentPath.value
    ? `${selectedProvider.value}:${currentPath.value}`
    : selectedProvider.value
  currentFiles.value = reportFilesData.value[key] || []
}

/** provider 切换时清空路径上下文 */
function handleProviderChange(): void {
  currentPath.value = ''
  pathHistory.value = []
  onProviderChange()
}

/**
 * 打开文件
 * - directory：进入子目录
 * - 普通文件：弹确认后跳转 ?filePath= + token 参数
 */
function openFile(file: ReportFileItem): void {
  if (file.directory) {
    pathHistory.value.push(currentPath.value)
    currentPath.value = file.path
    loadProvidersByPath(currentPath.value)
    return
  }

  showConfirm(`${t('dialog.open.openConfirm')}[${file.name}]？`).then(() => {
    const fullFile = selectedProvider.value + (file.path || file.name)
    // 从 sessionStorage 读取 token（iframe 嵌入场景下已由 captureTokenFromUrl 写入）
    const token = getRequestToken()
    // 先关闭弹窗
    handleClose()
    const tokenParam = token ? `&token=${token}` : ''
    window.location.replace('?filePath=' + fullFile + tokenParam)
  })
}

/** 表格行点击：仅目录需要展开 */
function handleFileClick(file: ReportFileItem): void {
  if (file.directory) {
    openFile(file)
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

/**
 * 面包屑点击：跳到指定段对应的路径
 * @param index -1 表示根目录
 */
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
  showConfirm(`${t('dialog.open.delConfirm')}` + file.name).then(() => {
    const fullFile = selectedProvider.value + (file.path || file.name)
    deleteReportFile(fullFile)
      .then(() => {
        currentFiles.value.splice(index, 1)
        const reportFiles = reportFilesData.value[selectedProvider.value]
        if (reportFiles) {
          const dataIndex = reportFiles.indexOf(file)
          if (dataIndex > -1) {
            reportFiles.splice(dataIndex, 1)
          }
        }
      })
      .catch((error: { msg?: string }) => {
        console.error('Error deleting file:', error)
        if (error.msg) {
          showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
        } else {
          showAlert(t('dialog.open.delFail'))
        }
      })
  })
}

/** 关闭弹窗，重置路径状态 */
function handleClose(): void {
  emit('update:visible', false)
  currentPath.value = ''
  pathHistory.value = []
}
</script>

<style scoped>
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
