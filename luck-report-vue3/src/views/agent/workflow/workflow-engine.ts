/**
 * 工作流执行引擎
 * 代码驱动的工作流编排核心，替代纯提示词的任务规划方案
 *
 * 核心思路：
 * 1. 用户输入 → LLM 只做意图识别（结构化 JSON 输出）
 * 2. 代码根据意图选择工作流模板
 * 3. 按步骤顺序执行，每步由代码控制是否执行
 * 4. 每个步骤内需要 LLM 参与时，调用 LLM 生成工具参数
 * 5. 代码驱动执行工具，将结果写入上下文供后续步骤引用
 *
 * 与原 agent-loop 的关系：
 * - 工作流引擎替代了 agent-loop 中的"LLM 自由规划"部分
 * - 每个步骤内部仍然复用 agent-loop 的 LLM 调用和工具执行机制
 * - 工作流引擎控制"做什么、什么顺序"，agent-loop 控制"怎么做"
 */
import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowContext,
  WorkflowResult,
  WorkflowStepRecord,
  WorkflowStepStatus,
  WorkflowEvent,
  IntentAnalysisResult
} from './types'
import type { ToolRegistry } from '../tools/registry'
import type { MemoryManager } from '../memory/memory-manager'
import type { ContextManager } from '../core/context-manager'
import type { ToolCallInfo } from '../memory/types'

/**
 * 统一的 JSON 解析函数
 * 尝试从 LLM 响应中提取并解析 JSON，不进行格式修复
 * 通过改进工具参数描述来确保 LLM 输出正确格式
 *
 * @param text - LLM 响应文本，string，不可为空
 * @returns 解析后的对象，解析失败返回 null
 */
function parseJsonFromLLMResponse(text: string): Record<string, any> | null {
  let jsonStr = text.trim()

  // 1. 尝试提取 markdown 代码块中的内容
  const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // 2. 尝试直接解析
  try {
    return JSON.parse(jsonStr)
  } catch (firstError) {
    console.warn('[WorkflowEngine] 首次JSON解析失败:', firstError.message)
  }

  // 3. 提取 JSON 片段（去除前后缀文字）
  const firstBrace = jsonStr.indexOf('{')
  const lastBrace = jsonStr.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
  }

  // 4. 再次尝试解析
  try {
    return JSON.parse(jsonStr)
  } catch (secondError) {
    console.error('[WorkflowEngine] JSON解析失败，原始内容:', text.substring(0, 200), '错误:', secondError.message)
    return null
  }
}
import type { TokenUsage } from '@/api/chat'
import { chatStream, type ContextMessage, type SseToolCall } from '@/api/chat'
import { getWorkflowByIntent, getSubworkflowByType } from './workflow-definitions'
import { getIntentAnalysisPrompt, INTENT_ANALYSIS_SCHEMA, getStepPromptTemplate, buildIntentAnalysisTools, buildIntentToolChoice, INTENT_TOOL_NAME } from './intent-prompt'

/**
 * 工作流引擎配置
 */
export interface WorkflowEngineConfig {
  /** 工具注册表 */
  toolRegistry: ToolRegistry
  /** 记忆管理器 */
  memoryManager: MemoryManager
  /** 上下文管理器（构建系统提示词） */
  contextManager: ContextManager
  /** 中断信号 */
  signal?: AbortSignal
  /** 工具确认回调 */
  onToolConfirm?: (toolCall: any) => Promise<boolean>
  /** 会话ID */
  sessionId?: string
  /** 大模型配置ID */
  modelId?: number
  /** 每个步骤内 LLM 的最大循环轮次，默认 5 */
  maxIterationsPerStep: number
  /**
   * 步骤记录变更回调，用于同步任务进度到前端
   * 工作流模式下替代 LLM 调用 todos 工具更新任务列表
   * @param stepRecords - 当前所有步骤记录
   * @param activeStepId - 当前正在执行的步骤ID
   */
  onStepRecordsChange?: (stepRecords: WorkflowStepRecord[], activeStepId?: string) => void
}

/**
 * 工作流引擎
 * 代码驱动的工作流编排，按步骤顺序执行，每步由代码控制
 */
export class WorkflowEngine {
  private config: WorkflowEngineConfig
  /** 工作流执行上下文 */
  private context!: WorkflowContext
  /** 步骤执行记录 */
  private stepRecords: WorkflowStepRecord[] = []

  constructor(config: WorkflowEngineConfig) {
    this.config = config
  }

