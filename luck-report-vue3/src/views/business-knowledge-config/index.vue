<template>
  <div class="business-knowledge-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">业务知识管理</h1>
          <p class="content-subtitle">管理业务知识词条，支持向量化存储和召回</p>
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
              <a-button @click="loadBusinessKnowledge">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
              <a-button
                @click="refreshVectorStore"
                v-if="!refreshLoading"
                type="default"
              >
                <template #icon><SyncOutlined /></template>
                同步到向量库
              </a-button>
              <a-button v-else type="default" loading>同步中...</a-button>
            </div>
            <div class="search-box">
              <a-input
                v-model:value="searchKeyword"
                placeholder="请输入关键词搜索"
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

      <!-- 表格区域 -->
      <div class="config-table" v-if="!loading">
        <a-card :bordered="true">
          <a-table 
            :dataSource="businessKnowledgeList" 
            :columns="columns" 
            :rowKey="record => record.id"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="{ column, record }">
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
              <template v-if="column.key === 'isRecall'">
                <a-tag :color="record.isRecall ? 'success' : 'default'">
                  {{ record.isRecall ? '是' : '否' }}
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
                    @click="retryEmbedding(record)"
                    :loading="retryLoadingMap[record.id]"
                  >
                    重试
                  </a-button>
                  <a-button
                    v-if="record.isRecall"
                    type="link"
                    size="small"
                    @click="toggleRecall(record, false)"
                  >
                    取消召回
                  </a-button>
                  <a-button
                    v-else
                    type="link"
                    size="small"
                    @click="toggleRecall(record, true)"
                  >
                    设为召回
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

      <!-- 空状态 -->
      <div v-if="!loading && businessKnowledgeList.length === 0" class="empty-state">
        <a-empty description="暂无业务知识">
          <a-button type="primary" @click="openCreateDialog">
            <template #icon><PlusOutlined /></template>
            添加知识
          </a-button>
        </a-empty>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 添加/编辑业务知识Modal -->
    <a-modal
      v-model:open="dialogVisible"
      :title="isEdit ? '编辑业务知识' : '添加业务知识'"
      width="800px"
      @ok="saveKnowledge"
      @cancel="dialogVisible = false"
      :confirmLoading="saveLoading"
    >
      <a-form
        ref="formRef"
        :model="knowledgeForm"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="业务名词" name="businessTerm">
          <a-input v-model:value="knowledgeForm.businessTerm" placeholder="请输入业务名词" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="knowledgeForm.description"
            :rows="3"
            placeholder="请输入业务知识描述"
          />
        </a-form-item>

        <a-form-item label="同义词" name="synonyms">
          <a-textarea
            v-model:value="knowledgeForm.synonyms"
            :rows="2"
            placeholder="请输入同义词，多个同义词用逗号分隔"
          />
        </a-form-item>

        <a-form-item label="嵌入模型" name="modelId">
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
          <div class="form-tip">选择用于将业务知识转化为向量的嵌入模型</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  WarningOutlined,
  SearchOutlined
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
  Empty as AEmpty
} from 'ant-design-vue'
import {
  getBusinessKnowledgeList,
  createBusinessKnowledge,
  updateBusinessKnowledge,
  deleteBusinessKnowledge,
  recallKnowledge,
  refreshVectorStore as refreshVectorStoreApi,
  retryEmbedding as retryEmbeddingApi,
  type BusinessKnowledge,
  type CreateBusinessKnowledgeDTO,
  type UpdateBusinessKnowledgeDTO
} from '@/api/business-knowledge-config'
import {
  getActiveModelConfigList,
  type ModelConfig
} from '@/api/model-config'

/**
 * 业务知识管理页面
 * 提供业务知识的增删改查和向量化管理功能
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
    title: '业务名词',
    dataIndex: 'businessTerm',
    key: 'businessTerm',
    width: 150,
    ellipsis: true
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    ellipsis: true
  },
  {
    title: '同义词',
    dataIndex: 'synonyms',
    key: 'synonyms',
    width: 150,
    ellipsis: true
  },
  {
    title: '向量化状态',
    dataIndex: 'embeddingStatus',
    key: 'embeddingStatus',
    width: 120
  },
  {
    title: '是否召回',
    dataIndex: 'isRecall',
    key: 'isRecall',
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
    width: 250,
    fixed: 'right'
  }
]

// 表单验证规则
const formRules = {
  businessTerm: [{ required: true, message: '请输入业务名词', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  modelId: [{ required: true, message: '请选择嵌入模型', trigger: 'change' }]
}

// 状态变量
const loading = ref(false)
const businessKnowledgeList = ref<BusinessKnowledge[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')
const saveLoading = ref(false)
const refreshLoading = ref(false)
const retryLoadingMap = ref<Record<number, boolean>>({})
const formRef = ref<FormInstance>()

// 嵌入模型列表
const embeddingModels = ref<ModelConfig[]>([])
const modelLoading = ref(false)

// 知识表单
const knowledgeForm = ref<BusinessKnowledge>({
  businessTerm: '',
  description: '',
  synonyms: '',
  isRecall: false,
  modelId: undefined as any
})

// 当前编辑的ID
const currentEditId = ref<number | null>(null)

/**
 * 加载业务知识列表
 */
