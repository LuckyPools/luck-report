/**
 * 旧版工作流定义适配器
 * 将现有 WorkflowDefinition 编译为 CompiledReportGraph
 *
 * 目标：现有 WorkflowDefinition 数据零修改即可用新引擎执行
 * 新代码优先用 StateGraph 写，旧代码逐步迁移
 */

import type { WorkflowDefinition, WorkflowStep, WorkflowContext } from '../types'
import type { ToolRegistry } from '../../tools/registry'
import type { MemoryManager } from '../../memory/memory-manager'
import type { ContextManager } from '../../core/context-manager'
import {
  ReportStateGraph,
  CompiledReportGraph,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from './index'
import type { StateFieldReducer, ReportWorkflowState } from './state'
import { reportStateSchema } from './state'
import { LLMDecideNode } from './llm/llm-decide-node.ts'
import type { WorkflowRuntime, LLMCaller } from './runtime'

/**
 * 将旧版 WorkflowDefinition 编译为 CompiledReportGraph
 *
 * @param definition - 旧版工作流定义，WorkflowDefinition，不可为空
 * @param subworkflows - 子工作流注册表，Record<string, WorkflowDefinition>，可选
 * @returns 编译后的可执行图，CompiledReportGraph
 */
export function compileLegacyWorkflow(
  definition: WorkflowDefinition,
  subworkflows?: Record<string, WorkflowDefinition>
): CompiledReportGraph {
  // 1. 构建 state schema（基于 reportStateSchema 扩展）
  const schema = { ...reportStateSchema }

  // 2. 创建图构建器
  const graph = new ReportStateGraph(schema, {
    input: { userMessage: true, intent: true },
    output: { cellsData: true, pageConfig: true }
  })

  // 3. 步骤 → Node
  for (const step of definition.steps) {
    if (step.tool === '_llm_decide') {
      // LLM 决策步骤：创建 LLMDecideNode + LastValueAfterFinishChannel
      const outChannel = new LastValueAfterFinishChannel<Record<string, any>>()
      graph.addChannel(step.id + '_out', outChannel)

      const llmNode = new LLMDecideNode({
        nodeId: step.id,
        allowedTools: step.allowedTools ?? [],
        requiredToolResults: step.requiredToolResults,
        maxIterations: step.maxIterations,
        description: step.description,
        outChannel
      })

      graph.addNode(step.id, llmNode, {
        metadata: { silent: step.silent, description: step.description },
        retryPolicy: step.maxRetries ? {
          maxAttempts: step.maxRetries + 1,
          initialInterval: 500,
          backoffFactor: 2,
          clearMemoryOnRetry: true,
          retryOn: defaultRetryOn
        } : undefined,
        skipWhen: step.condition ? (state: any) => !step.condition({ stepResults: state } as WorkflowContext) : undefined,
        resultValidator: step.resultValidator
          ? (output: any, state: any) => step.resultValidator!(output, { stepResults: state } as WorkflowContext)
          : undefined,
        critical: step.critical
      })
      continue
    }

    if (step.tool === '_subworkflow') {
      // 子工作流步骤：编译子工作流为子图，嵌入为节点
      graph.addNode(step.id, async (state: any, runtime?: any) => {
        // 确定子工作流ID
        let subworkflowId = step.subworkflowId
        if (step.subworkflowSelector) {
          subworkflowId = step.subworkflowSelector({ stepResults: state } as WorkflowContext)
        }
        if (!subworkflowId || !subworkflows) return {}

        const subDef = subworkflows[subworkflowId]
        if (!subDef) return {}

        // 递归编译子工作流
        const subGraph = compileLegacyWorkflow(subDef, subworkflows)
        const result = await subGraph.execute(state, {
          configurable: { runtime },
          recursionLimit: 25
        })
        return result.state
      }, {
        skipWhen: step.condition ? (state: any) => !step.condition({ stepResults: state } as WorkflowContext) : undefined,
        critical: step.critical
      })
      continue
    }

    // 普通步骤：直接调用工具
    graph.addNode(step.id, async (state: any, runtime?: any) => {
      if (!runtime) return {}

      // 生成工具参数
      let params: Record<string, any> = {}
      if (step.dynamicParams) {
        params = step.dynamicParams({ stepResults: state } as WorkflowContext)
      } else if (step.paramTemplate) {
        params = resolveParamTemplate(step.paramTemplate, state)
      }

      // 执行工具
      try {
        const result = await runtime.toolRegistry.executeTool(step.tool, params)
        return { [step.id]: { [step.tool]: result } }
      } catch (err: any) {
        return { errors: [`${step.tool} 执行失败: ${err.message}`] }
      }
    }, {
      metadata: { silent: step.silent, description: step.description },
      retryPolicy: step.maxRetries ? {
        maxAttempts: step.maxRetries + 1,
        initialInterval: 500,
        backoffFactor: 2,
        clearMemoryOnRetry: true,
        retryOn: defaultRetryOn
      } : undefined,
      skipWhen: step.condition ? (state: any) => !step.condition({ stepResults: state } as WorkflowContext) : undefined,
      resultValidator: step.resultValidator
        ? (output: any, state: any) => step.resultValidator!(output, { stepResults: state } as WorkflowContext)
        : undefined,
      critical: step.critical
    })
  }

  // 4. 边：按步骤顺序添加
  const steps = definition.steps
  if (steps.length > 0) {
    graph.addEdge('__start__', steps[0].id)
  }
  for (let i = 0; i < steps.length - 1; i++) {
    graph.addEdge(steps[i].id, steps[i + 1].id)
  }
  if (steps.length > 0) {
    graph.addEdge(steps[steps.length - 1].id, '__end__')
  }

  // 5. 编译
  return graph.compile()
}

/**
 * 解析参数模板中的 {{stepId.field}} 引用
 * @param template - 参数模板，Record<string, any>，不可为空
 * @param state - 当前状态，Record<string, any>，不可为空
 * @returns 解析后的参数，Record<string, any>
 */
function resolveParamTemplate(
  template: Record<string, any>,
  state: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const ref = value.slice(2, -2).trim()
      const [stepId, field] = ref.split('.')
      const stepResult = state[stepId]
      result[key] = field ? stepResult?.[field] : stepResult
    } else {
      result[key] = value
    }
  }
  return result
}