  /**
   * 执行工作流
   * 完整流程：意图分析 → 选择工作流 → 按步骤执行 → 返回结果
   *
   * @param userMessage - 用户输入消息，string，不可为空
   * @param onEvent - 事件回调，用于 UI 层实时渲染
   * @returns 工作流执行结果
   */
  async execute(
    userMessage: string,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<WorkflowResult> {
    // 初始化上下文
    this.context = {
      userMessage,
      intent: {} as IntentAnalysisResult,
      stepResults: {}
    }
    this.stepRecords = []

    try {
      // 提前获取报表状态，供意图分析判断报表是否存在
      try {
        const { executeCode } = await import('@/views/export/iframe-utils')
        this.context.reportState = await executeCode('getReportSchema()', '*', 3000)
      } catch {
        // 获取报表状态失败不阻塞意图分析
      }

      // 第一步：意图分析
      onEvent({ type: 'workflow_start', workflowId: 'intent_analysis' })
      onEvent({ type: 'step_start', stepId: 'intent_analysis', stepName: '分析用户意图' })

      const intent = await this.analyzeIntent(userMessage, onEvent)
      this.context.intent = intent

      onEvent({ type: 'step_complete', stepId: 'intent_analysis', result: intent })

      // 处理无关意图
      if (intent.intentType === 'irrelevant') {
        const result = this.buildResult(false, '我是报表小助手，请咨询我报表相关的问题哦')
        onEvent({ type: 'workflow_complete', result })
        return result
      }
      if (intent.intentType === 'create_report') {
        const result = this.buildResult(false, '我是报表小助手，请先手动创建一个新报表哦')
        onEvent({ type: 'workflow_complete', result })
        return result
      }

      // 意图分析完成后，输出友好的理解确认消息
      const confirmMsg = this.buildIntentConfirmMessage(intent)
      onEvent({ type: 'step_progress', stepId: 'intent_analysis', message: confirmMsg })

      // 第二步：根据意图选择工作流
      const workflow = getWorkflowByIntent(intent.intentType)
      if (!workflow) {
        const result = this.buildResult(false, `未找到意图类型 "${intent.intentType}" 对应的工作流`)
        onEvent({ type: 'workflow_complete', result })
        return result
      }

      onEvent({ type: 'workflow_start', workflowId: workflow.id })

      // 预初始化所有需要执行的步骤为 pending 状态，让前端一次性展示完整任务规划
      // 根据意图分析结果过滤掉条件不满足的步骤，只显示真正需要执行的任务
      // 递归预初始化子工作流步骤，确保任务列表完整
      this.initializeWorkflowSteps(workflow)
      console.log(`[Steps Debug] 初始化完成，共 ${this.stepRecords.length} 个步骤`)
      this.notifyStepRecordsChange()

      // 第三步：按步骤执行工作流
      for (const step of workflow.steps) {
        if (this.config.signal?.aborted) {
          this.updateStepRecord(step.id, 'cancelled')
          break
        }

        // 条件检查：不满足则跳过（已在预初始化时过滤，此处不发送 step_skip 事件）
        if (step.condition && !step.condition(this.context)) {
          continue
        }

        // 执行步骤
        await this.executeStep(step, onEvent)
      }

      // 构建最终结果
      const hasError = this.stepRecords.some(r => r.status === 'error' && this.isStepCritical(r.stepId, workflow))
      const result = this.buildResult(!hasError)
      onEvent({ type: 'workflow_complete', result })
      return result

    } catch (err: any) {
      if (err.name === 'AbortError') {
        const result = this.buildResult(false, '用户中断执行')
        onEvent({ type: 'workflow_complete', result })
        return result
      }
      const result = this.buildResult(false, err.message || '工作流执行异常')
      onEvent({ type: 'workflow_complete', result })
      return result
    }
  }

  /**
   * 递归预初始化工作流步骤（包括子工作流步骤）
   * 确保任务列表一次性展示完整的任务规划，避免子工作流步骤插入顺序错误
   *
   * @param workflow - 工作流定义
   * @param parentStepId - 父步骤ID，用于生成子步骤的前缀ID和标识层级关系，可选
   */
  private initializeWorkflowSteps(workflow: WorkflowDefinition, parentStepId?: string): void {
    for (const step of workflow.steps) {
      // 条件检查：不满足则跳过，不添加到任务列表
      if (step.condition && !step.condition(this.context)) {
        console.log(`[Steps Debug] 跳过步骤(条件不满足): ${step.id}(${step.name})`)
        continue
      }

      // 生成步骤ID：子工作流步骤需要加前缀
      const stepId = parentStepId ? `${parentStepId}__${step.id}` : step.id

      // 如果是子工作流步骤，先确定子工作流ID，再决定是否添加到任务列表
      if (step.tool === '_subworkflow') {
        // 确定子工作流ID：优先使用 selector 动态选择，其次使用静态 ID
        let subworkflowId: string | undefined
        if (step.subworkflowSelector) {
          subworkflowId = step.subworkflowSelector(this.context)
        }
        if (!subworkflowId && step.subworkflowId) {
          subworkflowId = step.subworkflowId
        }

        // 子工作流ID为空时跳过该步骤（无需执行，也不展示在任务列表中）
        if (!subworkflowId) {
          console.log(`[Steps Debug] 跳过子工作流(未指定ID): ${stepId}(${step.name})`)
          continue
        }

        // 从注册表获取子工作流定义
        const subworkflow = getSubworkflowByType(subworkflowId)
        if (!subworkflow) {
          console.warn(`[Steps Debug] 未找到子工作流定义: ${subworkflowId}`)
          continue
        }

        // 添加步骤记录
        this.stepRecords.push({
          stepId,
          stepName: step.name,
          status: 'pending',
          retryCount: 0,
          parentStepId
        })
        console.log(`[Steps Debug] 添加子工作流步骤: ${stepId}(${step.name}), parent=${parentStepId || '无'}`)

        // 递归预初始化子工作流步骤，传入当前步骤ID作为父步骤ID
        this.initializeWorkflowSteps(subworkflow, stepId)
      } else {
        // 非子工作流步骤，正常添加到任务列表
        this.stepRecords.push({
          stepId,
          stepName: step.name,
          status: 'pending',
          retryCount: 0,
          parentStepId
        })
        console.log(`[Steps Debug] 添加步骤: ${stepId}(${step.name}), parent=${parentStepId || '无'}`)
      }
    }
  }

  /**
   * 意图分析
   * 让 LLM 分析用户输入，输出结构化的意图结果
   * 使用 Function Calling 机制（定义 analyze_intent 伪工具 + tool_choice 强制调用），
   * 确保 LLM 以结构化 JSON 输出，避免自由文本导致解析失败
   *
   * @param userMessage - 用户输入消息，string，不可为空
   * @param onEvent - 事件回调
   * @returns 意图分析结果
   */
  private async analyzeIntent(
    userMessage: string,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<IntentAnalysisResult> {
    // 意图分析使用精简的系统提示词，避免 system.md 中的工具调用描述干扰 JSON 输出
    const intentPrompt = await getIntentAnalysisPrompt()
    const schemaStr = JSON.stringify(INTENT_ANALYSIS_SCHEMA, null, 2)

    // 将 Schema 定义替换到提示词模板的占位符中
    const systemContent = '你是Luck-Report报表助手。\n\n' + intentPrompt.replace('{{INTENT_ANALYSIS_SCHEMA}}', schemaStr)

    // 构建带报表状态上下文的用户消息，让 LLM 能判断当前是否已有打开的报表
    const reportExists = !!this.context.reportState
    const contextPrefix = reportExists ? '[当前报表状态：已有打开的报表]' : '[当前报表状态：没有打开的报表]'
    const contextUserMessage = `${contextPrefix}\n${userMessage}`

    const messages: ContextMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: contextUserMessage }
    ]

    // 构建意图分析专用的工具定义和强制调用策略
    // 将意图分析伪装为 Function Calling 工具，利用 tool_choice 强制 LLM 以结构化 JSON 输出
    const tools = buildIntentAnalysisTools()
    const toolChoice = buildIntentToolChoice()

    console.log('[WorkflowEngine] 意图分析请求参数:', {
      systemPromptLength: systemContent.length,
      systemPromptPreview: systemContent.substring(0, 500) + '...',
      userMessage,
      toolsCount: tools.length,
      toolChoice,
      sessionId: this.config.sessionId,
      modelId: this.config.modelId
    })

    // 优先从 tool_use 事件获取意图 JSON（Function Calling 模式），
    // 兜底从 message 事件获取文本后解析（兼容不支持 tool_choice 的模型）
    let toolUseResult: Record<string, any> | null = null
    let responseText = ''
    let reasoningText = ''

    await chatStream(
      '',
      {
        onMessage: (data) => { responseText += data },
        onReasoning: (data) => {
          reasoningText += data
          onEvent({ type: 'step_reasoning', stepId: 'intent_analysis', content: data })
        },
        onToolUse: (toolCall: SseToolCall) => {
          // 捕获 analyze_intent 工具调用结果
          console.log('[WorkflowEngine] 意图分析收到 tool_use 事件:', toolCall.toolName)
          if (toolCall.toolName === INTENT_TOOL_NAME) {
            toolUseResult = toolCall.input
            console.log('[WorkflowEngine] 意图分析 tool_use 结果:', JSON.stringify(toolCall.input))
          }
        },
        onDone: () => {
          console.log('[WorkflowEngine] 意图分析原始响应(完整):', responseText)
          console.log('[WorkflowEngine] 意图分析响应长度:', responseText.length)
          console.log('[WorkflowEngine] 意图分析思考内容长度:', reasoningText.length)
          if (reasoningText.length > 0) {
            console.log('[WorkflowEngine] 意图分析思考内容(前500字):', reasoningText.substring(0, 500))
          }
        },
        onError: (error) => {
          console.error('[WorkflowEngine] 意图分析SSE错误:', error)
          throw new Error(`意图分析失败: ${error}`)
        }
      },
      this.config.signal,
      undefined,
      undefined,
      messages,
      tools,
      this.config.sessionId,
      this.config.modelId,
      toolChoice
    )

    // 优先使用 Function Calling 返回的结构化结果，兜底解析文本响应
    if (toolUseResult) {
      console.log('[WorkflowEngine] 使用 Function Calling 结果解析意图')
      return this.parseIntentFromObject(toolUseResult)
    }

    console.log('[WorkflowEngine] 意图分析响应文本(流式结束后):', responseText)
    return this.parseIntentJson(responseText)
  }

