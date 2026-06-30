<template>
  <a-modal
    :title="t('dialog.save.title')"
    :width="800"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="save-dialog-content">
      <a-form :label-col="{ style: { width: '90px' } }" label-align="left">
        <a-form-item :label="t('dialog.save.fileName')" class="property-label">
          <a-input
            v-model:value="fileName"
            ref="fileNameInput"
            style="width: 340px"
          />
        </a-form-item>
      </a-form>

      <!-- 报表来源和当前路径已隐藏，默认使用第一个 provider，不支持目录导航 -->
      <div class="file-list-container table-wrapper" ref="scrollContainer" @scroll="throttledHandleScroll">
        <a-spin :spinning="loading && currentReportFiles.length === 0">
          <table class="table-container">
            <thead class="table-container-header">
              <tr>
                <th><span>{{ t('dialog.save.fileName') }}</span></th>
                <th style="width:200px;"><span>{{ t('dialog.save.modDate') }}</span></th>
                <th style="width:50px;"><span>{{ t('dialog.save.operator') }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(file, index) in currentReportFiles.filter(f => !f.directory)" :key="index" style="height: 35px;">
                <td>
                  <span>{{ file.name }}</span>
                </td>
                <td><span>{{ formatDateOf(file.updateDate) }}</span></td>
                <td class="table-container-btn">
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
        <div v-if="loading && currentReportFiles.length > 0" class="load-more-loading">
          <a-spin size="small" />
          <span class="load-more-text">加载中...</span>
        </div>
        <div v-else-if="!hasMore && currentReportFiles.length > 0" class="load-more-end">
          <span>没有更多了</span>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">
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
 * 1. visible=true → loadProviders 获取 provider → loadReportList 分页加载报表
 * 2. 滚动到底部 → loadMoreReportList 加载下一页
 * 3. 点击「保存」→ 校验文件名/重名 → saveReportFile
 * 4. 保存成功 → 更新 store.setIsSaved / setReportName → emit('save-after', fullFileName)
 *
 * 改造说明：
 * - 从一次性加载改为滚动分页加载（参考 ChatList.vue）
 * - 移除 loadReportFiles 一次性加载逻辑
 * - 添加分页状态：pageNum、pageSize、total、hasMore、loading
 * - 滚动事件监听和节流处理
 * - 自动补齐不足一屏的情况
 * - 删除文件后刷新列表（重置分页）
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { formatDate, resetDirty, tableToXml } from '@/utils/table'
import { showAlert, showConfirm } from '@/utils/comnon'
import {
  saveReportFile,
  deleteReportFile,
  loadReportProviders,
  queryDesignerReports,
  type ReportFileItemVO,
  type ReportProviderVO
} from '@/api/designer'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'
import type { ReportContext } from '@/types/report-def'

defineOptions({ name: 'SaveDialog' })

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

/** 当前展示的文件列表 */
const currentReportFiles = ref<ReportFileItem[]>([])

/** 当前 provider 前缀（用于删除等操作时拼接） */
const currentProviderPrefix = ref<string>('')

/** 列表加载状态 */
const loading = ref<boolean>(false)

/** 分页状态 */
const pageNum = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const hasMore = ref<boolean>(true)

/** 滚动容器引用 */
const scrollContainer = ref<HTMLElement | null>(null)

/** 当前报表上下文 */
const context = computed<ReportContext | null>(() => report.getContext)

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
 * 拉取 provider 列表并加载第一页报表
 */
async function loadProviders(): void {
  loading.value = true
  try {
    const result: ReportProviderVO[] = await loadReportProviders()
    providers.value = result || []
    if (providers.value.length > 0) {
      selectedProvider.value = providers.value[0].prefix
      currentProviderPrefix.value = selectedProvider.value
      await loadReportList()
      await nextTick()
      autoFillScrollable()
    }
  } catch (error: { msg?: string }) {
    console.error('Error loading providers:', error)
    if (error.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.save.loadFail'))
    }
  } finally {
    loading.value = false
  }
}

/**
 * 加载报表列表（分页）
 */
async function loadReportList(): void {
  if (!selectedProvider.value || selectedProvider.value === '') {
    currentReportFiles.value = []
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
      currentReportFiles.value = records
    } else {
      currentReportFiles.value.push(...records)
    }
    
    total.value = result.total || 0
    hasMore.value = currentReportFiles.value.length < total.value
  } catch (error: { msg?: string }) {
    console.error('Error loading report list:', error)
    if (error.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.save.loadFail'))
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
 * 删除指定文件
 * 删除后重置分页重新加载列表
 */
function deleteFile(file: ReportFileItem, index: number): void {
  showConfirm(t('dialog.save.delConfirm') + file.name).then(async () => {
    const fullFile = currentProviderPrefix.value + (file.path || file.name)
    try {
      await deleteReportFile(fullFile)
      // 重置分页重新加载
      await resetAndReload()
    } catch (error: { msg?: string }) {
      console.error('删除文件失败:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('dialog.save.delFail'))
      }
    }
  })
}

/**
 * 重置分页并重新加载列表
 */
async function resetAndReload(): void {
  pageNum.value = 1
  currentReportFiles.value = []
  total.value = 0
  hasMore.value = true
  await loadReportList()
  await nextTick()
  autoFillScrollable()
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

  if (!currentProviderPrefix.value) {
    showAlert(t('dialog.save.locationTip'))
    return
  }

  // 检查同名文件（仅检查当前已加载的文件，因分页可能不完整，后端会再次校验）
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

  const filePath = currentProviderPrefix.value + fileName.value
  const content = tableToXml(context.value)

  saveReportFile(fileName.value, filePath, content)
    .then(() => {
      report.setIsSaved(true)
      report.setReportName(fileName.value)
      report.setFilePath(filePath)
      resetDirty()
      showAlert(t('dialog.save.success')).then(() => {
        handleClose()
        emit('save-after', filePath)
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

/** 关闭弹窗：清空表单字段并重置状态（保留 300ms 缓冲避免动画中数据闪动） */
function handleClose(): void {
  emit('update:visible', false)
  setTimeout(() => {
    fileName.value = ''
    selectedProvider.value = ''
    currentReportFiles.value = []
    currentProviderPrefix.value = ''
    pageNum.value = 1
    total.value = 0
    hasMore.value = true
  }, 300)
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