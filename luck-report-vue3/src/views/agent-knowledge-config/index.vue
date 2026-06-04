<template>
  <div class="agent-knowledge-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">智能体知识管理</h1>
          <p class="content-subtitle">管理智能体知识库，支持文档、问答对、常见问题等类型的知识配置</p>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-section">
        <a-card :bordered="true">
          <div class="action-content">
            <div class="action-buttons">
              <a-button type="primary" @click="openCreateDialog">
                <template #icon><PlusOutlined /></template>
                添加知识
              </a-button>
              <a-button @click="loadKnowledgeList">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
              <a-button
                @click="toggleFilter"
                :type="filterVisible ? 'primary' : 'default'"
              >
                <template #icon><FilterOutlined /></template>
                筛选
              </a-button>
            </div>
            <div class="search-box">
              <a-input
                v-model:value="queryParams.title"
                placeholder="请输入知识标题搜索"
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
          </div>
        </a-card>
      </div>

      <!-- 筛选面板 -->
      <div v-if="filterVisible" class="filter-section">
        <a-card :bordered="true">
          <div class="filter-content">
            <div class="filter-item">
              <span class="filter-label">知识类型：</span>
              <a-select
                v-model:value="queryParams.type"
                placeholder="全部类型"
                allow-clear
                @change="handleSearch"
                style="width: 150px"
              >
                <a-select-option value="DOCUMENT">文档</a-select-option>
                <a-select-option value="QA">问答对</a-select-option>
                <a-select-option value="FAQ">常见问题</a-select-option>
              </a-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">处理状态：</span>
              <a-select
                v-model:value="queryParams.embeddingStatus"
                placeholder="全部状态"
                allow-clear
                @change="handleSearch"
                style="width: 150px"
              >
                <a-select-option value="COMPLETED">COMPLETED</a-select-option>
                <a-select-option value="PROCESSING">PROCESSING</a-select-option>
                <a-select-option value="FAILED">FAILED</a-select-option>
                <a-select-option value="PENDING">PENDING</a-select-option>
              </a-select>
            </div>
            <a-button @click="clearFilters">
              <template #icon><ClearOutlined /></template>
              清空筛选
            </a-button>
          </div>
        </a-card>
      </div>

      <!-- 表格区域 -->
      <div class="config-table" v-if="!loading">
        <a-card :bordered="true">
          <a-table
            :dataSource="knowledgeList"
            :columns="columns"
            :rowKey="record => record.id"
            :scroll="{ x: 1200, y: 500 }"
            :pagination="tablePagination"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <span v-if="record.type === 'DOCUMENT'">文档</span>
                <span v-else-if="record.type === 'QA'">问答对</span>
                <span v-else-if="record.type === 'FAQ'">常见问题</span>
                <span v-else>{{ record.type }}</span>
              </template>
              <template v-if="column.key === 'splitterType'">
                <a-tag v-if="record.splitterType === 'token'" color="blue">Token</a-tag>
                <a-tag v-else-if="record.splitterType === 'recursive'" color="green">递归</a-tag>
                <a-tag v-else-if="record.splitterType === 'sentence'" color="orange">句子</a-tag>
                <a-tag v-else-if="record.splitterType === 'paragraph'" color="green">段落</a-tag>
                <a-tag v-else-if="record.splitterType === 'semantic'" color="purple">语义</a-tag>
                <span v-else style="color: #999">-</span>
              </template>
              <template v-if="column.key === 'embeddingStatus'">
                <a-tag :color="getVectorStatusColor(record.embeddingStatus)">
                  {{ record.embeddingStatus || '未知' }}
                  <a-tooltip
                    v-if="record.embeddingStatus === 'FAILED' && record.errorMsg"
                    :title="record.errorMsg"
                  >
                    <WarningOutlined style="margin-left: 4px" />
                  </a-tooltip>
                </a-tag>
              </template>
              <template v-if="column.key === 'enabled'">
                <a-tag :color="record.enabled ? 'success' : 'default'">
                  {{ record.enabled ? '生效' : '未生效' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-buttons-cell">
                  <a-button type="link" size="small" @click="editKnowledge(record)">
                    编辑
                  </a-button>
                  <a-button
                    v-if="record.embeddingStatus === 'FAILED'"
                    type="link"
                    size="small"
                    @click="retryEmbeddingAction(record)"
                    :loading="retryLoadingMap[record.id]"
                  >
                    重试
                  </a-button>
                  <a-button
                    v-if="record.enabled"
                    type="link"
                    size="small"
                    @click="toggleEnabled(record, false)"
                  >
                    设为不生效
                  </a-button>
                  <a-button
                    v-else
                    type="link"
                    size="small"
                    @click="toggleEnabled(record, true)"
                  >
                    设为生效
                  </a-button>
                  <a-button type="link" size="small" danger @click="deleteKnowledge(record)">
                    删除
                  </a-button>
                </div>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 添加/编辑智能体知识Modal -->
    <a-modal
      v-model:open="dialogVisible"
      :title="isEdit ? '编辑智能体知识' : '添加智能体知识'"
      width="800px"
      @ok="saveKnowledge"
      @cancel="handleCancel"
      :confirmLoading="saveLoading"
    >
      <a-form
        ref="formRef"
        :model="knowledgeForm"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <!-- 知识类型 + 分块策略 -->
        <a-row :gutter="24">
          <a-col :span="knowledgeForm.type === 'DOCUMENT' && !isEdit ? 12 : 24">
            <a-form-item
              label="知识类型"
              name="type"
              :label-col="knowledgeForm.type === 'DOCUMENT' && !isEdit ? { span: 8 } : { span: 4 }"
              :wrapper-col="knowledgeForm.type === 'DOCUMENT' && !isEdit ? { span: 16 } : { span: 20 }"
            >
              <a-select
                v-model:value="knowledgeForm.type"
                placeholder="请选择知识类型"
                @change="handleTypeChange"
                :disabled="isEdit"
              >
                <a-select-option value="DOCUMENT">文档 (文件上传)</a-select-option>
                <a-select-option value="QA">问答对 (Q&A)</a-select-option>
                <a-select-option value="FAQ">常见问题 (FAQ)</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col v-if="knowledgeForm.type === 'DOCUMENT' && !isEdit" :span="12">
            <a-form-item
              label="分块策略"
              name="splitterType"
              :label-col="{ span: 8 }"
              :wrapper-col="{ span: 16 }"
            >
              <a-select
                v-model:value="knowledgeForm.splitterType"
                placeholder="请选择分块策略"
              >
                <a-select-option value="token">Token 分块</a-select-option>
                <a-select-option value="recursive">递归分块</a-select-option>
                <a-select-option value="sentence">句子分块</a-select-option>
                <a-select-option value="paragraph">段落分块</a-select-option>
                <a-select-option value="semantic">语义分块</a-select-option>
              </a-select>
              <div class="form-tip" v-if="knowledgeForm.splitterType">
                <span v-if="knowledgeForm.splitterType === 'token'">速度最快，按固定token数切分，适合代码和日志</span>
                <span v-else-if="knowledgeForm.splitterType === 'recursive'">平衡之选，保留文档结构，适合技术文档</span>
                <span v-else-if="knowledgeForm.splitterType === 'sentence'">保证句子完整性，语义不被截断，适合新闻和文章</span>
                <span v-else-if="knowledgeForm.splitterType === 'paragraph'">按自然段落分块，保留段落完整性，适合博客、书籍等</span>
                <span v-else-if="knowledgeForm.splitterType === 'semantic'">基于语义相似度智能分块，自动识别主题边界，适合论文和长文</span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 知识类型说明 -->
        <a-form-item v-if="knowledgeForm.type === 'QA'" :wrapper-col="{ offset: 4, span: 20 }">
          <a-alert type="info" :closable="false" show-icon>
            <template #message>
              请录入具体的'分析需求'作为问题，并在答案中写出详细的'思考步骤'与'数据查找逻辑'，以此教会AI如何拆解任务。
            </template>
          </a-alert>
        </a-form-item>

        <a-form-item v-if="knowledgeForm.type === 'FAQ'" :wrapper-col="{ offset: 4, span: 20 }">
          <a-alert type="info" :closable="false" show-icon>
            <template #message>
              请针对特定的'业务术语'、'指标口径'或'常见歧义'进行提问和定义，以此统一AI的判断标准。
            </template>
          </a-alert>
        </a-form-item>

        <a-form-item v-if="knowledgeForm.type === 'DOCUMENT'" :wrapper-col="{ offset: 4, span: 20 }">
          <a-alert type="info" :closable="false" show-icon>
            <template #message>
              请上传完整的'数据库表结构'、'码表映射字典'或'业务背景说明'，供AI在分析时检索字段含义和数据关系。
            </template>
          </a-alert>
        </a-form-item>

        <!-- 知识标题 + 嵌入模型 -->
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="知识标题" name="title" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input v-model:value="knowledgeForm.title" placeholder="为这份知识起一个易于识别的名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="嵌入模型" name="modelId" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-select
                v-model:value="knowledgeForm.modelId"
                placeholder="请选择嵌入模型"
                :loading="modelLoading"
              >
                <a-select-option
                  v-for="model in embeddingModels"
                  :key="model.id"
                  :value="model.id"
                >
                  {{ model.configName || model.modelName }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 文件上传区域（仅文档类型） -->
        <a-form-item v-if="knowledgeForm.type === 'DOCUMENT'" label="上传文件">
          <div v-if="!isEdit" style="width: 100%">
            <a-upload
              :auto-upload="false"
              :max-count="1"
              :file-list="fileList"
              @change="handleFileChange"
              :before-upload="() => false"
            >
              <a-button>
                <template #icon><UploadOutlined /></template>
                选择文件
              </a-button>
            </a-upload>
            <div class="form-tip">支持 PDF, DOCX, TXT, MD 等格式</div>
          </div>
          <div v-else>
            <a-alert
              type="info"
              :closable="false"
              show-icon
              message="文档类型知识不支持修改文件内容，如需修改请删除后重新创建"
            />
          </div>
        </a-form-item>

        <!-- Q&A / FAQ 输入区域 -->
        <template v-if="knowledgeForm.type === 'QA' || knowledgeForm.type === 'FAQ'">
          <a-form-item label="问题" name="question">
            <a-textarea
              v-model:value="knowledgeForm.question"
              :rows="2"
              placeholder="输入用户可能会问的问题..."
            />
          </a-form-item>
          <a-form-item label="答案" name="content">
            <a-textarea
              v-model:value="knowledgeForm.content"
              :rows="5"
              placeholder="输入标准答案..."
            />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance, UploadFile } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  WarningOutlined,
  SearchOutlined,
  UploadOutlined
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
  Textarea as ATextarea,
  Tooltip as ATooltip,
  Spin as ASpin,
  Empty as AEmpty,
  Alert as AAlert,
  Upload as AUpload,
  Row as ARow,
  Col as ACol
} from 'ant-design-vue'
import {
  queryAgentKnowledgeByPage,
  createAgentKnowledge,
  updateAgentKnowledge,
  deleteAgentKnowledge,
  enableKnowledge,
  retryEmbedding as retryEmbeddingApi,
  type AgentKnowledge,
  type AgentKnowledgeQueryDTO,
  type CreateAgentKnowledgeDTO,
  type UpdateAgentKnowledgeDTO
} from '@/api/agent-knowledge-config'
import {
  getActiveModelConfigList,
  type ModelConfig
} from '@/api/model-config'

/**
 * 智能体知识管理页面
 * 提供智能体知识的增删改查和向量化管理功能
 */

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 150,
    ellipsis: true
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '分块策略',
    dataIndex: 'splitterType',
    key: 'splitterType',
    width: 100
  },
  {
    title: '向量化状态',
    dataIndex: 'embeddingStatus',
    key: 'embeddingStatus',
    width: 120
  },
  {
    title: '是否生效',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right'
  }
]

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入知识标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择知识类型', trigger: 'change' }],
  modelId: [{ required: true, message: '请选择嵌入模型', trigger: 'change' }]
}

