import { ref, computed } from 'vue'
import type { LLMModel, ModelProvider } from '../types/chat'
import { getActiveModelConfigList, type Index } from '@/api/model-config'

/**
 * 模型列表管理 Hook
 * 从后台获取激活的对话模型列表，供用户在对话框中选择
 * 支持多模型启用，用户可自由切换
 */
export function useModelList() {
  const isPending = ref(false)

  const currentModel = ref<LLMModel>({
    id: 'qwen-plus',
    displayName: '通义千问',
    supportVision: true,
    supportTool: true,
    maxTokens: 131072,
    selected: true,
    provider: {
      id: 'qwen',
      providerName: '通义千问',
      apiStyle: 'openai'
    }
  })

  const modelList = ref<LLMModel[]>([currentModel.value])

  const providerList = ref<ModelProvider[]>([
    {
      id: 'qwen',
      providerName: '通义千问',
      apiStyle: 'openai',
      status: true
    }
  ])

  /** 当前模型是否支持视觉/图片理解 */
  const currentModelSupportVision = computed(() => currentModel.value.supportVision ?? false)

  /** 当前模型是否支持工具调用（MCP） */
  const currentModelSupportTool = computed(() => currentModel.value.supportTool ?? false)

  /**
   * 按 Provider ID 分组的 Provider 映射表
   * 对应 HiveChat allProviderListByKey，用于根据消息的 providerId 获取 Provider 信息
   * 主要用于 MessageItem 和 ResponsingMessage 显示 Provider 头像
   */
  const allProviderListByKey = computed<Record<string, ModelProvider>>(() => {
    const map: Record<string, ModelProvider> = {}
    for (const model of modelList.value) {
      if (!map[model.provider.id]) {
        map[model.provider.id] = model.provider
      }
    }
    return map
  })

  /**
   * 精确设置当前模型（通过 providerId + modelId）
   * 对应 HiveChat setCurrentModelExact
   *
   * @param providerId - 提供商 ID
   * @param modelId - 模型 ID
   */
  const setCurrentModelExact = (providerId: string, modelId: string) => {
    const model = modelList.value.find(
      m => m.id === modelId && m.provider.id === providerId
    )
    if (model) {
      currentModel.value = model
      localStorage.setItem('lastSelectedModel', `${providerId}|${modelId}`)
    }
  }

  /**
   * 将后台模型配置转换为前端 LLMModel 格式
   *
   * @param config 后台模型配置
   * @returns LLMModel 前端模型格式
   */
  const convertToLLMModel = (config: Index): LLMModel => {
    return {
      id: String(config.id),
      displayName: config.configName || config.modelName, // 优先使用自定义名称
      supportVision: false, // 默认不支持视觉，可根据模型名称判断
      supportTool: true, // 默认支持工具调用
      maxTokens: config.maxTokens || 8192,
      selected: false,
      provider: {
        id: config.provider,
        providerName: config.provider,
        apiStyle: 'openai'
      }
    }
  }

  /**
   * 从后台加载激活的对话模型列表
   * 初始化时调用，获取所有启用的对话模型
   */
  const loadActiveModels = async () => {
    isPending.value = true
    try {
      const response = await getActiveModelConfigList('CHAT')
      if (response.code === 0 && response.data) {
        const models = response.data.map(convertToLLMModel)
        initModelList(models)
      }
    } catch (error) {
      console.error('加载激活模型列表失败:', error)
      // 失败时使用默认模型
      initModelList([currentModel.value])
    } finally {
      isPending.value = false
    }
  }

  /**
   * 初始化模型列表
   * 从 localStorage 恢复上次选择的模型
   *
   * @param models - 后端返回的模型列表
   */
  const initModelList = (models: LLMModel[]) => {
    modelList.value = models

    const providers = Array.from(
      new Map(
        models.map(m => [
          m.provider.id,
          {
            id: m.provider.id,
            providerName: m.provider.providerName,
            providerLogo: m.provider.providerLogo,
            apiStyle: m.provider.apiStyle,
            status: true
          }
        ])
      ).values()
    )
    providerList.value = providers

    const lastSelected = localStorage.getItem('lastSelectedModel')
    if (lastSelected && models.length > 0) {
      const [providerId, modelId] = lastSelected.split('|')
      const matched = models.find(
        m => m.id === modelId && m.provider.id === providerId
      )
      if (matched) {
        currentModel.value = matched
        return
      }
    }

    if (models.length > 0) {
      currentModel.value = models[0]
    }
  }

  return {
    modelList,
    currentModel,
    providerList,
    isPending,
    currentModelSupportVision,
    currentModelSupportTool,
    allProviderListByKey,
    setCurrentModelExact,
    initModelList,
    loadActiveModels
  }
}
