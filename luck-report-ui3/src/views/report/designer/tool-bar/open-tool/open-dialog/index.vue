<template>
  <a-modal
    :title="t('dialog.open.title')"
    :width="800"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="open-dialog-content">
      <!-- 报表来源和当前路径已隐藏，默认使用第一个 provider，不支持目录导航 -->
      <div class="file-list-container table-wrapper" ref="scrollContainer" @scroll="throttledHandleScroll">
        <a-spin :spinning="loading && currentFiles.length === 0">
          <table class="table-container">
            <thead class="table-container-header">
              <tr>
                <th><span>{{ t('dialog.open.fileName') }}</span></th>
                <th style="width:200px;"><span>{{ t('dialog.open.modDate') }}</span></th>
                <th style="width:80px;"><span>{{ t('dialog.open.operator') }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, index) in currentFiles.filter(f => !f.directory)" :key="index" style="height: 35px;">
                <td>
                  <span>{{ file.name }}</span>
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

        <!-- 底部加载状态 -->
        <div v-if="loading && currentFiles.length > 0" class="load-more-loading">
          <a-spin size="small" />
          <span class="load-more-text">加载中...</span>
        </div>
        <div v-else-if="!hasMore && currentFiles.length > 0" class="load-more-end">
          <span>没有更多了</span>
        </div>
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
 * 1. visible=true → loadProviders 获取 provider → loadReportList 分页加载报表
 * 2. 滚动到底部 → loadMoreReportList 加载下一页
 * 3. 点击文件 → openFile
 * 4. 删除文件 → deleteFile → resetAndReload 重置分页重新加载
 *
 * 改造说明：
 * - 从一次性加载改为滚动分页加载（参考 ChatList.vue）
 * - 移除 loadReportFiles 一次性加载逻辑
 * - 添加分页状态：pageNum、pageSize、total、hasMore、loading
 * - 滚动事件监听和节流处理
 * - 自动补齐不足一屏的情况
 */
import { ref, watch, nextTick } from 'vue'
import { formatDate } from '@/utils/table'
import { showAlert, showConfirm } from '@/utils/comnon'
import {
  loadReportProviders,
  queryDesignerReports,
  deleteReportFile,
  type ReportFileItemVO,
  type ReportProviderVO
} from '@/api/designer'
import { useI18n } from 'vue-i18n'
import { getRequestToken } from '@/utils/token'

defineOptions({ name: 'OpenDialog' })

/** 报表文件元数据（后端 ReportFile 对齐） */
type ReportFileItem = ReportFileItemVO

/** 报表提供者元数据（与后端 ReportProviderVo 对齐） */
type ReportProvider = ReportProviderVO

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

/** 当前展示的文件列表 */
const currentFiles = ref<ReportFileItem[]>([])

/** 列表加载状态 */
const loading = ref<boolean>(false)

/** 分页状态 */
const pageNum = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const hasMore = ref<boolean>(true)

/** 滚动容器引用 */
const scrollContainer = ref<HTMLElement | null>(null)

/**
 * 弹窗打开时加载报表提供者并初始化列表
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
 * 拉取 provider 列表并加载第一页报表
 */
async function loadProviders(): void {
  loading.value = true
  try {
    const result: ReportProviderVO[] = await loadReportProviders()
    providers.value = result || []
    if (providers.value.length > 0) {
      selectedProvider.value = providers.value[0].prefix
      await loadReportList()
      await nextTick()
      autoFillScrollable()
    }
  } catch (error: { msg?: string }) {
    console.error('Error loading providers:', error)
    if (error.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.open.loadFail'))
    }
  } finally {
    loading.value = false
  }
}

/**
 * 加载报表列表（分页）
 */
async function loadReportList(): void {
  if (!selectedProvider.value) {
    currentFiles.value = []
    return
  }

  loading.value = true
  try {
    const result = await queryDesignerReports({
      provider: selectedProvider.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    
    const records = result.records || []
    if (pageNum.value === 1) {
      currentFiles.value = records
    } else {
      currentFiles.value.push(...records)
    }
    
    total.value = result.total || 0
    hasMore.value = currentFiles.value.length < total.value
  } catch (error: { msg?: string }) {
    console.error('Error loading report list:', error)
    if (error.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.open.loadFail'))
    }
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多报表（下一页）
 */
async function loadMoreReportList(): void {
  if (loading.value || !hasMore.value) return
  
  pageNum.value++
  await loadReportList()
}

/**
 * 滚动事件处理（节流）
 * 仅当列表实际可滚动（scrollHeight > clientHeight）且用户已滚动到底部附近时，
 * 才触发加载更多。
 */
const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return

  // 内容不足一屏时直接返回：这种情况由 autoFillScrollable 处理
  if (el.scrollHeight <= el.clientHeight) return

  // 距底部 50px 内才触发
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
    loadMoreReportList()
  }
}

/** 节流：100ms 内只处理一次滚动事件，避免重复触发加载 */
let scrollTimer: ReturnType<typeof setTimeout> | null = null
const throttledHandleScroll = () => {
  if (scrollTimer) return
  scrollTimer = setTimeout(() => {
    handleScroll()
    scrollTimer = null
  }, 100)
}

/** 自动补齐的最大页数（防止极端情况下连续加载过多） */
const AUTO_FILL_MAX_PAGES = 10

/**
 * 自动加载后续分页，直到列表内容溢出可滚动，或没有更多数据，或达到页数上限
 * 解决"10 条不够一屏 → 没有滚动条 → 滚动事件永远不触发"的问题
 */
const autoFillScrollable = async () => {
  const el = scrollContainer.value
  if (!el) return

  for (let i = 0; i < AUTO_FILL_MAX_PAGES; i++) {
    if (!hasMore.value || loading.value) return
    // 内容已经溢出可滚动，停止补齐
    if (el.scrollHeight > el.clientHeight) return

    await loadMoreReportList()
    // 等待 DOM 更新
    await nextTick()
  }
}

/**
 * 打开文件
 * - directory：进入子目录（已隐藏，保留逻辑以备未来恢复）
 * - 普通文件：弹确认后跳转 ?filePath= + token 参数
 */
function openFile(file: ReportFileItem): void {
  if (file.directory) {
    // 已隐藏目录导航功能
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

/**
 * 删除指定文件
 * 删除后重置分页重新加载列表
 */
function deleteFile(file: ReportFileItem, index: number): void {
  showConfirm(`${t('dialog.open.delConfirm')}` + file.name).then(async () => {
    const fullFile = selectedProvider.value + (file.path || file.name)
    try {
      await deleteReportFile(fullFile)
      // 重置分页重新加载
      await resetAndReload()
    } catch (error: { msg?: string }) {
      console.error('Error deleting file:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.open.delFail'))
      }
    }
  })
}

/**
 * 重置分页并重新加载列表
 */
async function resetAndReload(): void {
  pageNum.value = 1
  currentFiles.value = []
  total.value = 0
  hasMore.value = true
  await loadReportList()
  await nextTick()
  autoFillScrollable()
}

/** 关闭弹窗，重置状态 */
function handleClose(): void {
  emit('update:visible', false)
  pageNum.value = 1
  currentFiles.value = []
  total.value = 0
  hasMore.value = true
  selectedProvider.value = ''
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

/* 底部加载状态 */
.load-more-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  color: #9ca3af;
  font-size: 12px;
}

.load-more-text {
  font-size: 12px;
}

.load-more-end {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  color: #d1d5db;
  font-size: 12px;
}
</style>