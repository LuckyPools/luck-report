/**
 * 图计算层错误类型定义，参照 LangGraph 错误体系，覆盖工作流执行过程中的各类异常场景
 */

/**
 * 图递归超限错误，当超步执行次数超过 recursionLimit 时抛出
 */
export class GraphRecursionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphRecursionError'
  }
}

/**
 * 图中断错误，当节点调用 interrupt() 时抛出，等待外部恢复，不是真正的错误，是一种控制流机制
 */
export class GraphInterrupt extends Error {
  /** 中断时传递的值，恢复时可供节点读取 */
  readonly value: any

  constructor(value?: any) {
    super('GraphInterrupt')
    this.name = 'GraphInterrupt'
    this.value = value
  }
}

/**
 * 图结构无效错误，编译时发现图结构问题（孤立节点、断边等）时抛出
 */
export class GraphValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphValidationError'
  }
}

/**
 * 节点执行错误，节点函数执行过程中抛出的异常包装
 */
export class NodeExecutionError extends Error {
  /** 出错的节点ID */
  readonly nodeId: string
  /** 原始错误 */
  readonly cause: Error

  constructor(nodeId: string, cause: Error) {
    super(`节点 [${nodeId}] 执行失败: ${cause.message}`)
    this.name = 'NodeExecutionError'
    this.nodeId = nodeId
    this.cause = cause
  }
}

/**
 * 多个节点同一步写入同一 Channel 的冲突错误
 */
export class ConcurrentUpdateError extends Error {
  readonly channelId: string

  constructor(channelId: string) {
    super(`Channel [${channelId}] 在同一步中被多个节点写入`)
    this.name = 'ConcurrentUpdateError'
    this.channelId = channelId
  }
}

/**
 * 检查点恢复错误，从检查点恢复时状态不一致或版本不匹配
 */
export class CheckpointRestoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckpointRestoreError'
  }
}

/**
 * 无效的状态更新错误，节点返回了不符合 state schema 的数据
 */
export class InvalidStateUpdateError extends Error {
  readonly nodeId: string

  constructor(nodeId: string, message: string) {
    super(`节点 [${nodeId}] 返回了无效的状态更新: ${message}`)
    this.name = 'InvalidStateUpdateError'
    this.nodeId = nodeId
  }
}

/**
 * 子图执行错误，子图作为节点嵌入时，子图内部执行失败的包装
 */
export class SubgraphExecutionError extends Error {
  readonly parentNodeId: string
  readonly subgraphError: Error

  constructor(parentNodeId: string, subgraphError: Error) {
    super(`子图节点 [${parentNodeId}] 执行失败: ${subgraphError.message}`)
    this.name = 'SubgraphExecutionError'
    this.parentNodeId = parentNodeId
    this.subgraphError = subgraphError
  }
}

/**
 * 中断恢复值缺失错误，恢复中断的图执行时，未提供所需的恢复值
 */
export class MissingResumeValueError extends Error {
  readonly nodeId: string

  constructor(nodeId: string) {
    super(`节点 [${nodeId}] 需要恢复值但未提供`)
    this.name = 'MissingResumeValueError'
    this.nodeId = nodeId
  }
}