  /**
   * 从 Function Calling 返回的对象解析意图结果
   * 设置默认值，防止 LLM 遗漏字段
   *
   * @param obj - Function Calling 返回的参数对象，Record<string, any>，不可为空
   * @returns 意图分析结果
   */
  private parseIntentFromObject(obj: Record<string, any>): IntentAnalysisResult {
    console.log('[WorkflowEngine] parseIntentFromObject 输入:', obj)
    return {
      intentType: obj.intentType || 'irrelevant',
      needsDatasourceOperation: obj.needsDatasourceOperation ?? false,
      needsCellOperation: obj.needsCellOperation ?? false,
      needsFormOperation: obj.needsFormOperation ?? false,
      needsPageConfigOperation: obj.needsPageConfigOperation ?? false,
      needsRowColOperation: obj.needsRowColOperation ?? false,
      needsBusinessKnowledge: obj.needsBusinessKnowledge ?? false,
      needsAgentKnowledge: obj.needsAgentKnowledge ?? false,
      needsSchemaSearch: obj.needsSchemaSearch ?? false,
      requiredDocs: obj.requiredDocs || [],
      taskDescription: obj.taskDescription || ''
    }
  }

  /**
   * 解析意图分析 JSON
   * 从 LLM 响应中提取并解析 JSON
   *
   * @param text - LLM 响应文本，string，不可为空
   * @returns 意图分析结果
   */
  private parseIntentJson(text: string): IntentAnalysisResult {
    console.log('[WorkflowEngine] parseIntentJson 输入文本:', text)

    // 使用统一的 JSON 解析函数
    const parsed = parseJsonFromLLMResponse(text)

    if (!parsed) {
      // 解析失败，返回默认值
      console.error('[WorkflowEngine] 意图分析 JSON 解析失败，使用默认值')
      return {
        intentType: 'irrelevant',
        needsDatasourceOperation: false,
        needsCellOperation: false,
        needsFormOperation: false,
        needsPageConfigOperation: false,
        needsRowColOperation: false,
        needsBusinessKnowledge: false,
        needsAgentKnowledge: false,
        needsSchemaSearch: false,
        requiredDocs: [],
        taskDescription: ''
      }
    }

    console.log('[WorkflowEngine] 意图分析结果:', parsed)
    // 设置默认值，防止 LLM 遗漏字段
    return {
      intentType: parsed.intentType || 'irrelevant',
      needsDatasourceOperation: parsed.needsDatasourceOperation ?? false,
      needsCellOperation: parsed.needsCellOperation ?? false,
      needsFormOperation: parsed.needsFormOperation ?? false,
      needsPageConfigOperation: parsed.needsPageConfigOperation ?? false,
      needsRowColOperation: parsed.needsRowColOperation ?? false,
      needsBusinessKnowledge: parsed.needsBusinessKnowledge ?? false,
      needsAgentKnowledge: parsed.needsAgentKnowledge ?? false,
      needsSchemaSearch: parsed.needsSchemaSearch ?? false,
      requiredDocs: parsed.requiredDocs || [],
      taskDescription: parsed.taskDescription || ''
    }
  }

