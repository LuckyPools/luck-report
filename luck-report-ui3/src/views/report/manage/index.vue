<template>
  <div class="manage-page">
    <main class="main-content">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">报表管理</h1>
          <p class="content-subtitle">查看、创建、编辑、预览与删除报表</p>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-section">
        <a-card :bordered="true">
          <div class="action-content">
            <div class="search-box">
              <a-input
                  v-model:value="searchKeyword"
                  placeholder="请输入报表名称搜索"
                  style="width: 280px"
                  allow-clear
                  @clear="handleSearch"
                  @press-enter="handleSearch"
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
            </div>
            <div class="action-buttons">
              <a-button type="primary" @click="openCreateDialog">
                <template #icon><PlusOutlined /></template>
                新建报表
              </a-button>
              <a-button @click="loadReports">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
              <a-select
                v-model:value="selectedProvider"
                placeholder="选择报表来源"
                style="width: 180px"
                :loading="providerLoading"
                @change="handleProviderFilterChange"
              >
                <a-select-option
                  v-for="p in providers"
                  :key="p.prefix"
                  :value="p.prefix"
                >
                  {{ p.name }}
                </a-select-option>
              </a-select>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 卡片区域 -->
      <div class="card-section" v-if="!loading">
        <a-card :bordered="true">
          <div v-if="reportList.length > 0" class="card-grid">
            <div
              v-for="item in reportList"
              :key="item.filePath"
              class="report-card"
            >
              <div class="report-card__cover" @click="openEdit(item)">
                <div class="report-card__window-bar">
                  <span class="dot dot--red"></span>
                  <span class="dot dot--green"></span>
                </div>
                <div class="report-card__preview">
                  <div class="preview-dashboard">
                    <div class="preview-dashboard__chart preview-dashboard__chart--1"></div>
                    <div class="preview-dashboard__chart preview-dashboard__chart--2"></div>
                    <div class="preview-dashboard__map"></div>
                    <div class="preview-dashboard__chart preview-dashboard__chart--3"></div>
                  </div>
                </div>
                <div class="report-card__pagination">
                  <span
                    v-for="i in 8"
                    :key="i"
                    class="report-card__page-dot"
                    :class="{ 'is-active': i === 1 }"
                  ></span>
                </div>
              </div>
              <div class="report-card__body">
                <a-tooltip :title="item.fileName">
                  <span class="report-card__name">{{ item.fileName }}</span>
                </a-tooltip>
                <a-tooltip title="编辑">
                  <a-button
                    type="text"
                    size="small"
                    class="report-card__btn"
                    @click="openEdit(item)"
                  >
                    <template #icon><ArrowRightOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-dropdown :trigger="['click']">
                  <a-button
                    type="text"
                    size="small"
                    class="report-card__btn"
                  >
                    <template #icon><MoreOutlined /></template>
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="preview" @click="openPreview(item)">
                        <EyeOutlined /> 预览
                      </a-menu-item>
                      <a-menu-item key="edit" @click="openEdit(item)">
                        <EditOutlined /> 编辑
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger @click="handleDelete(item)">
                        <DeleteOutlined /> 删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </div>
          </div>

          <a-empty
            v-else
            description="暂无报表"
            class="empty-state"
          >
            <a-button type="primary" @click="openCreateDialog">
              <template #icon><PlusOutlined /></template>
              新建报表
            </a-button>
          </a-empty>

          <!-- 底部分页 -->
          <div v-if="total > 0" class="card-footer">
            <span class="card-footer__total">共 {{ total }} 条</span>
            <a-pagination
              v-model:current="pageNum"
              v-model:pageSize="pageSize"
              :total="total"
              :page-size-options="['10', '20', '50']"
              :show-size-changer="true"
              :show-quick-jumper="true"
              size="small"
              @change="loadReports"
            />
          </div>
        </a-card>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 新建报表弹窗 -->
    <a-modal
      v-model:open="createDialogVisible"
      title="新建报表"
      width="500px"
      :confirm-loading="createLoading"
      :okText="t('common.confirm')"
      :cancelText="t('common.cancel')"
      @ok="handleCreate"
      @cancel="createDialogVisible = false"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="报表来源" name="provider">
          <a-select
            v-model:value="createForm.provider"
            placeholder="请选择报表来源"
            :loading="providerLoading"
          >
            <a-select-option
              v-for="p in providers"
              :key="p.prefix"
              :value="p.prefix"
            >
              {{ p.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="报表名称" name="fileName">
          <a-input
            v-model:value="createForm.fileName"
            placeholder="请输入报表名称（不含后缀）"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 报表管理页面
 *
 * 功能：
 * 1. 列表查看：分页加载指定 provider 下的报表（卡片视图）
 * 2. 搜索：按报表名称模糊查询
 * 3. 新建：填写名称后跳转至设计器（新标签页）
 * 4. 编辑：直接跳转至设计器（新标签页）
 * 5. 预览：跳转至预览页面（新标签页）
 * 6. 删除：调用后端接口删除
 */
import { ref, reactive, onMounted, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  MoreOutlined
} from '@ant-design/icons-vue'
import {
  Button as AButton,
  Card as ACard,
  Dropdown as ADropdown,
  Empty as AEmpty,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Menu as AMenu,
  MenuItem as AMenuItem,
  MenuDivider as AMenuDivider,
  Modal as AModal,
  Pagination as APagination,
  Select as ASelect,
  SelectOption as ASelectOption,
  Spin as ASpin,
  Tooltip as ATooltip
} from 'ant-design-vue'
import {
  loadReportProviders,
  queryReports,
  deleteReport,
  createReport,
  type ReportFileVO,
  type ReportProviderVO
} from '@/api/manage'
import { getRequestToken } from '@/utils/token'
import {t} from "@/locales";

defineOptions({ name: 'ManageReports' })

/** 状态变量 */
const loading = ref(false)
const providerLoading = ref(false)
const reportList = ref<ReportFileVO[]>([])
const providers = ref<ReportProviderVO[]>([])
const selectedProvider = ref<string>('')
const searchKeyword = ref('')

/** 分页 */
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 新建弹窗 */
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive<{ provider: string; fileName: string }>({
  provider: '',
  fileName: ''
})

/**
 * 表单校验规则
 */
const createFormRules = {
  provider: [{ required: true, message: '请选择报表来源', trigger: 'change' }],
  fileName: [
    { required: true, message: '请输入报表名称', trigger: 'blur' },
    { max: 100, message: '名称长度不能超过 100', trigger: 'blur' }
  ]
}

/**
 * 加载报表来源
 *
 * 注：utils/request.ts 已自动解包 ResultVO.data，
 * 所以 loadReportProviders() 直接返回 ReportProviderVO[] 数组。
 */
const loadProviders = async (): Promise<void> => {
  providerLoading.value = true
  try {
    const providersData = await loadReportProviders()
    providers.value = providersData
    if (!selectedProvider.value && providersData.length > 0) {
      selectedProvider.value = providersData[0].prefix
      createForm.provider = providersData[0].prefix
    }
  } catch (e: any) {
    console.error('Failed to load providers:', e)
    message.error(e?.message || '加载报表来源失败')
  } finally {
    providerLoading.value = false
  }
}

/**
 * 加载报表列表
 */
const loadReports = async (): Promise<void> => {
  if (!selectedProvider.value) {
    reportList.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const pageData = await queryReports({
      provider: selectedProvider.value,
      reportName: searchKeyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    // 过滤目录，只保留报表文件
    reportList.value = (pageData.records || []).filter(r => !r.isDirectory)
    total.value = pageData.total
  } catch (e: any) {
    console.error('Failed to load reports:', e)
    message.error(e?.message || '加载报表列表失败')
    reportList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 处理搜索
 */
const handleSearch = (): void => {
  pageNum.value = 1
  loadReports()
}

/**
 * 顶部 provider 过滤切换：重置分页并加载列表
 */
const handleProviderFilterChange = (): void => {
  pageNum.value = 1
  loadReports()
}

/**
 * 构造新标签页 URL
 * - 与 open-tool/open-dialog 中 `?reportPath=` + encodeURI(encodeURI(file)) 行为保持一致
 * - reportPath 已经被 buildEncodedReportPath 做过双层编码，直接拼到 URL 即可，
 *   浏览器解析时会把 %25 还原为 %，得到单层编码后的真实值
 * - target: 'designer'（默认）打开设计器；'preview' 打开预览页（不再附加 mode 参数）
 * - 自动从 sessionStorage 读取 token 并拼接到 URL，确保设计器/预览页能正常访问后端接口
 */
function buildReportUrl(encodedPath: string, target: 'designer' | 'preview' = 'designer'): string {
  const search = `reportPath=${encodedPath}`
  const base = (import.meta.env.VITE_PUBLIC_PATH || '/') as string
  const origin = window.location.origin
  // 从 sessionStorage 读取 token（iframe 嵌入场景下已由 captureTokenFromUrl 写入）
  const token = getRequestToken()
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ''
  return `${origin}${base.replace(/\/?$/, '/')}report/${target}?${search}${tokenParam}`
}

/**
 * 拼接 filePath 中冒号后的内容再进行双层编码
 * - 原始 filePath 形如 file:新vue3.ureport.xml
 * - 目标 query 值形如 file:%25E6%2596%25B0vue3.ureport.xml
 */
function buildEncodedReportPath(filePath: string): string {
  const colonIdx = filePath.indexOf(':')
  if (colonIdx < 0) {
    return encodeURI(encodeURI(filePath))
  }
  const prefix = filePath.substring(0, colonIdx + 1) // "file:"
  const body = filePath.substring(colonIdx + 1)
  return prefix + encodeURI(encodeURI(body))
}

/**
 * 打开编辑（设计器）
 */
const openEdit = (item: ReportFileVO): void => {
  const encoded = buildEncodedReportPath(item.filePath)
  const url = buildReportUrl(encoded)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 打开预览
 */
const openPreview = (item: ReportFileVO): void => {
  const encoded = buildEncodedReportPath(item.filePath)
  const url = buildReportUrl(encoded, 'preview')
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 打开新建弹窗
 */
const openCreateDialog = (): void => {
  createForm.provider = selectedProvider.value || (providers.value[0]?.prefix ?? '')
  createForm.fileName = ''
  createDialogVisible.value = true
  setTimeout(() => {
    createFormRef.value?.clearValidate()
  }, 0)
}

/**
 * 提交新建：
 * 1. 先调用后端 createReport 接口，基于空白模板在指定 provider 下创建报表文件
 *    （否则直接打开设计器会因为报表文件不存在而报错）
 * 2. 创建成功后，再在新标签页打开设计器加载该报表
 */
const handleCreate = async (): Promise<void> => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
    createLoading.value = true

    let fileName = createForm.fileName.trim()
    if (!fileName.toLowerCase().endsWith('.ureport.xml')) {
      fileName = fileName + '.ureport.xml'
    }
    const provider = createForm.provider
    const filePath = provider + fileName

    // 先调用后端创建空报表文件
    await createReport(fileName, provider)

    // 创建成功后在新标签页打开设计器
    const encoded = buildEncodedReportPath(filePath)
    const url = buildReportUrl(encoded)
    createDialogVisible.value = false
    window.open(url, '_blank', 'noopener,noreferrer')
    message.success('已创建报表并打开设计器，保存后请刷新本页面')
  } catch (e: any) {
    if (e?.message) {
      message.error(e.message)
    } else {
      console.warn('Form validation failed or create cancelled:', e)
    }
  } finally {
    createLoading.value = false
  }
}

/**
 * 删除报表
 */
const handleDelete = (item: ReportFileVO): void => {
  Modal.confirm({
    title: '删除确认',
    content: `确定要删除报表 "${item.fileName}" 吗？此操作不可恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteReport(item.filePath)
        message.success('删除成功')
        // 若当前页删完，自动回到上一页
        if (reportList.value.length <= 1 && pageNum.value > 1) {
          pageNum.value -= 1
        }
        await loadReports()
      } catch (e: any) {
        console.error('Failed to delete report:', e)
        message.error(e?.message || '删除失败')
      }
    }
  })
}

/** provider 变化时自动重新加载 */
watch(selectedProvider, (val) => {
  if (val) {
    pageNum.value = 1
    loadReports()
  }
})

/** 页面挂载时初始化 */
onMounted(async () => {
  await loadProviders()
  if (selectedProvider.value) {
    await loadReports()
  }
})
</script>

<style scoped>
.manage-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

.content-header {
  margin-bottom: 24px;
}

.content-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
}

.content-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.action-section {
  margin-bottom: 16px;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
}

.card-section {
  margin-bottom: 24px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.card-footer__total {
  color: #666;
  font-size: 14px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 4px 0;
}

.report-card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
  cursor: default;
  display: flex;
  flex-direction: column;
}

.report-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: #c0c4cc;
}

/* ========== 卡片封面 ========== */
.report-card__cover {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

/* 顶部 macOS 风格按钮条 */
.report-card__window-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot--red {
  background: #ff5f56;
}
.dot--green {
  background: #27c93f;
}

/* 仪表盘预览区域 */
.report-card__preview {
  height: 130px;
  padding: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.preview-dashboard {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  border-radius: 3px;
  overflow: hidden;
  background: linear-gradient(135deg, #0f1d3a 0%, #1e3a6f 100%);
  padding: 4px;
}

.preview-dashboard__chart {
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.preview-dashboard__chart--1 {
  grid-row: 1;
  grid-column: 1;
  background:
    linear-gradient(180deg, transparent 60%, rgba(64, 158, 255, 0.4) 60%, rgba(64, 158, 255, 0.4) 70%, transparent 70%),
    linear-gradient(180deg, transparent 30%, rgba(82, 196, 26, 0.5) 30%, rgba(82, 196, 26, 0.5) 45%, transparent 45%),
    linear-gradient(180deg, transparent 50%, rgba(245, 154, 35, 0.45) 50%, rgba(245, 154, 35, 0.45) 80%, transparent 80%);
}
.preview-dashboard__chart--2 {
  grid-row: 1;
  grid-column: 2;
  background:
    radial-gradient(circle at 30% 60%, rgba(64, 158, 255, 0.5) 0%, transparent 35%),
    radial-gradient(circle at 70% 40%, rgba(82, 196, 26, 0.4) 0%, transparent 30%),
    radial-gradient(circle at 50% 80%, rgba(245, 154, 35, 0.4) 0%, transparent 30%);
}
.preview-dashboard__map {
  grid-row: 1 / span 2;
  grid-column: 3;
  background:
    radial-gradient(ellipse at center, rgba(82, 196, 26, 0.5) 0%, transparent 60%),
    radial-gradient(circle at 30% 40%, rgba(64, 158, 255, 0.4) 0%, transparent 25%),
    radial-gradient(circle at 60% 60%, rgba(82, 196, 26, 0.3) 0%, transparent 25%),
    linear-gradient(135deg, #1e3a6f 0%, #0f1d3a 100%);
  border-radius: 2px;
}
.preview-dashboard__chart--3 {
  grid-row: 2;
  grid-column: 1 / span 2;
  background:
    linear-gradient(90deg, transparent 0%, rgba(64, 158, 255, 0.5) 30%, transparent 30%, transparent 40%, rgba(82, 196, 26, 0.4) 40%, transparent 40%),
    linear-gradient(90deg, transparent 50%, rgba(245, 154, 35, 0.4) 50%, transparent 50%, transparent 65%, rgba(64, 158, 255, 0.4) 65%);
}

/* 分页指示点 */
.report-card__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.report-card__page-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #dcdfe6;
  transition: background 0.2s;
}
.report-card__page-dot.is-active {
  background: #409eff;
}

/* ========== 卡片底部 ========== */
.report-card__body {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: #fff;
  gap: 6px;
  min-height: 44px;
}

.report-card__name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.report-card__btn {
  flex-shrink: 0;
  padding: 0 4px !important;
  min-width: 24px !important;
  height: 24px !important;
  color: #909399 !important;
}
.report-card__btn:hover:not(:disabled) {
  color: #409eff !important;
  background: #f5f7fa !important;
}
.report-card__btn:disabled {
  cursor: default;
}

.loading-state {
  text-align: center;
  padding: 48px;
}

.empty-state {
  padding: 48px 0;
}
</style>
