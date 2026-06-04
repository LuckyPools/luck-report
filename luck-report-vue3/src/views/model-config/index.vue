<template>
  <div class="model-config-page">
    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 内容头部 -->
      <div class="content-header">
        <div class="header-info">
          <h1 class="content-title">模型配置管理</h1>
          <p class="content-subtitle">配置和管理AI模型参数,支持多种模型提供商</p>
        </div>
      </div>

      <!-- Tab切换区域 -->
      <div class="tab-section">
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="CHAT" tab="对话模型">
            <!-- 对话模型内容 -->
            <div class="action-section">
              <a-card :bordered="true">
                <div class="action-content">
                  <div class="action-buttons">
                    <a-button type="primary" @click="showAddDialog">
                      <template #icon><PlusOutlined /></template>
                      新增对话模型
                    </a-button>
                    <a-button @click="loadConfigs">
                      <template #icon><ReloadOutlined /></template>
                      刷新
                    </a-button>
                  </div>
                </div>
              </a-card>
            </div>

            <!-- 对话模型表格 -->
            <div class="config-table" v-if="!loading">
              <a-card :bordered="true">
                <a-table
                  :dataSource="chatConfigs"
                  :columns="columns"
                  :rowKey="record => record.id"
                  :scroll="{ x: 1000, y: 500 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'provider'">
                      <a-tag :color="getProviderTagColor(record.provider)">
                        {{ record.provider }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'isActive'">
                      <a-tag :color="record.isActive ? 'success' : 'default'">
                        {{ record.isActive ? '已启用' : '未启用' }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                      <div class="action-buttons-cell">
                        <a-button type="link" size="small" @click="handleEdit(record)">
                          编辑
                        </a-button>
                        <a-button
                          v-if="!record.isActive"
                          type="link"
                          size="small"
                          @click="handleActivate(record.id)"
                          :loading="activatingId === record.id"
                        >
                          启用
                        </a-button>
                        <a-button
                          v-if="record.isActive"
                          type="link"
                          size="small"
                          @click="handleDeactivate(record.id)"
                          :loading="activatingId === record.id"
                        >
                          禁用
                        </a-button>
                        <a-button type="link" size="small" danger @click="handleDelete(record)">
                          删除
                        </a-button>
                      </div>
                    </template>
                  </template>
                </a-table>
              </a-card>
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && chatConfigs.length === 0" class="empty-state">
              <a-empty description="暂无对话模型配置">
                <a-button type="primary" @click="showAddDialog">
                  <template #icon><PlusOutlined /></template>
                  新增对话模型
                </a-button>
              </a-empty>
            </div>
          </a-tab-pane>

          <a-tab-pane key="EMBEDDING" tab="嵌入模型">
            <!-- 嵌入模型内容 -->
            <div class="action-section">
              <a-card :bordered="true">
                <div class="action-content">
                  <div class="action-buttons">
                    <a-button type="primary" @click="showAddDialog">
                      <template #icon><PlusOutlined /></template>
                      新增嵌入模型
                    </a-button>
                    <a-button @click="loadConfigs">
                      <template #icon><ReloadOutlined /></template>
                      刷新
                    </a-button>
                  </div>
                </div>
              </a-card>
            </div>

            <!-- 嵌入模型表格 -->
            <div class="config-table" v-if="!loading">
              <a-card :bordered="true">
                <a-table
                  :dataSource="embeddingConfigs"
                  :columns="embeddingColumns"
                  :rowKey="record => record.id"
                  :scroll="{ x: 800, y: 500 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'provider'">
                      <a-tag :color="getProviderTagColor(record.provider)">
                        {{ record.provider }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'isActive'">
                      <a-tag :color="record.isActive ? 'success' : 'default'">
                        {{ record.isActive ? '已启用' : '未启用' }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                      <div class="action-buttons-cell">
                        <a-button type="link" size="small" @click="handleEdit(record)">
                          编辑
                        </a-button>
                        <a-button
                          v-if="!record.isActive"
                          type="link"
                          size="small"
                          @click="handleActivate(record.id)"
                          :loading="activatingId === record.id"
                        >
                          启用
                        </a-button>
                        <a-button
                          v-if="record.isActive"
                          type="link"
                          size="small"
                          @click="handleDeactivate(record.id)"
                          :loading="activatingId === record.id"
                        >
                          禁用
                        </a-button>
                        <a-button type="link" size="small" danger @click="handleDelete(record)">
                          删除
                        </a-button>
                      </div>
                    </template>
                  </template>
                </a-table>
              </a-card>
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && embeddingConfigs.length === 0" class="empty-state">
              <a-empty description="暂无嵌入模型配置">
                <a-button type="primary" @click="showAddDialog">
                  <template #icon><PlusOutlined /></template>
                  新增嵌入模型
                </a-button>
              </a-empty>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
      </div>
    </main>

    <!-- 新增/编辑对话框 -->
    <a-modal
      v-model:open="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirmLoading="submitting"
    >
      <div class="modal-form-scroll">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="提供商" name="provider" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-select
                v-model:value="formData.provider"
                placeholder="请选择提供商"
                @change="updateBaseUrlByProvider"
              >
                <a-select-option value="deepseek">DeepSeek</a-select-option>
                <a-select-option value="qwen">Qwen</a-select-option>
                <a-select-option value="openai">OpenAI</a-select-option>
                <a-select-option value="siliconflow">Siliconflow</a-select-option>
                <a-select-option value="custom">Custom</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="自定义名称" name="configName" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input
                v-model:value="formData.configName"
                placeholder="最多50个字，用于在对话框中显示"
                :maxlength="50"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="模型名称" name="modelName">
          <a-input
            v-model:value="formData.modelName"
            :placeholder="activeTab === 'CHAT' ? '例如: gpt-4, deepseek-chat, qwen-plus' : '例如: text-embedding-v3, text-embedding-v4'"
          />
        </a-form-item>

        <a-form-item label="API密钥" name="apiKey">
          <a-input-password
            v-model:value="formData.apiKey"
            placeholder="请输入API密钥"
          />
        </a-form-item>

        <a-form-item label="Base URL" name="baseUrl">
          <a-input
            v-model:value="formData.baseUrl"
            placeholder="请填写兼容OpenAI协议的Base URL,通常不包含/v1后缀"
          />
        </a-form-item>

        <a-form-item
          v-if="activeTab === 'CHAT'"
          label="Completions路径"
          name="completionsPath"
        >
          <a-input
            v-model:value="formData.completionsPath"
            placeholder="附加到base-url的路径。留空则使用默认值/v1/chat/completions"
          />
        </a-form-item>

        <a-form-item
          v-if="activeTab === 'EMBEDDING'"
          label="Embeddings路径"
          name="embeddingsPath"
        >
          <a-input
            v-model:value="formData.embeddingsPath"
            placeholder="附加到base-url的路径。留空则使用默认值/v1/embeddings"
          />
        </a-form-item>

        <a-row v-if="activeTab === 'CHAT'" :gutter="24">
          <a-col :span="12">
            <a-form-item label="温度" name="temperature" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-slider
                v-model:value="formData.temperature"
                :min="0"
                :max="2"
                :step="0.1"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最大Token" name="maxTokens" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
              <a-input-number
                v-model:value="formData.maxTokens"
                :min="100"
                :max="10000"
                :step="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>


        <a-form-item label="启用代理">
          <a-switch v-model:checked="formData.proxyEnabled" />
          <span class="form-tip" style="margin-left: 10px">
            如果您的服务器处于受限内网,请开启代理以连接AI服务
          </span>
        </a-form-item>

        <div v-if="formData.proxyEnabled">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="代理主机" name="proxyHost" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                <a-input
                  v-model:value="formData.proxyHost"
                  placeholder="例如: 127.0.0.1 或 proxy.example.com"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="代理端口" name="proxyPort" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                <a-input-number
                  v-model:value="formData.proxyPort"
                  :min="1"
                  :max="65535"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="代理用户名" name="proxyUsername" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                <a-input
                  v-model:value="formData.proxyUsername"
                  placeholder="可选,代理服务器需要认证时填写"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="代理密码" name="proxyPassword" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                <a-input-password
                  v-model:value="formData.proxyPassword"
                  placeholder="可选"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <a-form-item label="排序" name="sort">
          <a-input-number
            v-model:value="formData.sort"
            :min="0"
            :max="9999"
            :step="1"
            style="width: 100%"
          />
          <div class="form-tip">数字越小越靠前，用于模型列表排序</div>
        </a-form-item>
      </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
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
  InputPassword as AInputPassword,
  InputNumber as AInputNumber,
  Tabs as ATabs,
  TabPane as ATabPane,
  Slider as ASlider,
  Switch as ASwitch,
  Divider as ADivider,
  Spin as ASpin,
  Empty as AEmpty,
  Row as ARow,
  Col as ACol
} from 'ant-design-vue'
import {
  getModelConfigList,
  addModelConfig,
  updateModelConfig,
  deleteModelConfig,
  activateModelConfig,
  deactivateModelConfig,
  type ModelConfig
} from '@/api/model-config'

/**
 * 模型配置管理页面
 * 使用Tab方式分开管理对话模型和嵌入模型
 */

// 状态变量
const loading = ref(true)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const activatingId = ref<number | null>(null)
const activeTab = ref('CHAT') // 当前激活的tab
const configs = ref<ModelConfig[]>([])
const formRef = ref<FormInstance>()

// 表单数据
const formData = ref<ModelConfig>({
  provider: '',
  apiKey: '',
  baseUrl: '',
  modelName: '',
  configName: '',
  sort: 0,
  modelType: 'CHAT',
  temperature: 0.0,
  maxTokens: 2000,
  completionsPath: '',
  embeddingsPath: '',
  isActive: false,
  proxyEnabled: false,
  proxyHost: '',
  proxyPort: 7890,
  proxyUsername: '',
  proxyPassword: ''
})

// 提供商与API地址的映射
const providerBaseUrlMap: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode',
  openai: 'https://api.openai.com',
  siliconflow: 'https://api.siliconflow.cn',
  custom: ''
}

// 对话模型表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '自定义名称',
    dataIndex: 'configName',
    key: 'configName',
    width: 150,
    ellipsis: true
  },
  {
    title: '提供商',
    dataIndex: 'provider',
    key: 'provider',
    width: 120
  },
  {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 180
  },
  {
    title: 'API地址',
    dataIndex: 'baseUrl',
    key: 'baseUrl',
    ellipsis: true
  },
  {
    title: '温度',
    dataIndex: 'temperature',
    key: 'temperature',
    width: 100
  },
  {
    title: '最大Token',
    dataIndex: 'maxTokens',
    key: 'maxTokens',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 嵌入模型表格列定义(不显示温度和最大Token)
const embeddingColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '自定义名称',
    dataIndex: 'configName',
    key: 'configName',
    width: 150,
    ellipsis: true
  },
  {
    title: '提供商',
    dataIndex: 'provider',
    key: 'provider',
    width: 120
  },
  {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 180
  },
  {
    title: 'API地址',
    dataIndex: 'baseUrl',
    key: 'baseUrl',
    ellipsis: true
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
]

// 表单验证规则
const formRules = {
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  configName: [
    { required: true, message: '请输入自定义名称', trigger: 'blur' },
    { max: 50, message: '自定义名称不能超过50个字', trigger: 'blur' }
  ],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  baseUrl: [{ required: true, message: '请输入API地址', trigger: 'blur' }],
  temperature: [
    { type: 'number', min: 0, max: 2, message: '温度值必须在0-2之间', trigger: 'blur' }
  ],
  maxTokens: [
    { type: 'number', min: 100, max: 10000, message: '最大Token必须在100-10000之间', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  const modelTypeText = activeTab.value === 'CHAT' ? '对话模型' : '嵌入模型'
  return isEditMode.value ? `编辑${modelTypeText}配置` : `新增${modelTypeText}配置`
})

const chatConfigs = computed(() => {
  return configs.value.filter(config => config.modelType === 'CHAT')
})

const embeddingConfigs = computed(() => {
  return configs.value.filter(config => config.modelType === 'EMBEDDING')
})

// 方法
/**
 * 加载模型配置列表
 */
const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await getModelConfigList()
    configs.value = response.data || []
  } catch (error) {
    message.error('获取模型配置列表失败,请检查网络!')
    configs.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 显示新增对话框
 * 根据当前tab设置默认的modelType
 */
const showAddDialog = () => {
  isEditMode.value = false
  formData.value = {
    provider: '',
    apiKey: '',
    baseUrl: '',
    modelName: '',
    modelType: activeTab.value, // 根据当前tab设置模型类型
    temperature: 0.0,
    maxTokens: 2000,
    completionsPath: activeTab.value === 'CHAT' ? '' : undefined,
    embeddingsPath: activeTab.value === 'EMBEDDING' ? '' : undefined,
    isActive: false,
    proxyEnabled: false,
    proxyHost: '',
    proxyPort: 7890,
    proxyUsername: '',
    proxyPassword: ''
  }
  dialogVisible.value = true
}

/**
 * 处理编辑操作
 * @param config 模型配置对象
 */
const handleEdit = (config: ModelConfig) => {
  isEditMode.value = true
  formData.value = { ...config }
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
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 确保modelType与当前tab一致
    formData.value.modelType = activeTab.value

    if (isEditMode.value) {
      // 更新配置
      const result = await updateModelConfig(formData.value)
      if (result.code === 0) {
        message.success('配置更新成功')
        formRef.value?.clearValidate()
        dialogVisible.value = false
        loadConfigs()
      } else {
        message.error(result.message || '配置更新失败')
      }
    } else {
      // 新增配置
      const result = await addModelConfig(formData.value)
      if (result.code === 0) {
        message.success('配置添加成功')
        formRef.value?.clearValidate()
        dialogVisible.value = false
        loadConfigs()
      } else {
        message.error(result.message || '配置添加失败')
      }
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 处理删除操作
 * @param config 模型配置对象
 */
const handleDelete = (config: ModelConfig) => {
  Modal.confirm({
    title: '删除确认',
    content: `确定要删除配置 "${config.provider} - ${config.modelName}" 吗?此操作不可恢复。`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      if (config.id) {
        const result = await deleteModelConfig(config.id)
        if (result.code === 0) {
          message.success('配置删除成功')
          loadConfigs()
        } else {
          message.error(result.message || '配置删除失败')
        }
      }
    }
  })
}

/**
 * 处理激活操作
 * @param id 配置ID
 */
const handleActivate = async (id?: number) => {
  if (!id) return

  activatingId.value = id
  try {
    const result = await activateModelConfig(id)
    if (result.code === 0) {
      message.success('模型启用成功!')
      loadConfigs()
    } else {
      message.error(result.message || '启用失败,请检查配置是否正确')
    }
  } catch (error) {
    message.error('启用失败,请检查配置是否正确')
  } finally {
    activatingId.value = null
  }
}

/**
 * 处理禁用操作
 * 如果该类型只有一个启用的模型，则不允许禁用
 * @param id 配置ID
 */
const handleDeactivate = async (id?: number) => {
  if (!id) return

  activatingId.value = id
  try {
    const result = await deactivateModelConfig(id)
    if (result.code === 0) {
      message.success('模型禁用成功!')
      loadConfigs()
    } else {
      message.error(result.message || '禁用失败')
    }
  } catch (error) {
    message.error('禁用失败')
  } finally {
    activatingId.value = null
  }
}

/**
 * 根据提供商更新API地址
 * @param provider 提供商名称
 */
const updateBaseUrlByProvider = (provider: string) => {
  if (provider && provider !== 'custom') {
    formData.value.baseUrl = providerBaseUrlMap[provider] || ''
  }
}

/**
 * 获取提供商标签颜色
 * @param provider 提供商名称
 * @returns 标签颜色
 */
const getProviderTagColor = (provider: string): string => {
  const colorMap: Record<string, string> = {
    deepseek: 'blue',
    qwen: 'orange',
    openai: 'green',
    siliconflow: 'purple',
    custom: 'default'
  }
  return colorMap[provider] || 'default'
}

// 页面加载时获取配置列表
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.model-config-page {
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

.text-muted {
  color: #999;
  font-size: 12px;
}

.form-tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.modal-form-scroll {
  max-height: 65vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}
</style>