  /**
   * 执行单个工作流步骤
   * 根据步骤类型决定执行方式：
   * - tool 为具体工具名：直接调用工具（needsLLM 决定是否先让 LLM 生成参数）
   * - tool 为 '_llm_decide'：LLM 自主决定调用哪些工具（进入 mini agent loop）
   * - tool 为 '_subworkflow'：执行子工作流，根据 subworkflowSelector 或 subworkflowId 确定子工作流
   *
   * @param step - 工作流步骤定义
   * @param onEvent - 事件回调
   */
  private async executeStep(
    step: WorkflowStep,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    console.log(`[Steps Debug] 开始执行步骤: ${step.id}(${step.name})`)
    onEvent({ type: 'step_start', stepId: step.id, stepName: step.name, silent: step.silent })
    // 步骤已在预初始化时创建，此处只需更新状态为 in_progress
    this.updateStepRecord(step.id, 'in_progress')

    const maxRetries = step.maxRetries ?? 0
    let lastError: string | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (step.tool === '_subworkflow') {
          // 子工作流模式：递归执行子工作流
          await this.executeSubworkflow(step, onEvent)
        } else if (step.tool === '_llm_decide') {
          // LLM 自主决策模式：进入 mini agent loop
          await this.executeLlmDecideStep(step, onEvent)
        } else if (step.needsLLM) {
          // LLM 生成参数模式：先让 LLM 生成参数，再调用工具
          await this.executeLlmParamStep(step, onEvent)
        } else {
          // 固定参数模式：直接用模板参数调用工具
          await this.executeFixedStep(step, onEvent)
        }

        // 步骤执行成功
        this.updateStepRecord(step.id, 'completed')
        onEvent({ type: 'step_complete', stepId: step.id })
        return

      } catch (err: any) {
        lastError = err.message || '步骤执行失败'
        if (attempt < maxRetries) {
          // 重试前清除该步骤的 stepResults，避免 checkMissingRequiredTools 误判工具已执行
          delete this.context.stepResults[step.id]
          // 重试前将错误信息注入 LLM 记忆，让 LLM 知道上次失败原因并调整策略
          if (step.tool === '_llm_decide' || step.tool === '_subworkflow' || step.needsLLM) {
            this.config.memoryManager.addMessage({
              role: 'user',
              content: `【重试提示】上一轮步骤执行失败，失败原因：${lastError}\n请根据失败原因调整执行策略，避免重复同样的错误。`
            })
          }
          onEvent({ type: 'step_progress', stepId: step.id, message: `第 ${attempt + 1} 次重试...` })
        }
      }
    }

    // 所有重试都失败
    this.updateStepRecord(step.id, 'error', lastError)
    onEvent({ type: 'step_error', stepId: step.id, error: lastError || '步骤执行失败' })

    // 关键步骤失败则抛出异常终止工作流
    // 子工作流步骤失败时始终终止：子工作流抛出异常说明其内部关键步骤已失败，
    // 子操作处于不可恢复状态，继续执行后续步骤没有意义，因此不依赖 critical 标记
    if (step.critical || step.tool === '_subworkflow') {
      throw new Error(`关键步骤 "${step.name}" 执行失败: ${lastError}`)
    }
  }

  /**
   * 执行子工作流
   * 根据 subworkflowSelector 或 subworkflowId 确定子工作流，然后递归执行其步骤
   * 子工作流共享主工作流的上下文（stepResults 等），步骤ID加前缀避免冲突
   *
   * @param step - 主工作流中的子工作流步骤定义
   * @param onEvent - 事件回调
   */
  private async executeSubworkflow(
    step: WorkflowStep,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    // 确定子工作流ID：优先使用 selector 动态选择，其次使用静态 ID
    let subworkflowId: string | undefined
    if (step.subworkflowSelector) {
      subworkflowId = step.subworkflowSelector(this.context)
    }
    if (!subworkflowId && step.subworkflowId) {
      subworkflowId = step.subworkflowId
    }
    if (!subworkflowId) {
      // 子工作流ID为空时跳过该步骤（如 subworkflowSelector 根据条件返回 undefined 表示无需执行）
      console.log(`[WorkflowEngine] 子工作流步骤 "${step.name}" 未指定子工作流ID，跳过执行`)
      return
    }

    // 从注册表获取子工作流定义
    const subworkflow = getSubworkflowByType(subworkflowId)
    if (!subworkflow) {
      throw new Error(`未找到子工作流: ${subworkflowId}`)
    }

    console.log(`[Steps Debug] 执行子工作流: ${subworkflow.name}(${subworkflow.id}), 主步骤=${step.id}`)
    onEvent({ type: 'workflow_start', workflowId: subworkflow.id })

    // 子工作流步骤已在主工作流预初始化时添加到 stepRecords
    // 此处只需按步骤执行，并根据条件检查移除不满足条件的步骤

    // 按步骤执行子工作流
    for (const subStep of subworkflow.steps) {
      const prefixedStepId = `${step.id}__${subStep.id}`
      if (this.config.signal?.aborted) {
        // 从列表中移除未执行的子步骤
        this.removeStepRecord(prefixedStepId)
        break
      }

      // 条件检查：不满足则从列表中移除，不执行
      if (subStep.condition && !subStep.condition(this.context)) {
        this.removeStepRecord(prefixedStepId)
        onEvent({ type: 'step_skip', stepId: prefixedStepId, reason: '条件不满足，跳过', silent: subStep.silent })
        continue
      }

      // 子工作流步骤使用带前缀的ID，但 stepResults 仍用子步骤原始ID存储
      // 这样子工作流内的步骤可以通过 ctx.stepResults[subStep.id] 引用前序步骤结果
      await this.executeSubworkflowStep(subStep, step.id, onEvent)
    }

    // 将子工作流整体结果存入主工作流的 stepResults
    this.context.stepResults[step.id] = {
      subworkflowId: subworkflow.id,
      subworkflowName: subworkflow.name,
      completed: true
    }

    onEvent({ type: 'step_complete', stepId: step.id, result: { subworkflowId: subworkflow.id } })
  }

  /**
   * 执行子工作流中的单个步骤
   * 与 executeStep 逻辑一致，但步骤ID带父步骤前缀，stepResults 使用子步骤原始ID
   *
   * @param subStep - 子工作流步骤定义
   * @param parentStepId - 父步骤ID，用于生成带前缀的步骤ID
   * @param onEvent - 事件回调
   */
  private async executeSubworkflowStep(
    subStep: WorkflowStep,
    parentStepId: string,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    const prefixedStepId = `${parentStepId}__${subStep.id}`
    console.log(`[Steps Debug] 开始执行子步骤: ${prefixedStepId}(${subStep.name}), parent=${parentStepId}`)
    onEvent({ type: 'step_start', stepId: prefixedStepId, stepName: subStep.name, silent: subStep.silent })
    // 子工作流步骤已在预初始化时创建，此处只需更新状态为 in_progress
    this.updateStepRecord(prefixedStepId, 'in_progress')

    const maxRetries = subStep.maxRetries ?? 0
    let lastError: string | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (subStep.tool === '_subworkflow') {
          // 嵌套子工作流（暂不支持，防止过深嵌套）
          throw new Error('子工作流内不支持嵌套子工作流')
        } else if (subStep.tool === '_llm_decide') {
          await this.executeLlmDecideStep(subStep, onEvent)
        } else if (subStep.needsLLM) {
          await this.executeLlmParamStep(subStep, onEvent)
        } else {
          await this.executeFixedStep(subStep, onEvent)
        }

        // 步骤执行成功
        this.updateStepRecord(prefixedStepId, 'completed')
        onEvent({ type: 'step_complete', stepId: prefixedStepId })

        // 子步骤结果同时以 prefixedStepId 存入，确保 condition 函数能通过两种 key 引用
        if (this.context.stepResults[subStep.id] && !this.context.stepResults[prefixedStepId]) {
          this.context.stepResults[prefixedStepId] = this.context.stepResults[subStep.id]
        }
        return

      } catch (err: any) {
        lastError = err.message || '步骤执行失败'
        if (attempt < maxRetries) {
          // 重试前清除该子步骤的 stepResults，避免 checkMissingRequiredTools 误判工具已执行
          delete this.context.stepResults[subStep.id]
          delete this.context.stepResults[prefixedStepId]
          // 重试前将错误信息注入 LLM 记忆，让 LLM 知道上次失败原因并调整策略
          if (subStep.tool === '_llm_decide' || subStep.tool === '_subworkflow' || subStep.needsLLM) {
            this.config.memoryManager.addMessage({
              role: 'user',
              content: `【重试提示】上一轮步骤执行失败，失败原因：${lastError}\n请根据失败原因调整执行策略，避免重复同样的错误。`
            })
          }
          onEvent({ type: 'step_progress', stepId: prefixedStepId, message: `第 ${attempt + 1} 次重试...` })
        }
      }
    }

    // 所有重试都失败
    this.updateStepRecord(prefixedStepId, 'error', lastError)
    onEvent({ type: 'step_error', stepId: prefixedStepId, error: lastError || '步骤执行失败' })

    // 关键步骤失败则抛出异常终止子工作流
    if (subStep.critical) {
      throw new Error(`子工作流关键步骤 "${subStep.name}" 执行失败: ${lastError}`)
    }
  }

  /**
   * 执行 LLM 自主决策步骤
   * 进入 mini agent loop，LLM 自主决定调用哪些工具完成当前步骤
   * 与原 agent-loop 类似，但限制在当前步骤的范围内
   *
   * @param step - 工作流步骤定义
   * @param onEvent - 事件回调
   */
  private async executeLlmDecideStep(
    step: WorkflowStep,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    const { toolRegistry, memoryManager, contextManager, signal } = this.config

    console.log(`[Steps Debug] LLM决策步骤: ${step.id}(${step.name})`)

    // 构建步骤专属提示词
    const previousResultsSummary = this.buildPreviousResultsSummary()
    const stepPrompt = getStepPromptTemplate(
      step.name,
      step.description || '',
      this.context.intent.taskDescription,
      previousResultsSummary
    )

    // 将步骤提示词作为用户消息追加到记忆
    memoryManager.addMessage({ role: 'user', content: stepPrompt })

    // 获取工具列表，根据步骤白名单过滤
    const allTools = toolRegistry.toApiFormat()
    const tools = step.allowedTools
      ? allTools.filter(t => step.allowedTools!.includes(t.name))
      : allTools

    // Mini agent loop：限制轮次，只完成当前步骤
    // 优先使用步骤级别的 maxIterations，未指定则使用引擎全局配置
    const maxIterations = step.maxIterations ?? this.config.maxIterationsPerStep
    // 步骤内缓存系统提示词，写操作导致缓存失效后重建
    let cachedSystemPrompt = await contextManager.buildSystemPrompt()

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (signal?.aborted) {
        throw new Error('用户中断执行')
      }

      // 使用缓存的系统提示词，避免每轮重复构建（含 executeCode 调用）
      const systemPrompt = cachedSystemPrompt
      const contextMessages = memoryManager.getContextMessages()

      // 合并 system 消息
      const apiMessages = this.buildApiMessages(contextMessages, systemPrompt)

      // SSE 流式请求
      let assistantContent = ''
      const toolCalls: any[] = []
      const rawToolCalls: ToolCallInfo[] = []
      let hasError = false
      let errorMessage = ''

      await chatStream(
        '',
        {
          onMessage: (data) => {
            assistantContent += data
            onEvent({ type: 'step_progress', stepId: step.id, message: data })
          },
          onReasoning: (data) => {
            onEvent({ type: 'step_reasoning', stepId: step.id, content: data })
          },
          onToolUse: (sseToolCall: SseToolCall) => {
            const toolCall = {
              toolCallId: sseToolCall.toolCallId,
              toolName: sseToolCall.toolName,
              input: sseToolCall.input,
              status: 'pending' as const
            }
            toolCalls.push(toolCall)
            rawToolCalls.push({
              id: sseToolCall.toolCallId,
              type: 'function',
              function: {
                name: sseToolCall.toolName,
                arguments: JSON.stringify(sseToolCall.input)
              }
            })
            onEvent({ type: 'tool_call', stepId: step.id, toolCallId: sseToolCall.toolCallId, toolName: sseToolCall.toolName, input: sseToolCall.input })
          },
          onTokenUsage: () => {},
          onDone: () => {},
          onError: (error) => {
            hasError = true
            errorMessage = error
          }
        },
        signal,
        undefined,
        undefined,
        apiMessages,
        tools,
        this.config.sessionId,
        this.config.modelId
      )

      if (hasError) {
        throw new Error(errorMessage)
      }

      console.log('[WorkflowEngine] LLM 响应:', {
        步骤ID: step.id,
        文本内容长度: assistantContent.length,
        文本内容预览: assistantContent.substring(0, 200),
        工具调用数量: toolCalls.length,
        工具调用列表: toolCalls.map(t => ({ 工具名: t.toolName, 参数: t.input }))
      })

      // 追加 assistant 消息到记忆
      if (assistantContent.trim() || rawToolCalls.length > 0) {
        memoryManager.addMessage({
          role: 'assistant',
          content: assistantContent,
          toolCalls: rawToolCalls.length > 0 ? rawToolCalls : undefined
        })
      }

      // 没有工具调用，检查是否需要继续执行
      if (toolCalls.length === 0) {
        console.log('[WorkflowEngine] 没有工具调用，检查必需工具:', {
          步骤ID: step.id,
          必需工具列表: step.requiredToolResults,
          当前步骤结果: this.context.stepResults[step.id]
        })

        // 检查是否有必需的工具未执行
        if (step.requiredToolResults && step.requiredToolResults.length > 0) {
          const missingTools = this.checkMissingRequiredTools(step)

          console.log('[WorkflowEngine] 缺失的必需工具:', {
            步骤ID: step.id,
            缺失工具列表: missingTools
          })

          if (missingTools.length > 0) {
            // 有必需工具未执行，给 LLM 一个明确的提示，要求它继续执行
            const toolNames = missingTools.join(', ')
            const reminderMsg = `【重要提示】当前步骤"${step.name}"必须调用以下工具：${toolNames}。\n请立即调用这些工具完成任务，禁止不调用工具就结束步骤。`

            console.log('[WorkflowEngine] 发送提示给 LLM:', {
              步骤ID: step.id,
              提示内容: reminderMsg
            })

            // 将提示追加到记忆，让 LLM 继续执行（仅追加到记忆，不输出到对话）
            memoryManager.addMessage({ role: 'user', content: reminderMsg })

            // 继续循环，让 LLM 有机会调用工具
            continue
          }
        }

        // 没有必需工具未执行，步骤完成
        console.log('[WorkflowEngine] 步骤完成，没有缺失的必需工具:', {
          步骤ID: step.id
        })

        this.validateRequiredToolResults(step)

        // 将 LLM 的文本回复合并到步骤结果中（保留之前轮次已存入的工具结果）
        if (!this.context.stepResults[step.id]) {
          this.context.stepResults[step.id] = {}
        }
        this.context.stepResults[step.id].textResponse = assistantContent
        return
      }

      // 执行工具调用
      for (const toolCall of toolCalls) {
        if (signal?.aborted) {
          throw new Error('用户中断执行')
        }

        const tool = toolRegistry.get(toolCall.toolName)
        if (!tool) {
          const errorMsg = `未找到工具: ${toolCall.toolName}`
          onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify({ error: errorMsg }),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })
          continue
        }

        // allowedTools 校验：确保工具在步骤允许的工具列表中
        if (step.allowedTools && !step.allowedTools.includes(toolCall.toolName)) {
          const errorMsg = `工具 ${toolCall.toolName} 不在当前步骤允许的工具列表中。当前步骤只允许调用: ${step.allowedTools.join(', ')}。请只使用允许的工具完成当前步骤任务。`
          console.warn('[WorkflowEngine] 工具不在允许列表中:', {
            步骤ID: step.id,
            工具名: toolCall.toolName,
            允许的工具列表: step.allowedTools
          })
          onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify({ error: errorMsg }),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })
          continue
        }

        // 参数校验
        const validation = toolRegistry.validateInput(toolCall.toolName, toolCall.input)
        if (!validation.valid) {
          const errorMsg = `参数校验失败: ${validation.errors.join('; ')}`
          onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify({ error: errorMsg }),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })
          continue
        }

        // 数据规范校验（使用工具的 validate 函数）
        if (tool.validate) {
          const dataError = tool.validate(toolCall.input)
          if (dataError) {
            const errorMsg = `数据规范校验失败: ${dataError}\n请修正数据后重新调用工具。参考数据规范文档或调用 get_cell_template/get_dataset_template 获取符合规范的模板。`
            console.log('[WorkflowEngine] 数据规范校验失败:', {
              工具名: toolCall.toolName,
              错误信息: dataError,
              输入参数: toolCall.input
            })
            onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
            memoryManager.addMessage({
              role: 'tool_result',
              content: JSON.stringify({ error: errorMsg }),
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName
            })
            continue
          }
        }

        // 需要确认的工具
        if (tool.requireConfirm && this.config.onToolConfirm) {
          const confirmed = await this.config.onToolConfirm(toolCall)
          if (!confirmed) {
            const errorMsg = '用户拒绝执行此操作'
            onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
            memoryManager.addMessage({
              role: 'tool_result',
              content: JSON.stringify({ error: errorMsg }),
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName
            })
            continue
          }
        }

        // 执行工具
        try {
          const result = await tool.execute(toolCall.input)

          console.log('[WorkflowEngine] 工具执行结果:', {
            步骤ID: step.id,
            工具名: toolCall.toolName,
            工具调用ID: toolCall.toolCallId,
            输入参数: toolCall.input,
            执行结果: result,
            结果类型: typeof result
          })

          // 检查结果是否包含错误信息（工具可能返回 { error: "xxx" } 而不抛出异常）
          const resultError = this.extractResultError(result)
          onEvent({
            type: 'tool_result',
            stepId: step.id,
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            result: resultError ? null : result,
            error: resultError
          })

          // 记录操作
          memoryManager.recordOperation(
            `调用 ${toolCall.toolName}(${JSON.stringify(toolCall.input)}) → ${resultError ? '失败: ' + resultError : '成功'}`
          )

          // 写操作后使缓存失效并重建系统提示词
          if (!tool.readOnly) {
            contextManager.invalidateCache()
            cachedSystemPrompt = await contextManager.buildSystemPrompt()
          }

          // 将结果存入步骤上下文
          if (!this.context.stepResults[step.id]) {
            this.context.stepResults[step.id] = {}
          }
          this.context.stepResults[step.id][toolCall.toolName] = result

          console.log('[WorkflowEngine] 工具结果已存入步骤上下文:', {
            步骤ID: step.id,
            工具名: toolCall.toolName,
            步骤结果: this.context.stepResults[step.id]
          })

          // 追加工具结果到记忆
          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify(resultError ? { error: resultError } : result),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })

        } catch (err: any) {
          const errorMsg = err.message || '工具执行失败'

          console.error('[WorkflowEngine] 工具执行失败:', {
            步骤ID: step.id,
            工具名: toolCall.toolName,
            工具调用ID: toolCall.toolCallId,
            输入参数: toolCall.input,
            错误信息: errorMsg,
            错误堆栈: err.stack
          })

          onEvent({ type: 'tool_result', stepId: step.id, toolCallId: toolCall.toolCallId, toolName: toolCall.toolName, result: null, error: errorMsg })
          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify({ error: errorMsg }),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })
        }
      }

      // 有工具调用，继续循环让 LLM 处理结果
    }

    // 达到最大轮次，校验必需的工具结果
    this.validateRequiredToolResults(step)
    this.context.stepResults[step.id] = { note: '达到最大轮次限制' }
  }

  /**
   * 执行 LLM 生成参数步骤
   * 让 LLM 基于上下文生成工具参数，然后直接调用工具
   *
   * @param step - 工作流步骤定义
   * @param onEvent - 事件回调
   */
  private async executeLlmParamStep(
    step: WorkflowStep,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    const { toolRegistry, memoryManager, signal } = this.config
    console.log(`[Steps Debug] LLM参数步骤: ${step.id}(${step.name}), tool=${step.tool}`)
    const tool = toolRegistry.get(step.tool)
    if (!tool) {
      throw new Error(`未找到工具: ${step.tool}`)
    }

    // 构建参数生成提示词
    const previousResultsSummary = this.buildPreviousResultsSummary()
    const prompt = `当前步骤：${step.name}
步骤说明：${step.description || ''}
用户需求：${this.context.intent.taskDescription}
${previousResultsSummary ? `前序步骤结果：\n${previousResultsSummary}` : ''}

请生成调用 ${step.tool} 工具的参数。只输出 JSON 参数对象，不要输出其他内容。
工具参数 Schema：${JSON.stringify(tool.inputSchema)}`

    // 调用 LLM 生成参数
    const messages: ContextMessage[] = [
      { role: 'system', content: await this.config.contextManager.buildSystemPrompt() },
      { role: 'user', content: prompt }
    ]

    let responseText = ''
    await chatStream(
      '',
      {
        onMessage: (data) => { responseText += data },
        onReasoning: (data) => {
          onEvent({ type: 'step_reasoning', stepId: step.id, content: data })
        },
        onDone: () => {},
        onError: (error) => { throw new Error(`参数生成失败: ${error}`) }
      },
      signal,
      undefined,
      undefined,
      messages,
      [],  // 不传工具定义，强制 LLM 输出文本
      this.config.sessionId,
      this.config.modelId
    )

    // 解析参数 JSON，失败时重试一次
    let params = this.parseJsonFromResponse(responseText)
    if (!params) {
      // 将解析错误反馈给 LLM，让其修正输出格式
      const retryPrompt = `你上次的输出无法解析为有效的 JSON 参数对象。请只输出纯 JSON，不要包含任何其他文字、注释或代码块标记。
上次输出：${responseText.substring(0, 500)}
请重新输出 ${step.tool} 工具的 JSON 参数：`

      let retryResponseText = ''
      await chatStream(
        '',
        {
          onMessage: (data) => { retryResponseText += data },
          onReasoning: () => {},
          onDone: () => {},
          onError: (error) => { throw new Error(`参数生成重试失败: ${error}`) }
        },
        signal,
        undefined,
        undefined,
        [
          { role: 'system', content: await this.config.contextManager.buildSystemPrompt() },
          { role: 'user', content: prompt },
          { role: 'assistant', content: responseText },
          { role: 'user', content: retryPrompt }
        ],
        [],
        this.config.sessionId,
        this.config.modelId
      )

      params = this.parseJsonFromResponse(retryResponseText)
      if (!params) {
        throw new Error(`无法解析工具参数（重试后仍失败）: ${retryResponseText}`)
      }
    }

    // 校验参数
    const validation = toolRegistry.validateInput(step.tool, params)
    if (!validation.valid) {
      throw new Error(`参数校验失败: ${validation.errors.join('; ')}`)
    }

    // 需要确认的工具
    if (tool.requireConfirm && this.config.onToolConfirm) {
      const confirmed = await this.config.onToolConfirm({
        toolName: step.tool,
        input: params
      })
      if (!confirmed) {
        throw new Error('用户拒绝执行此操作')
      }
    }

    // 执行工具
    const toolCallId = `wf_${step.id}_${step.tool}`
    onEvent({ type: 'tool_call', stepId: step.id, toolCallId, toolName: step.tool, input: params })

    try {
      const result = await tool.execute(params)

      // 检查结果是否包含错误信息（工具可能返回 { error: "xxx" } 而不抛出异常）
      const resultError = this.extractResultError(result)
      onEvent({
        type: 'tool_result',
        stepId: step.id,
        toolCallId,
        toolName: step.tool,
        result: resultError ? null : result,
        error: resultError
      })

      // 存入步骤结果（保留原始结果，供后续步骤引用）
      this.context.stepResults[step.id] = result

      // 结果校验：工具调用成功不代表业务语义正确，需通过 resultValidator 检查
      if (step.resultValidator) {
        const validationError = step.resultValidator(result, this.context)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      // 如果结果包含错误，视为执行失败
      if (resultError) {
        throw new Error(resultError)
      }

      // 记录操作到记忆
      memoryManager.recordOperation(`调用 ${step.tool}(${JSON.stringify(params)}) → 成功`)

      // 写操作后使缓存失效
      if (!tool.readOnly) {
        this.config.contextManager.invalidateCache()
      }
    } catch (err: any) {
      const errorMsg = err.message || '工具执行失败'
      onEvent({ type: 'tool_result', stepId: step.id, toolCallId, toolName: step.tool, result: null, error: errorMsg })
      throw err
    }
  }

  /**
   * 执行固定参数步骤
   * 直接用模板参数调用工具，不需要 LLM 参与
   *
   * @param step - 工作流步骤定义
   * @param onEvent - 事件回调
   */
  private async executeFixedStep(
    step: WorkflowStep,
    onEvent: (event: WorkflowEvent) => void
  ): Promise<void> {
    const { toolRegistry } = this.config
    console.log(`[Steps Debug] 固定参数步骤: ${step.id}(${step.name}), tool=${step.tool}`)
    const tool = toolRegistry.get(step.tool)
    if (!tool) {
      throw new Error(`未找到工具: ${step.tool}`)
    }

    // 解析参数：优先使用动态参数生成器，其次使用模板参数，最后为空对象
    const params = step.dynamicParams
      ? step.dynamicParams(this.context)
      : step.paramTemplate
        ? this.resolveTemplate(step.paramTemplate)
        : {}

    // 需要确认的工具
    if (tool.requireConfirm && this.config.onToolConfirm) {
      const confirmed = await this.config.onToolConfirm({
        toolName: step.tool,
        input: params
      })
      if (!confirmed) {
        throw new Error('用户拒绝执行此操作')
      }
    }

    // 执行工具
    const toolCallId = `wf_${step.id}_${step.tool}`
    onEvent({ type: 'tool_call', stepId: step.id, toolCallId, toolName: step.tool, input: params })

    try {
      const result = await tool.execute(params)

      // 检查结果是否包含错误信息（工具可能返回 { error: "xxx" } 而不抛出异常）
      const resultError = this.extractResultError(result)
      onEvent({
        type: 'tool_result',
        stepId: step.id,
        toolCallId,
        toolName: step.tool,
        result: resultError ? null : result,
        error: resultError
      })

      // 存入步骤结果（保留原始结果，供后续步骤引用）
      this.context.stepResults[step.id] = result

      // 结果校验：工具调用成功不代表业务语义正确，需通过 resultValidator 检查
      if (step.resultValidator) {
        const validationError = step.resultValidator(result, this.context)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      // 如果结果包含错误，视为执行失败
      if (resultError) {
        throw new Error(resultError)
      }

      // 记录操作到记忆
      this.config.memoryManager.recordOperation(`调用 ${step.tool}(${JSON.stringify(params)}) → 成功`)

      // 写操作后使缓存失效
      if (!tool.readOnly) {
        this.config.contextManager.invalidateCache()
      }
    } catch (err: any) {
      const errorMsg = err.message || '工具执行失败'
      onEvent({ type: 'tool_result', stepId: step.id, toolCallId, toolName: step.tool, result: null, error: errorMsg })
      throw err
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查步骤是否有必需的工具未执行
   * 遍历所有步骤的 stepResults 查找 requiredToolResults 中声明的工具是否已执行
   * 返回未执行的工具名称列表
   *
   * @param step - 工作流步骤定义
   * @returns 未执行的工具名称列表
   */
  private checkMissingRequiredTools(step: WorkflowStep): string[] {
    if (!step.requiredToolResults || step.requiredToolResults.length === 0) {
      return []
    }

    const missingTools: string[] = []

    for (const toolName of step.requiredToolResults!) {
      // 遍历所有步骤结果查找工具执行记录
      let found = false
      for (const stepId of Object.keys(this.context.stepResults)) {
        const stepResult = this.context.stepResults[stepId]
        if (!stepResult || typeof stepResult !== 'object') continue

        if (Object.prototype.hasOwnProperty.call(stepResult, toolName)) {
          found = true
          break
        }
      }

      if (!found) {
        missingTools.push(toolName)
      }
    }

    return missingTools
  }

  /**
   * 校验步骤的必需工具结果
   * 遍历所有步骤的 stepResults 查找 requiredToolResults 中声明的工具是否已执行且结果不为错误
   * 若校验不通过则抛出异常，阻止工作流继续执行
   *
   * @param step - 工作流步骤定义
   */
  private validateRequiredToolResults(step: WorkflowStep): void {
    if (!step.requiredToolResults || step.requiredToolResults.length === 0) {
      return
    }

    console.log('[WorkflowEngine] 开始校验必需工具结果:', {
      步骤ID: step.id,
      步骤名称: step.name,
      必需工具列表: step.requiredToolResults,
      所有步骤结果: this.context.stepResults
    })

    const missingTools: string[] = []
    const failedTools: string[] = []

    for (const toolName of step.requiredToolResults!) {
      // 遍历所有步骤结果查找工具执行记录
      let found = false
      for (const stepId of Object.keys(this.context.stepResults)) {
        const stepResult = this.context.stepResults[stepId]
        if (!stepResult || typeof stepResult !== 'object') continue

        if (Object.prototype.hasOwnProperty.call(stepResult, toolName)) {
          found = true
          const toolResult = stepResult[toolName]
          if (typeof toolResult === 'object' && toolResult !== null && toolResult.error) {
            failedTools.push(toolName)
            console.warn('[WorkflowEngine] 工具执行失败:', {
              步骤ID: step.id,
              工具名: toolName,
              工具结果: toolResult
            })
          } else if (toolResult === 0 || toolResult === false) {
            failedTools.push(toolName)
            console.warn('[WorkflowEngine] 工具返回失败标志:', {
              步骤ID: step.id,
              工具名: toolName,
              工具结果: toolResult
            })
          }
          break
        }
      }

      if (!found) {
        missingTools.push(toolName)
        console.warn('[WorkflowEngine] 工具未执行:', {
          步骤ID: step.id,
          工具名: toolName
        })
      }
    }

    if (missingTools.length > 0 || failedTools.length > 0) {
      const details: string[] = []
      if (missingTools.length > 0) {
        details.push(`未执行: ${missingTools.join(', ')}`)
      }
      if (failedTools.length > 0) {
        details.push(`执行失败: ${failedTools.join(', ')}`)
      }

      console.error('[WorkflowEngine] 必需工具结果校验失败:', {
        步骤ID: step.id,
        步骤名称: step.name,
        缺失工具: missingTools,
        失败工具: failedTools,
        错误详情: details.join('；')
      })

      throw new Error(`步骤 "${step.name}" 必需的工具结果校验不通过 - ${details.join('；')}。禁止捏造数据继续执行。`)
    }

    console.log('[WorkflowEngine] 必需工具结果校验通过:', {
      步骤ID: step.id,
      步骤名称: step.name
    })
  }

  /**
   * 从工具执行结果中提取错误信息
   * 工具可能返回包含错误信息的对象而不抛出异常，需要提取错误信息用于 UI 显示
   *
   * @param result - 工具执行结果，any 类型
   * @returns 错误信息字符串，无错误时返回 null
   */
  private extractResultError(result: any): string | null {
    // 结果为 null 或 undefined，视为无错误
    if (result == null) {
      return null
    }

    // 结果为对象且包含 error 字段
    if (typeof result === 'object' && result !== null) {
      if (result.error) {
        return typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
      }
      // 结果为 0 或 false（与 validateRequiredToolResults 保持一致的判断逻辑）
      if (result === 0 || result === false) {
        return '工具执行返回失败标志'
      }
      // 结果对象中包含 success: false 或 status: 'error' 等常见失败标志
      if (result.success === false) {
        return result.message || '工具执行失败'
      }
      if (result.status === 'error') {
        return result.message || '工具执行失败'
      }
    }

    // 结果为数字 0 或布尔 false（直接返回值，非对象）
    if (result === 0 || result === false) {
      return '工具执行返回失败标志'
    }

    return null
  }

  /**
   * 构建前序步骤结果摘要
   * 供 LLM 生成参数时参考
   * @returns 摘要文本，string
   */
  private buildPreviousResultsSummary(): string {
    const parts: string[] = []
    for (const [stepId, result] of Object.entries(this.context.stepResults)) {
      const record = this.stepRecords.find(r => r.stepId === stepId)
      if (record && record.status === 'completed') {
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result)
        // 截断过长的结果
        const truncated = resultStr.length > 500
          ? resultStr.substring(0, 500) + '...(已截断)'
          : resultStr
        parts.push(`[${record.stepName}]: ${truncated}`)
      }
    }
    return parts.join('\n')
  }

  /**
   * 解析模板参数
   * 将 {{stepId.field}} 格式的引用替换为实际值
   *
   * @param template - 参数模板，Record<string, any>
   * @returns 解析后的参数对象
   */
  private resolveTemplate(template: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        // 替换 {{stepId.field}} 格式的引用
        result[key] = value.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, stepId, field) => {
          const stepResult = this.context.stepResults[stepId]
          if (stepResult && typeof stepResult === 'object') {
            return stepResult[field] ?? value
          }
          return value
        })
      } else {
        result[key] = value
      }
    }
    return result
  }

  /**
   * 从 LLM 响应中解析 JSON
   * 从 LLM 响应中提取并解析 JSON
   *
   * @param text - LLM 响应文本，string
   * @returns 解析后的对象，解析失败返回 null
   */
  private parseJsonFromResponse(text: string): Record<string, any> | null {
    return parseJsonFromLLMResponse(text)
  }

  /**
   * 构建 API 请求消息列表
   * 合并系统提示和上下文消息，处理 system 消息合并
   *
   * @param contextMessages - 上下文消息列表
   * @param systemPrompt - 系统提示词
   * @returns 符合 API 格式的消息数组
   */
  private buildApiMessages(contextMessages: any[], systemPrompt: string): ContextMessage[] {
    const systemParts: string[] = [systemPrompt]
    const nonSystemMessages: ContextMessage[] = []

    for (const msg of contextMessages) {
      if (msg.role === 'system') {
        systemParts.push(msg.content)
      } else {
        nonSystemMessages.push(msg)
      }
    }

    return [
      { role: 'system', content: systemParts.join('\n\n') },
      ...nonSystemMessages
    ]
  }

  /**
   * 记录步骤执行状态，并通知前端同步任务进度
   * @param stepId - 步骤ID，string
   * @param stepName - 步骤名称，string
   * @param status - 执行状态
   */
  private recordStep(stepId: string, stepName: string, status: WorkflowStepStatus): void {
    this.stepRecords.push({
      stepId,
      stepName,
      status,
      retryCount: 0
    })
    console.log(`[Steps Debug] 添加步骤: ${stepId}(${stepName}) -> ${status}`)
    this.notifyStepRecordsChange(stepId)
  }

  /**
   * 更新步骤执行记录，并通知前端同步任务进度
   * @param stepId - 步骤ID，string
   * @param status - 新状态
   * @param error - 错误信息，可选
   */
  private updateStepRecord(stepId: string, status: WorkflowStepStatus, error?: string): void {
    const record = this.stepRecords.find(r => r.stepId === stepId)
    if (record) {
      const oldStatus = record.status
      record.status = status
      if (error) record.error = error
      console.log(`[Steps Debug] 更新状态: ${stepId}(${record.stepName}) ${oldStatus} -> ${status}`)
    } else {
      console.warn(`[Steps Debug] 未找到步骤: ${stepId}`)
    }
    this.notifyStepRecordsChange(stepId)
  }

  /**
   * 从步骤记录列表中移除指定步骤
   * 用于子工作流中条件不满足的步骤，从任务列表中移除而非标记为 cancelled
   * @param stepId - 步骤ID，string
   */
  private removeStepRecord(stepId: string): void {
    const index = this.stepRecords.findIndex(r => r.stepId === stepId)
    if (index !== -1) {
      const removed = this.stepRecords[index]
      this.stepRecords.splice(index, 1)
      console.log(`[Steps Debug] 移除步骤: ${stepId}(${removed.stepName})`)
      this.notifyStepRecordsChange()
    }
  }

  /**
   * 通知前端步骤记录变更，同步任务进度
   * @param activeStepId - 当前活跃步骤ID，可选
   */
  private notifyStepRecordsChange(activeStepId?: string): void {
    if (this.config.onStepRecordsChange) {
      this.config.onStepRecordsChange([...this.stepRecords], activeStepId)
    }
  }

  /**
   * 判断步骤是否为关键步骤
   * @param stepId - 步骤ID，string
   * @param workflow - 工作流定义
   * @returns 是否关键步骤
   */
  private isStepCritical(stepId: string, workflow: WorkflowDefinition): boolean {
    return workflow.steps.find(s => s.id === stepId)?.critical ?? false
  }

  /**
   * 构建意图分析后的用户确认消息
   * 根据意图分析结果，生成友好的理解确认文本，让用户知道 agent 已理解需求
   *
   * @param intent - 意图分析结果
   * @returns 友好的确认消息文本
   */
  private buildIntentConfirmMessage(intent: IntentAnalysisResult): string {
    const parts: string[] = []
    const desc = intent.taskDescription || '您的需求'

    if (intent.intentType === 'modify_report') {
      parts.push(`好的，我已了解您的需求：${desc}`)
      const actions: string[] = []
      if (intent.needsDatasourceOperation) actions.push('配置数据源')
      if (intent.needsCellOperation) actions.push('修改单元格')
      if (intent.needsFormOperation) actions.push('配置查询表单')
      if (intent.needsRowColOperation) actions.push('调整行列结构')
      if (intent.needsPageConfigOperation) actions.push('调整页面配置')
      if (actions.length > 0) {
        parts.push(`接下来我将为您${actions.join('、')}，请稍候。`)
      }
    } else if (intent.intentType === 'analyze_report') {
      parts.push(`好的，我来帮您分析：${desc}`)
    }

    return parts.join('')
  }

  /**
   * 构建工作流执行结果
   * @param success - 是否成功，boolean
   * @param error - 错误信息，可选
   * @returns 工作流执行结果
   */
  private buildResult(success: boolean, error?: string): WorkflowResult {
    return {
      workflowId: this.context.intent?.intentType || 'unknown',
      success,
      stepRecords: [...this.stepRecords],
      error
    }
  }
}
