/**
 * 事件兼容层
 * 将新架构的 StreamEvent 转换为旧版 WorkflowEvent，确保 UI 层无需修改
 *
 * 过渡期使用，新事件 API 稳定后可删除
 */

import type { StreamEvent, UpdatesEventData } from './stream-mode'
import type { WorkflowEvent, WorkflowResult } from '../types'

/**
 * 将新架构 StreamEvent 转换为旧版 WorkflowEvent
 * @param event - 新架构流事件，StreamEvent，不可为空
 * @returns 旧版工作流事件数组（一个 StreamEvent 可能对应多个 WorkflowEvent），WorkflowEvent[]
 */
export function convertStreamEvent(event: StreamEvent): WorkflowEvent[] {
  const results: WorkflowEvent[] = []

  if (event.mode === 'updates') {
    const data = event.event as UpdatesEventData
    const output = data.output ?? {}

    // 根据输出中的 type 字段判断事件类型
    if (output.type === 'step_progress') {
      results.push({
        type: 'step_progress',
        stepId: data.nodeId,
        message: output.message ?? ''
      })
    } else if (output.type === 'step_reasoning') {
      results.push({
        type: 'step_reasoning',
        stepId: data.nodeId,
        content: output.content ?? ''
      })
    } else if (output.type === 'tool_call') {
      results.push({
        type: 'tool_call',
        stepId: data.nodeId,
        toolCallId: output.toolCallId ?? '',
        toolName: output.toolName ?? '',
        input: output.input
      })
    } else if (output.type === 'tool_result') {
      results.push({
        type: 'tool_result',
        stepId: data.nodeId,
        toolCallId: output.toolCallId ?? '',
        toolName: output.toolName ?? '',
        result: output.result,
        error: output.error
      })
    } else if (data.status === 'success') {
      results.push({
        type: 'step_complete',
        stepId: data.nodeId,
        result: data.output
      })
    } else if (data.status === 'failed') {
      results.push({
        type: 'step_error',
        stepId: data.nodeId,
        error: data.error ?? '未知错误'
      })
    } else if (data.status === 'skipped') {
      results.push({
        type: 'step_skip',
        stepId: data.nodeId,
        reason: '条件不满足'
      })
    }
  }

  return results
}

/**
 * 将图执行结果转换为旧版 WorkflowResult
 * @param graphResult - 图执行结果，不可为空
 * @param workflowId - 工作流ID，string，不可为空
 * @returns 旧版工作流结果，WorkflowResult
 */
export function convertGraphResult(graphResult: any, workflowId: string): WorkflowResult {
  return {
    workflowId,
    success: graphResult.success,
    stepRecords: graphResult.stepRecords ?? [],
    error: graphResult.error
  }
}