// 状态变量
const loading = ref(false)
const knowledgeList = ref<AgentKnowledge[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saveLoading = ref(false)
const filterVisible = ref(false)
const retryLoadingMap = ref<Record<number, boolean>>({})
const formRef = ref<FormInstance>()
const fileList = ref<UploadFile[]>([])
const currentEditId = ref<number | null>(null)

// 嵌入模型列表
const embeddingModels = ref<ModelConfig[]>([])
const modelLoading = ref(false)

// 查询参数
const queryParams = reactive<AgentKnowledgeQueryDTO>({
  title: '',
  type: '',
  embeddingStatus: '',
  pageNum: 1,
  pageSize: 10
})

// 分页总数
const total = ref(0)

// 表格分页配置
const tablePagination = computed(() => ({
  current: queryParams.pageNum,
  pageSize: queryParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (t: number) => `共 ${t} 条`
}))

// 知识表单
const knowledgeForm = ref<{
  title: string
  type: string
  question: string
  content: string
  splitterType: string
  modelId: number | undefined
}>({
  title: '',
  type: 'DOCUMENT',
  question: '',
  content: '',
  splitterType: 'recursive',
  modelId: undefined
})

// 上传的文件
const uploadFile = ref<File | null>(null)

/**
 * 加载知识列表
 */
const loadKnowledgeList = async () => {
  loading.value = true
  try {
    const response = await queryAgentKnowledgeByPage(queryParams)
    if (response.success) {
      knowledgeList.value = response.data.data
      total.value = response.data.total
    } else {
      message.error('加载知识列表失败')
    }
  } catch (error) {
    message.error('加载知识列表失败')
    console.error('Failed to load knowledge list:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  queryParams.pageNum = 1
  loadKnowledgeList()
}

/**
 * 处理表格分页变化
 */
const handleTableChange = (pagination: any) => {
  queryParams.pageNum = pagination.current
  queryParams.pageSize = pagination.pageSize
  loadKnowledgeList()
}

/**
 * 切换筛选面板
 */
const toggleFilter = () => {
  filterVisible.value = !filterVisible.value
}

/**
 * 清空筛选条件
 */
const clearFilters = () => {
  queryParams.type = ''
  queryParams.embeddingStatus = ''
  handleSearch()
}

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  isEdit.value = false
  currentEditId.value = null
  uploadFile.value = null
  fileList.value = []
  knowledgeForm.value = {
    title: '',
    type: 'DOCUMENT',
    question: '',
    content: '',
    splitterType: 'recursive',
    modelId: undefined
  }
  dialogVisible.value = true
}

/**
 * 关闭对话框，清除校验状态
 */
const handleCancel = () => {
  formRef.value?.clearValidate()
  dialogVisible.value = false
  uploadFile.value = null
  fileList.value = []
}

/**
 * 编辑知识
 */
const editKnowledge = (knowledge: AgentKnowledge) => {
  isEdit.value = true
  currentEditId.value = knowledge.id || null
  knowledgeForm.value = {
    title: knowledge.title,
    type: knowledge.type,
    question: knowledge.question || '',
    content: knowledge.type === 'QA' || knowledge.type === 'FAQ' ? (knowledge.content || '') : '',
    splitterType: knowledge.splitterType || 'token',
    modelId: knowledge.modelId
  }
  dialogVisible.value = true
}

/**
 * 知识类型变更处理
 */
const handleTypeChange = () => {
  // 切换类型时清空相关字段
  knowledgeForm.value.question = ''
  knowledgeForm.value.content = ''
  uploadFile.value = null
  fileList.value = []
}

/**
 * 文件变更处理
 */
const handleFileChange = (info: any) => {
  fileList.value = info.fileList.slice(-1)
  if (info.fileList.length > 0) {
    uploadFile.value = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
  } else {
    uploadFile.value = null
  }
}

/**
 * 切换生效状态
 */
const toggleEnabled = async (knowledge: AgentKnowledge, enabled: boolean) => {
  if (!knowledge.id) return

  try {
    const response = await enableKnowledge(knowledge.id, enabled)
    if (response.success) {
      message.success(`${enabled ? '设为生效' : '设为不生效'}成功`)
      knowledge.enabled = enabled
      // 如果返回了新的embeddingStatus，也更新
      if (response.data) {
        knowledge.embeddingStatus = response.data.embeddingStatus
      }
    } else {
      message.error(`${enabled ? '设为生效' : '设为不生效'}失败`)
    }
  } catch (error) {
    message.error(`${enabled ? '设为生效' : '设为不生效'}失败`)
    console.error('Failed to toggle enabled:', error)
  }
}

/**
 * 删除知识
 */
const deleteKnowledge = async (knowledge: AgentKnowledge) => {
  if (!knowledge.id) return

  Modal.confirm({
    title: '删除确认',
    content: `确定要删除知识 "${knowledge.title}" 吗？此操作不可恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        const response = await deleteAgentKnowledge(knowledge.id!)
        if (response.success) {
          message.success('删除成功')
          await loadKnowledgeList()
        } else {
          message.error('删除失败')
        }
      } catch (error) {
        message.error('删除失败')
        console.error('Failed to delete knowledge:', error)
      }
    }
  })
}

/**
 * 重试向量化
 */
const retryEmbeddingAction = async (knowledge: AgentKnowledge) => {
  if (!knowledge.id) return

  try {
    retryLoadingMap.value[knowledge.id] = true
    const response = await retryEmbeddingApi(knowledge.id)
    if (response.success) {
      message.success('重试向量化成功')
      await loadKnowledgeList()
    } else {
      message.error('重试向量化失败')
    }
  } catch (error) {
    message.error('重试向量化失败')
    console.error('Failed to retry vectorization:', error)
  } finally {
    retryLoadingMap.value[knowledge.id] = false
  }
}

/**
 * 保存知识
 */
const saveKnowledge = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saveLoading.value = true

    if (isEdit.value && currentEditId.value) {
      // 更新操作
      const updateData: UpdateAgentKnowledgeDTO = {
        title: knowledgeForm.value.title,
        content: knowledgeForm.value.content || undefined,
        modelId: knowledgeForm.value.modelId
      }
      const response = await updateAgentKnowledge(currentEditId.value, updateData)
      if (response.success) {
        message.success('更新成功')
        formRef.value?.clearValidate()
        dialogVisible.value = false
        // 清空搜索条件，刷新列表
        queryParams.title = ''
        queryParams.pageNum = 1
        await loadKnowledgeList()
      } else {
        message.error('更新失败')
      }
    } else {
      // 创建操作
      const createData: CreateAgentKnowledgeDTO = {
        title: knowledgeForm.value.title,
        type: knowledgeForm.value.type,
        question: knowledgeForm.value.question || undefined,
        content: knowledgeForm.value.content || undefined,
        splitterType: knowledgeForm.value.splitterType,
        modelId: knowledgeForm.value.modelId!
      }
      const response = await createAgentKnowledge(createData, uploadFile.value || undefined)
      if (response.success) {
        message.success('创建成功')
        formRef.value?.clearValidate()
        dialogVisible.value = false
        // 清空搜索条件，刷新列表
        queryParams.title = ''
        queryParams.pageNum = 1
        await loadKnowledgeList()
      } else {
        message.error('创建失败')
      }
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    saveLoading.value = false
  }
}

/**
 * 获取向量化状态对应的颜色
 */
const getVectorStatusColor = (status?: string): string => {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'error'
    case 'PENDING':
      return 'warning'
    case 'PROCESSING':
      return 'processing'
    default:
      return 'default'
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadKnowledgeList()
  loadEmbeddingModels()
})

/**
 * 加载嵌入模型列表
 */
const loadEmbeddingModels = async () => {
  modelLoading.value = true
  try {
    const response = await getActiveModelConfigList('EMBEDDING')
    if (response.code === 0) {
      embeddingModels.value = response.data || []
    } else {
      message.error('加载嵌入模型列表失败')
    }
  } catch (error) {
    message.error('加载嵌入模型列表失败')
    console.error('Failed to load embedding models:', error)
  } finally {
    modelLoading.value = false
  }
}
</script>

<style scoped>
.agent-knowledge-page {
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

.filter-section {
  margin-bottom: 24px;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-label {
  white-space: nowrap;
  margin-right: 8px;
  color: #666;
}

.config-table {
  margin-bottom: 24px;
}

.action-buttons-cell {
  display: flex;
  gap: 8px;
}

.loading-state {
  text-align: center;
  padding: 48px;
}

.empty-state {
  text-align: center;
  padding: 48px;
}

.form-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style>