const loadBusinessKnowledge = async () => {
  loading.value = true
  try {
    const response = await getBusinessKnowledgeList(searchKeyword.value)
    if (response.success) {
      businessKnowledgeList.value = response.data
    } else {
      message.error('加载业务知识列表失败')
    }
  } catch (error) {
    message.error('加载业务知识列表失败')
    console.error('Failed to load business knowledge:', error)
  } finally {
    loading.value = false
  }
}

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

/**
 * 打开创建对话框
 */
const openCreateDialog = () => {
  isEdit.value = false
  currentEditId.value = null
  knowledgeForm.value = {
    businessTerm: '',
    description: '',
    synonyms: '',
    isRecall: false,
    modelId: undefined as any
  }
  dialogVisible.value = true
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  loadBusinessKnowledge()
}

/**
 * 编辑业务知识
 */
const editKnowledge = (knowledge: BusinessKnowledge) => {
  isEdit.value = true
  currentEditId.value = knowledge.id || null
  knowledgeForm.value = { ...knowledge }
  dialogVisible.value = true
}

/**
 * 删除业务知识
 */
const deleteKnowledge = async (knowledge: BusinessKnowledge) => {
  if (!knowledge.id) return

  Modal.confirm({
    title: '删除确认',
    content: `确定要删除业务知识 "${knowledge.businessTerm}" 吗？此操作不可恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        const response = await deleteBusinessKnowledge(knowledge.id!)
        if (response.success) {
          message.success('删除成功')
          await loadBusinessKnowledge()
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
 * 切换召回状态
 */
const toggleRecall = async (knowledge: BusinessKnowledge, isRecall: boolean) => {
  if (!knowledge.id) return

  try {
    const response = await recallKnowledge(knowledge.id, isRecall)
    if (response.success) {
      message.success(`${isRecall ? '设为召回' : '取消召回'}成功`)
      knowledge.isRecall = isRecall
    } else {
      message.error(`${isRecall ? '设为召回' : '取消召回'}失败`)
    }
  } catch (error) {
    message.error(`${isRecall ? '设为召回' : '取消召回'}失败`)
    console.error('Failed to toggle recall:', error)
  }
}

/**
 * 保存业务知识
 */
const saveKnowledge = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saveLoading.value = true

    if (isEdit.value && currentEditId.value) {
      // 更新操作
      const updateData: UpdateBusinessKnowledgeDTO = {
        businessTerm: knowledgeForm.value.businessTerm,
        description: knowledgeForm.value.description,
        synonyms: knowledgeForm.value.synonyms,
        modelId: knowledgeForm.value.modelId
      }
      const response = await updateBusinessKnowledge(currentEditId.value, updateData)
      if (response.success) {
        message.success('更新成功')
        dialogVisible.value = false
        await loadBusinessKnowledge()
      } else {
        message.error('更新失败')
      }
    } else {
      // 创建操作
      const createData: CreateBusinessKnowledgeDTO = {
        businessTerm: knowledgeForm.value.businessTerm,
        description: knowledgeForm.value.description,
        synonyms: knowledgeForm.value.synonyms,
        isRecall: knowledgeForm.value.isRecall,
        modelId: knowledgeForm.value.modelId
      }
      const response = await createBusinessKnowledge(createData)
      if (response.success) {
        message.success('创建成功')
        dialogVisible.value = false
        await loadBusinessKnowledge()
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
 * 刷新向量存储
 */
const refreshVectorStore = async () => {
  Modal.confirm({
    title: '确认同步',
    content: '如果所有向量状态正常，即无需同步。确定要清除现有数据并开始重新同步吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        refreshLoading.value = true
        const response = await refreshVectorStoreApi()
        if (response.success) {
          message.success('同步到向量库成功')
        } else {
          message.error('同步到向量库失败')
        }
      } catch (error) {
        message.error('同步到向量库失败')
        console.error('Failed to refresh vector store:', error)
      } finally {
        refreshLoading.value = false
      }
    }
  })
}

/**
 * 重试向量化
 */
const retryEmbedding = async (knowledge: BusinessKnowledge) => {
  if (!knowledge.id) return

  try {
    retryLoadingMap.value[knowledge.id] = true

    const response = await retryEmbeddingApi(knowledge.id)
    if (response.success) {
      message.success('重试向量化成功')
      await loadBusinessKnowledge()
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
  loadBusinessKnowledge()
  loadEmbeddingModels()
})
</script>

<style scoped>
.business-knowledge-page {
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