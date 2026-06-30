<template>
  <div class="role-page">
    <main class="main-content">
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">角色报表授权</h1>
          <p class="content-subtitle">为第三方系统角色配置可访问的报表（角色由第三方系统提供，本页面仅维护绑定关系）</p>
        </div>
      </div>

      <div class="action-section">
        <a-card :bordered="true">
          <div class="action-content">
            <div class="search-box">
              <a-input
                v-model:value="searchKey"
                placeholder="搜索角色名/编码"
                allow-clear
                style="width: 280px"
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
            </div>
            <div class="action-buttons">
              <a-button @click="loadRoles">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
            </div>
          </div>
        </a-card>
      </div>

      <div class="role-table" v-if="!loading">
        <a-card :bordered="true">
          <a-table
            :columns="columns"
            :data-source="filteredRoles"
            row-key="code"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openAuthDialog(record)">授权报表</a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>

      <div v-if="!loading && filteredRoles.length === 0" class="empty-state">
        <a-empty description="暂无角色数据" />
      </div>

      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 授权报表弹窗 -->
    <a-modal
      v-model:open="authDialogVisible"
      title="授权报表"
      width="900px"
      :okText="t('common.confirm')"
      :cancelText="t('common.cancel')"
      :confirmLoading="saving"
      @ok="handleSave"
      @cancel="handleAuthCancel"
    >
      <a-form layout="vertical">
        <a-descriptions title="角色信息" :column="1" bordered size="small" style="margin-bottom: 16px">
          <a-descriptions-item label="角色名称">{{ currentRole?.name }}</a-descriptions-item>
          <a-descriptions-item label="角色编码">{{ currentRole?.code }}</a-descriptions-item>
        </a-descriptions>

        <a-form-item>
          <a-checkbox v-model:checked="allReportsChecked" @change="onAllReportsChange">
            全部报表（勾选后该角色可访问所有来源下的所有报表）
          </a-checkbox>
        </a-form-item>

        <a-transfer
          v-model:target-keys="targetKeys"
          :data-source="transferDataSource"
          :render="item => item.title"
          :list-style="{ width: '380px', height: '400px' }"
          :disabled="allReportsChecked"
          :titles="['未授权报表', '已授权报表']"
          show-search
          :filter-option="filterReport"
          :pagination="{ pageSize: 50, simple: true }"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import {
  Button as AButton,
  Card as ACard,
  Table as ATable,
  Tag as ATag,
  Modal as AModal,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Checkbox as ACheckbox,
  Transfer as ATransfer,
  Spin as ASpin,
  Empty as AEmpty,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem
} from 'ant-design-vue'
import {
  listRole,
  getRoleBindings,
  listAllReportsForTransfer,
  saveRoleBindings,
  type RoleInfo,
  type RoleBindingDTO,
  type ReportFile
} from '@/api/role'
import { loadReportProviders, type ReportProviderVO } from '@/api/designer'
import { t } from '@/locales'

const loading = ref(true)
const saving = ref(false)
const searchKey = ref('')
const roles = ref<RoleInfo[]>([])
const authDialogVisible = ref(false)
const currentRole = ref<RoleInfo | null>(null)

const providerOptions = ref<{ label: string; value: string }[]>([])
const currentProvider = ref<string>('')
const reports = ref<ReportFile[]>([])
const targetKeys = ref<string[]>([])
const allReportsChecked = ref(false)

const columns = [
  { title: '角色编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '角色名', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const }
]

const filteredRoles = computed(() => {
  const keyword = searchKey.value.trim().toLowerCase()
  if (!keyword) return roles.value
  return roles.value.filter(r =>
    r.code.toLowerCase().includes(keyword) ||
    (r.name && r.name.toLowerCase().includes(keyword))
  )
})

const loadRoles = async () => {
  loading.value = true
  try {
    roles.value = await listRole()
  } catch {
    message.error('获取角色列表失败')
    roles.value = []
  } finally {
    loading.value = false
  }
}

const loadProviders = async () => {
  try {
    const list: ReportProviderVO[] = await loadReportProviders()
    const enabledProviders = list.filter(p => !p.disabled)
    providerOptions.value = enabledProviders.map(p => ({ label: p.name, value: p.prefix }))
    // 自动设置第一个 provider
    if (enabledProviders.length > 0) {
      currentProvider.value = enabledProviders[0].prefix
    }
  } catch {
    message.error('获取报表来源失败')
  }
}

const onProviderChange = async (provider: string) => {
  currentProvider.value = provider
  if (!currentRole.value) return
  const [allReports, bindings] = await Promise.all([
    listAllReportsForTransfer(provider).catch(() => [] as ReportFile[]),
    getRoleBindings(currentRole.value.code, provider).catch(() => ({ filePaths: [], hasAll: false }))
  ])
  reports.value = allReports
  targetKeys.value = bindings.filePaths
  allReportsChecked.value = bindings.hasAll
}

const onAllReportsChange = (e: any) => {
  if (e.target.checked) targetKeys.value = []
}

// 穿梭框数据源：key 需拼接 provider 前缀，与绑定表 file_path 格式一致
const transferDataSource = computed(() =>
  reports.value.map(r => ({
    key: currentProvider.value + r.path,
    title: r.name || r.path  // name 为空时用 path 兜底
  }))
)

const filterReport = (inputValue: string, item: { key: string; title: string }) =>
  item.title.toLowerCase().includes(inputValue.toLowerCase())

const openAuthDialog = async (record: RoleInfo) => {
  currentRole.value = record
  authDialogVisible.value = true
  await loadProviders()
  if (currentProvider.value) await onProviderChange(currentProvider.value)
}

const handleAuthCancel = () => {
  authDialogVisible.value = false
  currentRole.value = null
  targetKeys.value = []
  allReportsChecked.value = false
  reports.value = []
  currentProvider.value = ''
}

const handleSave = async () => {
  if (!currentRole.value || !currentProvider.value) return
  saving.value = true
  try {
    const dto: RoleBindingDTO = {
      roleCode: currentRole.value.code,
      roleName: currentRole.value.name,
      provider: currentProvider.value,
      filePaths: targetKeys.value,
      hasAll: allReportsChecked.value,
      operator: 'admin'
    }
    await saveRoleBindings(dto)
    message.success('保存成功')
    authDialogVisible.value = false
    handleAuthCancel()
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadRoles)
</script>

<style scoped>
.role-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
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
  margin-bottom: 8px;
}

.content-subtitle {
  font-size: 14px;
  color: #666;
}

.action-section {
  margin-bottom: 24px;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.role-table {
  margin-bottom: 24px;
}

.loading-state {
  text-align: center;
  padding: 48px;
}

.empty-state {
  text-align: center;
  padding: 48px;
}
</style>