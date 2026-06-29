<template>
  <div class="datasource-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">数据源管理</h1>
          <p class="content-subtitle">管理数据源配置、表关系和逻辑外键，数据源构建的知识库供Agent调用</p>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-section">
        <a-card :bordered="true">
          <div class="action-content">
            <div class="search-box">
              <a-select
                  v-model:value="filterType"
                  placeholder="按类型筛选"
                  style="width: 160px"
                  allow-clear
                  @change="handleFilter"
              >
                <a-select-option v-for="t in datasourceTypes" :key="t.typeName" :value="t.typeName">
                  {{ t.displayName }}
                </a-select-option>
              </a-select>
              <a-select
                  v-model:value="filterStatus"
                  placeholder="按状态筛选"
                  style="width: 140px; margin-left: 12px"
                  allow-clear
                  @change="handleFilter"
              >
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </div>
            <div class="action-buttons">
              <a-button type="primary" @click="openCreateDialog">
                <template #icon><PlusOutlined /></template>
                添加数据源
              </a-button>
              <a-button @click="loadDatasourceList">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 表格区域 -->
      <div class="config-table" v-if="!loading">
        <a-card :bordered="true">
          <a-table
            :dataSource="datasourceList"
            :columns="columns"
            :rowKey="(record: Datasource) => record.id"
            :scroll="{ x: 1400, y: 500 }"
            :expandedRowKeys="expandedRowKeys"
            @expand="handleExpand"
            :pagination="{
              current: pageNum,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t: number) => `共 ${t} 条`
            }"
            @change="(pag: any, _filters: any, _sorter: any, extra: any) => { if (extra.action === 'paginate') { pageNum = pag.current; pageSize = pag.pageSize; loadDatasourceList() } }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'connectionUrl'">
                <a-tooltip :title="record.connectionUrl" placement="top">
                  {{ truncateText(record.connectionUrl || '-', 40) }}
                </a-tooltip>
              </template>
              <template v-if="column.key === 'testStatus'">
                <a-tag :color="record.testStatus === 'success' ? 'success' : record.testStatus === 'failed' ? 'error' : 'default'" >
                  {{ record.testStatus === 'success' ? '连接成功' : record.testStatus === 'failed' ? '连接失败' : '未知' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'active' ? 'success' : 'default'">
                  {{ record.status === 'active' ? '启用' : '禁用' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-buttons-cell">
                  <a-button type="link" size="small" @click="handleTestConnection(record)">
                    测试连接
                  </a-button>
                  <a-button
                    v-if="record.status === 'active'"
                    type="link"
                    size="small"
                    @click="handleToggleStatus(record, 'inactive')"
                  >
                    禁用
                  </a-button>
                  <a-button
                    v-else
                    type="link"
                    size="small"
                    @click="handleToggleStatus(record, 'active')"
                  >
                    启用
                  </a-button>
                  <a-button type="link" size="small" @click="openEditDialog(record)">
                    编辑
                  </a-button>
                  <a-button type="link" size="small" @click="openForeignKeyDialog(record)">
                    逻辑外键
                  </a-button>
                  <a-button type="link" size="small" danger @click="handleDelete(record)">
                    删除
                  </a-button>
                </div>
              </template>
            </template>

            <!-- 展开行：表管理 -->
            <template #expandedRowRender="{ record }">
              <div class="expand-content" v-if="record.status === 'active'">
                <div class="expand-header">
                  <h4>数据表管理</h4>
                  <div class="expand-actions">
                    <a-button size="small" type="primary" @click="loadTables(record)" :loading="tableLoadingMap[record.id!]">
                      刷新表列表
                    </a-button>
                  </div>
                </div>

                <div v-if="tableListMap[record.id!] && tableListMap[record.id!].length > 0">
                  <a-checkbox-group v-model:value="selectedTablesMap[record.id!]" style="width: 100%">
                    <a-row :gutter="[8, 8]">
                      <a-col v-for="table in tableListMap[record.id!]" :key="table" :span="6">
                        <a-checkbox :value="table">{{ table }}</a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>

                  <div class="expand-footer">
                    <a-select
                      v-model:value="selectedModelIdMap[record.id!]"
                      placeholder="请选择嵌入模型"
                      :loading="modelLoading"
                      size="small"
                      style="width: 160px; margin-right: 8px"
                    >
                      <a-select-option
                        v-for="model in embeddingModels"
                        :key="model.id"
                        :value="model.id"
                      >
                        {{ model.configName || model.modelName }}
                      </a-select-option>
                    </a-select>
                    <a-button size="small" type="primary" @click="selectAllTables(record)" plain>全选</a-button>
                    <a-button size="small" @click="clearAllTables(record)" style="margin-left: 8px">清空</a-button>
                    <a-button
                      size="small"
                      type="primary"
                      @click="handleInitSchema(record)"
                      :loading="initSchemaLoadingMap[record.id!]"
                      style="margin-left: 8px"
                    >
                      更新数据表
                    </a-button>
                  </div>
                </div>
                <div v-else-if="tableLoadingMap[record.id!]" style="text-align: center; padding: 20px; color: #999">
                  <a-spin size="small" /> 正在加载表列表...
                </div>
                <div v-else style="text-align: center; padding: 20px; color: #999">
                  暂无表数据，请点击刷新表列表
                </div>
              </div>
              <div v-else style="text-align: center; padding: 20px; color: #999">
                请先启用数据源以管理表
              </div>
            </template>
          </a-table>
        </a-card>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 添加/编辑数据源Modal -->
    <a-modal
      v-model:open="dialogVisible"
      :title="isEdit ? '编辑数据源' : '添加数据源'"
      width="800px"
      :okText="t('common.confirm')"
      :cancelText="t('common.cancel')"
      @ok="handleSave"
      @cancel="handleCancel"
      :confirmLoading="saveLoading"
    >
      <a-form
        ref="formRef"
        :model="datasourceForm"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="数据源名称" name="name" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="datasourceForm.name" placeholder="请输入数据源名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="数据源类型" name="type" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-select v-model:value="datasourceForm.type" placeholder="请选择数据源类型">
                <a-select-option v-for="t in datasourceTypes" :key="t.typeName" :value="t.typeName">
                  {{ t.displayName }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="主机地址" name="host" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="datasourceForm.host" placeholder="例如：localhost" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="端口号" name="port" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input-number v-model:value="datasourceForm.port" :min="1" :max="65535" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="数据库名" name="databaseName" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="datasourceForm.databaseName" placeholder="请输入数据库名" />
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="needsSchema">
            <a-form-item label="Schema名" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="schemaName" :placeholder="datasourceForm.type === 'postgresql' ? '例如：public' : '例如：SYSTEM'" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="连接地址" name="connectionUrl">
          <a-input v-model:value="datasourceForm.connectionUrl" placeholder="请输入JDBC地址（若不填则自动生成）" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" name="username" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="datasourceForm.username" placeholder="请输入数据库用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="密码" name="password" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input-password v-model:value="datasourceForm.password" placeholder="请输入数据库密码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="datasourceForm.description" :rows="3" placeholder="请输入数据源描述（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 逻辑外键配置Modal -->
    <a-modal
      v-model:open="foreignKeyDialogVisible"
      title="逻辑外键配置"
      width="900px"
      :footer="null"
      :close-on-click-modal="false"
    >
      <div v-if="currentDatasource">
        <div class="fk-datasource-info">
          当前配置数据源：<strong>{{ currentDatasource.name }}</strong>
        </div>

        <!-- 已配置的逻辑外键列表 -->
        <h4 style="margin: 16px 0 12px; border-left: 4px solid #1890ff; padding-left: 10px">已配置的逻辑外键</h4>
        <a-table :dataSource="foreignKeyList" :columns="fkColumns" :rowKey="(r: LogicalRelation) => r.id" size="small" :pagination="false">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'sourceTable'">
              <span style="font-family: monospace; color: #1890ff">{{ record.sourceTableName }}</span>
            </template>
            <template v-if="column.key === 'sourceColumn'">
              <span style="font-family: monospace">{{ record.sourceColumnName }}</span>
            </template>
            <template v-if="column.key === 'relationType'">
              <span style="font-family: monospace">{{ record.relationType || '-' }}</span>
            </template>
            <template v-if="column.key === 'targetTable'">
              <span style="font-family: monospace; color: #52c41a">{{ record.targetTableName }}</span>
            </template>
            <template v-if="column.key === 'targetColumn'">
              <span style="font-family: monospace">{{ record.targetColumnName }}</span>
            </template>
            <template v-if="column.key === 'fkAction'">
              <a-button type="link" size="small" @click="editForeignKey(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="removeForeignKey(index)">删除</a-button>
            </template>
          </template>
        </a-table>

        <!-- 添加/编辑逻辑外键表单 -->
        <h4 style="margin: 20px 0 12px; border-left: 4px solid #52c41a; padding-left: 10px">
          {{ editingFkIndex >= 0 ? '编辑逻辑外键' : '添加逻辑外键' }}
        </h4>
        <a-form layout="inline" class="fk-form" style="margin-bottom: 16px; flex-wrap: wrap; gap: 8px">
          <a-form-item label="主表">
            <a-select v-model:value="fkForm.sourceTableName" style="width: 150px" placeholder="选择主表" @change="handleSourceTableChange">
              <a-select-option v-for="t in fkTableList" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="字段">
            <a-select v-model:value="fkForm.sourceColumnName" style="width: 130px" placeholder="选择字段">
              <a-select-option v-for="c in sourceColumnList" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="关系类型">
            <a-select v-model:value="fkForm.relationType" style="width: 90px" placeholder="关系" allow-clear>
              <a-select-option value="1:1">1:1</a-select-option>
              <a-select-option value="1:N">1:N</a-select-option>
              <a-select-option value="N:1">N:1</a-select-option>
            </a-select>
          </a-form-item>
          <div style="flex-basis: 100%; height: 0"></div>
          <a-form-item label="关联表">
            <a-select v-model:value="fkForm.targetTableName" style="width: 150px" placeholder="选择关联表" @change="handleTargetTableChange">
              <a-select-option v-for="t in fkTableList" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="字段">
            <a-select v-model:value="fkForm.targetColumnName" style="width: 130px" placeholder="选择字段">
              <a-select-option v-for="c in targetColumnList" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="描述">
            <a-input v-model:value="fkForm.description" style="width: 150px" placeholder="业务描述" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" size="small" @click="addOrUpdateForeignKey">
              {{ editingFkIndex >= 0 ? '更新' : '添加' }}
            </a-button>
            <a-button v-if="editingFkIndex >= 0" size="small" @click="resetFkForm" style="margin-left: 8px">取消</a-button>
          </a-form-item>
        </a-form>

        <!-- 保存按钮 -->
        <div style="text-align: right; margin-top: 16px">
          <a-button @click="foreignKeyDialogVisible = false" style="margin-right: 8px">取消</a-button>
          <a-button type="primary" @click="saveForeignKeyConfig" :loading="savingForeignKeys">保存全部配置</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import {
  Button as AButton,
  Card as ACard,
  Table as ATable,
  Tag as ATag,
  Select as ASelect,
  SelectOption as ASelectOption,
  Modal as AModal,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  InputNumber as AInputNumber,
  InputPassword as AInputPassword,
  Textarea as ATextarea,
  Tooltip as ATooltip,
  Spin as ASpin,
  Checkbox as ACheckbox,
  CheckboxGroup as ACheckboxGroup,
  Row as ARow,
  Col as ACol
} from 'ant-design-vue'
import {
  getDatasourceTypes,
  queryDatasourceByPage,
  createDatasource,
  updateDatasource,
  deleteDatasource,
  testConnection,
  updateDatasourceStatus,
  getDatasourceTables,
  getTableColumns,
  initTableSchema,
  getLogicalRelations,
  saveLogicalRelations,
  type Datasource,
  type DatasourceType,
  type DatasourceQueryDTO,
  type LogicalRelation
} from '@/api/datasource'
import {
  getActiveModelConfigList,
  type Index
} from '@/api/model-config'
import {t} from "@/locales";

/**
 * 数据源管理页面
 * 提供数据源的增删改查、表管理、Schema初始化和逻辑外键管理功能
 */

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    customRender: ({ index }: { index: number }) => (pageNum.value - 1) * pageSize.value + index + 1
  },
  { title: '数据源名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '主机', dataIndex: 'host', key: 'host', width: 120 },
  { title: '端口', dataIndex: 'port', key: 'port', width: 70 },
  { title: '数据库名', dataIndex: 'databaseName', key: 'databaseName', width: 120 },
  { title: '连接状态', dataIndex: 'testStatus', key: 'testStatus', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const }
]

// 逻辑外键表格列定义
const fkColumns = [
  { title: '主表', key: 'sourceTable', width: 120 },
  { title: '字段', key: 'sourceColumn', width: 100 },
  { title: '关系', key: 'relationType', width: 80, align: 'center' as const },
  { title: '关联表', key: 'targetTable', width: 120 },
  { title: '字段', key: 'targetColumn', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description', width: 150, ellipsis: true },
  { title: '操作', key: 'fkAction', width: 120 }
]

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  databaseName: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

// 状态变量
const loading = ref(false)
const datasourceList = ref<Datasource[]>([])
const datasourceTypes = ref<DatasourceType[]>([])
const filterType = ref<string | undefined>(undefined)
const filterStatus = ref<string | undefined>(undefined)

// 分页变量
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const saveLoading = ref(false)
const formRef = ref<FormInstance>()
const currentEditId = ref<number | null>(null)
const schemaName = ref('')

// 数据源表单
const datasourceForm = ref<Datasource>({
  name: '',
  type: 'mysql',
  host: '',
  port: 3306,
  databaseName: '',
  username: '',
  password: '',
  connectionUrl: '',
  description: ''
})

// 是否需要Schema字段
const needsSchema = computed(() => {
  return datasourceForm.value.type === 'postgresql' || datasourceForm.value.type === 'oracle'
})

// 表管理相关状态
const expandedRowKeys = ref<number[]>([])
const tableListMap = reactive<Record<number, string[]>>({})
const selectedTablesMap = reactive<Record<number, string[]>>({})
const tableLoadingMap = reactive<Record<number, boolean>>({})
const initSchemaLoadingMap = reactive<Record<number, boolean>>({})

// 嵌入模型相关状态
const embeddingModels = ref<Index[]>([])
const modelLoading = ref(false)
const selectedModelIdMap = reactive<Record<number, number | undefined>>({})

// 逻辑外键相关状态
const foreignKeyDialogVisible = ref(false)
const currentDatasource = ref<Datasource | null>(null)
const foreignKeyList = ref<LogicalRelation[]>([])
const fkTableList = ref<string[]>([])
const sourceColumnList = ref<string[]>([])
const targetColumnList = ref<string[]>([])
const editingFkIndex = ref<number>(-1)
const savingForeignKeys = ref(false)
const fkForm = ref<{
  sourceTableName: string
  sourceColumnName: string
  targetTableName: string
  targetColumnName: string
  relationType: string
  description: string
}>({
  sourceTableName: '',
  sourceColumnName: '',
  targetTableName: '',
  targetColumnName: '',
  relationType: '',
  description: ''
})

/**
 * 加载数据源类型列表
 */
const loadDatasourceTypes = async () => {
  try {
    datasourceTypes.value = await getDatasourceTypes()
  } catch (error) {
    console.error('加载数据源类型失败:', error)
  }
}

/**
 * 加载数据源列表
 */
const loadDatasourceList = async () => {
  loading.value = true
  try {
    const queryDTO: DatasourceQueryDTO = {
      type: filterType.value || undefined,
      status: filterStatus.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const response = await queryDatasourceByPage(queryDTO)
    datasourceList.value = response.records
    total.value = response.total
    // 从后端返回的initializedTables字段初始化已选中的表，参照data-agent的selectTables回显逻辑
    for (const ds of response.records) {
      if (ds.id && ds.initializedTables) {
        try {
          const tables: string[] = JSON.parse(ds.initializedTables)
          if (Array.isArray(tables) && tables.length > 0) {
            selectedTablesMap[ds.id] = [...tables]
          }
        } catch (e) {
          // JSON解析失败则忽略
        }
      }
    }
  } catch (error) {
    message.error('加载数据源列表失败')
    console.error('加载数据源列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 筛选处理
 */
const handleFilter = () => {
  pageNum.value = 1
  loadDatasourceList()
}

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  isEdit.value = false
  currentEditId.value = null
  datasourceForm.value = {
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    databaseName: '',
    username: '',
    password: '',
    connectionUrl: '',
    description: ''
  }
  schemaName.value = ''
  dialogVisible.value = true
}

/**
 * 打开编辑对话框
 */
const openEditDialog = (record: Datasource) => {
  isEdit.value = true
  currentEditId.value = record.id || null
  // 复制数据，处理PostgreSQL/Oracle的Schema字段
  const form = { ...record }
  if ((form.type === 'postgresql' || form.type === 'oracle') && form.databaseName) {
    const parts = form.databaseName.split('|')
    if (parts.length === 2) {
      form.databaseName = parts[0]
      schemaName.value = parts[1]
    } else {
      schemaName.value = ''
    }
  } else {
    schemaName.value = ''
  }
  datasourceForm.value = form
  dialogVisible.value = true
}

/**
 * 关闭弹窗时清除校验状态
 */
const handleCancel = () => {
  formRef.value?.clearValidate()
  dialogVisible.value = false
}

/**
 * 保存数据源
 */
const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saveLoading.value = true

    const data = { ...datasourceForm.value }
    // PostgreSQL/Oracle合并数据库名和Schema名
    if (needsSchema.value && schemaName.value) {
      data.databaseName = `${data.databaseName}|${schemaName.value}`
    }

    if (isEdit.value && currentEditId.value) {
      await updateDatasource(currentEditId.value, data)
      message.success('更新成功')
      formRef.value?.clearValidate()
      dialogVisible.value = false
      await loadDatasourceList()
    } else {
      await createDatasource(data)
      message.success('创建成功')
      formRef.value?.clearValidate()
      dialogVisible.value = false
      await loadDatasourceList()
    }
  } catch (error: any) {
    console.error('表单验证失败:', error)
    if (error?.message) {
      message.error(error.message)
    }
  } finally {
    saveLoading.value = false
  }
}

/**
 * 删除数据源
 */
const handleDelete = (record: Datasource) => {
  if (!record.id) return
  Modal.confirm({
    title: '删除确认',
    content: `确定要删除数据源 "${record.name}" 吗？此操作不可恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteDatasource(record.id!)
        message.success('删除成功')
        await loadDatasourceList()
      } catch (error: any) {
        message.error(error?.message || '删除失败')
        console.error('删除失败:', error)
      }
    }
  })
}

/**
 * 测试连接
 */
const handleTestConnection = async (record: Datasource) => {
  if (!record.id) return
  try {
    message.loading('正在测试连接...', 0)
    const success = await testConnection(record.id)
    message.destroy()
    if (success) {
      message.success('连接测试成功')
    } else {
      message.error('连接测试失败')
    }
    // 刷新列表以更新测试状态
    await loadDatasourceList()
  } catch (error) {
    message.destroy()
    message.error('连接测试失败')
    console.error('连接测试失败:', error)
  }
}

/**
 * 切换启用/禁用状态
 */
const handleToggleStatus = async (record: Datasource, status: string) => {
  if (!record.id) return
  try {
    await updateDatasourceStatus(record.id, status)
    message.success(`${status === 'active' ? '启用' : '禁用'}成功`)
    await loadDatasourceList()
  } catch (error: any) {
    message.error(error?.message || '操作失败')
    console.error('操作失败:', error)
  }
}

/**
 * 处理表格展开
 */
const handleExpand = (expanded: boolean, record: Datasource) => {
  if (expanded) {
    expandedRowKeys.value = [record.id!]
    if (record.status === 'active') {
      loadTables(record)
    }
  } else {
    expandedRowKeys.value = []
  }
}

/**
 * 加载数据源的表列表
 */
const loadTables = async (record: Datasource) => {
  if (!record.id) return
  tableLoadingMap[record.id] = true
  try {
    const response = await getDatasourceTables(record.id)
    tableListMap[record.id] = response
    // 如果尚未初始化已选择的表，则从数据源的initializedTables字段回显
    if (!selectedTablesMap[record.id] || selectedTablesMap[record.id].length === 0) {
      if (record.initializedTables) {
        try {
          const tables: string[] = JSON.parse(record.initializedTables)
          if (Array.isArray(tables)) {
            selectedTablesMap[record.id] = [...tables]
          } else {
            selectedTablesMap[record.id] = []
          }
        } catch (e) {
          selectedTablesMap[record.id] = []
        }
      } else {
        selectedTablesMap[record.id] = []
      }
    }
    message.success(`成功加载 ${response.length} 个表`)
  } catch (error) {
    message.error('加载表列表失败')
    console.error('加载表列表失败:', error)
  } finally {
    tableLoadingMap[record.id] = false
  }
}

/**
 * 全选表
 */
const selectAllTables = (record: Datasource) => {
  if (!record.id || !tableListMap[record.id]) return
  selectedTablesMap[record.id] = [...tableListMap[record.id]]
}

/**
 * 清空选择的表
 */
const clearAllTables = (record: Datasource) => {
  if (!record.id) return
  selectedTablesMap[record.id] = []
}

/**
 * 初始化表Schema到向量数据库
 */
const handleInitSchema = async (record: Datasource) => {
  if (!record.id) return
  const tables = selectedTablesMap[record.id] || []
  if (tables.length === 0) {
    message.warning('请先选择需要更新的表')
    return
  }

  const modelId = selectedModelIdMap[record.id]
  if (!modelId) {
    message.warning('请先选择嵌入模型')
    return
  }

  initSchemaLoadingMap[record.id] = true
  try {
    await initTableSchema(record.id, tables, modelId)
    message.success('更新数据表成功')
  } catch (error: any) {
    message.error(error?.message || '更新数据表失败')
    console.error('更新数据表失败:', error)
  } finally {
    initSchemaLoadingMap[record.id] = false
  }
}

/**
 * 打开逻辑外键配置对话框
 */
const openForeignKeyDialog = async (record: Datasource) => {
  if (!record.id) return
  currentDatasource.value = record
  foreignKeyDialogVisible.value = true

  // 加载表列表
  try {
    fkTableList.value = await getDatasourceTables(record.id)
  } catch (error) {
    console.error('加载表列表失败:', error)
  }

  // 加载逻辑外键
  try {
    foreignKeyList.value = await getLogicalRelations(record.id)
  } catch (error) {
    console.error('加载逻辑外键失败:', error)
  }

  resetFkForm()
}

/**
 * 主表选择变化，加载字段列表
 */
const handleSourceTableChange = async (tableName: string) => {
  if (!tableName || !currentDatasource.value?.id) {
    sourceColumnList.value = []
    fkForm.value.sourceColumnName = ''
    return
  }
  try {
    sourceColumnList.value = await getTableColumns(currentDatasource.value.id, tableName)
    fkForm.value.sourceColumnName = ''
  } catch (error) {
    console.error('加载字段列表失败:', error)
  }
}

/**
 * 关联表选择变化，加载字段列表
 */
const handleTargetTableChange = async (tableName: string) => {
  if (!tableName || !currentDatasource.value?.id) {
    targetColumnList.value = []
    fkForm.value.targetColumnName = ''
    return
  }
  try {
    targetColumnList.value = await getTableColumns(currentDatasource.value.id, tableName)
    fkForm.value.targetColumnName = ''
  } catch (error) {
    console.error('加载字段列表失败:', error)
  }
}

/**
 * 编辑逻辑外键
 */
const editForeignKey = async (fk: LogicalRelation) => {
  const index = foreignKeyList.value.indexOf(fk)
  editingFkIndex.value = index
  fkForm.value = {
    sourceTableName: fk.sourceTableName,
    sourceColumnName: fk.sourceColumnName,
    targetTableName: fk.targetTableName,
    targetColumnName: fk.targetColumnName,
    relationType: fk.relationType || '',
    description: fk.description || ''
  }

  // 加载字段列表
  if (fk.sourceTableName && currentDatasource.value?.id) {
    try {
      sourceColumnList.value = await getTableColumns(currentDatasource.value.id, fk.sourceTableName)
    } catch (error) { console.error(error) }
  }
  if (fk.targetTableName && currentDatasource.value?.id) {
    try {
      targetColumnList.value = await getTableColumns(currentDatasource.value.id, fk.targetTableName)
    } catch (error) { console.error(error) }
  }
}

/**
 * 添加或更新逻辑外键
 */
const addOrUpdateForeignKey = () => {
  if (!fkForm.value.sourceTableName || !fkForm.value.sourceColumnName ||
      !fkForm.value.targetTableName || !fkForm.value.targetColumnName) {
    message.warning('请完整填写主表、字段、关联表和字段')
    return
  }

  // 检查重复（排除当前编辑项）
  const isDuplicate = foreignKeyList.value.some(
    (fk, idx) => idx !== editingFkIndex.value &&
      fk.sourceTableName === fkForm.value.sourceTableName &&
      fk.sourceColumnName === fkForm.value.sourceColumnName &&
      fk.targetTableName === fkForm.value.targetTableName &&
      fk.targetColumnName === fkForm.value.targetColumnName
  )
  if (isDuplicate) {
    message.warning('该逻辑外键关系已存在')
    return
  }

  if (editingFkIndex.value >= 0) {
    // 更新模式
    const index = editingFkIndex.value
    if (index < foreignKeyList.value.length) {
      foreignKeyList.value[index] = {
        ...foreignKeyList.value[index],
        sourceTableName: fkForm.value.sourceTableName,
        sourceColumnName: fkForm.value.sourceColumnName,
        targetTableName: fkForm.value.targetTableName,
        targetColumnName: fkForm.value.targetColumnName,
        relationType: fkForm.value.relationType,
        description: fkForm.value.description
      }
    }
    message.success('更新成功，请点击"保存全部配置"')
  } else {
    // 添加模式
    foreignKeyList.value.push({
      sourceTableName: fkForm.value.sourceTableName,
      sourceColumnName: fkForm.value.sourceColumnName,
      targetTableName: fkForm.value.targetTableName,
      targetColumnName: fkForm.value.targetColumnName,
      relationType: fkForm.value.relationType,
      description: fkForm.value.description
    })
    message.success('添加成功，请点击"保存全部配置"')
  }

  resetFkForm()
}

/**
 * 删除逻辑外键
 */
const removeForeignKey = (index: number) => {
  foreignKeyList.value.splice(index, 1)
  message.success('删除成功，请点击"保存全部配置"')
}

/**
 * 保存逻辑外键配置
 */
const saveForeignKeyConfig = async () => {
  if (!currentDatasource.value?.id) return
  savingForeignKeys.value = true
  try {
    await saveLogicalRelations(currentDatasource.value.id, foreignKeyList.value)
    message.success('保存成功')
    foreignKeyDialogVisible.value = false
  } catch (error: any) {
    message.error(error?.message || '保存失败')
    console.error('保存失败:', error)
  } finally {
    savingForeignKeys.value = false
  }
}

/**
 * 重置逻辑外键表单
 */
const resetFkForm = () => {
  editingFkIndex.value = -1
  fkForm.value = {
    sourceTableName: '',
    sourceColumnName: '',
    targetTableName: '',
    targetColumnName: '',
    relationType: '',
    description: ''
  }
  sourceColumnList.value = []
  targetColumnList.value = []
}

/**
 * 文本截断
 */
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 页面加载时获取数据
onMounted(() => {
  loadDatasourceTypes()
  loadDatasourceList()
  loadEmbeddingModels()
})

/**
 * 加载嵌入模型列表
 */
const loadEmbeddingModels = async () => {
  modelLoading.value = true
  try {
    embeddingModels.value = await getActiveModelConfigList('EMBEDDING')
  } catch (error) {
    message.error('加载嵌入模型列表失败')
    console.error('Failed to load embedding models:', error)
  } finally {
    modelLoading.value = false
  }
}
</script>

<style scoped>
.datasource-page {
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

.action-buttons {
  display: flex;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
}

.config-table {
  margin-bottom: 24px;
}

.action-buttons-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.loading-state {
  text-align: center;
  padding: 48px;
}

.expand-content {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.expand-footer {
  margin-top: 16px;
  text-align: right;
}

.expand-footer :deep(.ant-select) {
  text-align: left;
}

.fk-datasource-info {
  margin-bottom: 16px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.fk-datasource-info strong {
  color: #1890ff;
}

.fk-form :deep(.ant-form-item-label) {
  width: 70px;
  text-align: right;
}
</style>
