/**
 * 步骤检查点，参照 LangGraph Checkpoint 机制，支持断点恢复
 */

/**
 * 步骤检查点，记录图执行到某一步时的完整状态，支持从断点恢复
 */
export interface StepCheckpoint {
  /** 检查点ID */
  id: string
  /** 超步计数 */
  superstepCount: number
  /** 每个 Channel 的版本号快照 */
  channelVersions: Record<string, number>
  /** 每个节点对每个 Channel 看到的版本号 */
  versionsSeen: Record<string, Record<string, number>>
  /** 每个 Channel 的值快照（JSON 序列化） */
  channelSnapshots: Record<string, any>
  /** 创建时间 */
  timestamp: number
  /** 父检查点ID（用于检查点链） */
  parentId?: string
}

/**
 * 检查点管理器，负责检查点的创建、存储和恢复
 */
export class CheckpointManager {
  private checkpoints: Map<string, StepCheckpoint> = new Map()
  private latestId: string | null = null

  /**
   * 保存检查点
   * @param checkpoint - 检查点数据，StepCheckpoint，不可为空
   */
  save(checkpoint: StepCheckpoint): void {
    this.checkpoints.set(checkpoint.id, checkpoint)
    this.latestId = checkpoint.id
  }

  /**
   * 获取最新检查点
   * @returns 最新检查点，StepCheckpoint | null
   */
  getLatest(): StepCheckpoint | null {
    if (!this.latestId) return null
    return this.checkpoints.get(this.latestId) ?? null
  }

  /**
   * 根据ID获取检查点
   * @param id - 检查点ID，string，不可为空
   * @returns 检查点数据，StepCheckpoint | undefined
   */
  getById(id: string): StepCheckpoint | undefined {
    return this.checkpoints.get(id)
  }

  /**
   * 清除所有检查点
   */
  clear(): void {
    this.checkpoints.clear()
    this.latestId = null
  }

  /**
   * 创建检查点
   * @param superstepCount - 超步计数，number，不可为空
   * @param channelVersions - Channel 版本号，Record<string, number>，不可为空
   * @param versionsSeen - 节点版本追踪，Record<string, Record<string, number>>，不可为空
   * @param channelSnapshots - Channel 值快照，Record<string, any>，不可为空
   * @returns 新创建的检查点，StepCheckpoint
   */
  create(
    superstepCount: number,
    channelVersions: Record<string, number>,
    versionsSeen: Record<string, Record<string, number>>,
    channelSnapshots: Record<string, any>
  ): StepCheckpoint {
    const id = `cp_${superstepCount}_${Date.now()}`
    const checkpoint: StepCheckpoint = {
      id,
      superstepCount,
      channelVersions,
      versionsSeen,
      channelSnapshots,
      timestamp: Date.now(),
      parentId: this.latestId ?? undefined
    }
    this.save(checkpoint)
    return checkpoint
  }
}
