/**
 * 数据备份还原管理器（TS 版）
 * 参照 luck-report-ui/src/views/report/designer/ai-iframe/backupManager.js
 * 用于 AI Agent 修改数据前的备份和异常时的逐步还原
 * 类似撤销步骤存储，限制最多保留最近 20 次备份
 */

const MAX_BACKUP_STEPS = 20

const backupStack: Array<{
  step: number
  description: string
  type: string
  restore: () => void
  timestamp: number
}> = []

/**
 * 推入一条备份数据
 * 当备份数超过上限时，丢弃最早的一条
 *
 * @param entry 备份条目
 * @param entry.description 备份描述，说明修改了什么数据
 * @param entry.type 备份数据类型，如 'cell' / 'mergeCells' / 'rowCol' / 'datasource' 等
 * @param entry.restore 还原函数，调用后可将数据恢复到修改前的状态
 * @return 当前备份栈大小
 */
export function pushBackup(entry: {
  description: string
  type: string
  restore: () => void
}): number {
  if (backupStack.length >= MAX_BACKUP_STEPS) {
    backupStack.shift()
  }
  backupStack.push({
    step: backupStack.length + 1,
    description: entry.description,
    type: entry.type,
    restore: entry.restore,
    timestamp: Date.now()
  })
  return backupStack.length
}

/**
 * 弹出最近一条备份数据并执行还原
 * 只能一步步还原，类似撤销操作
 */
export function popAndRestore(): {
  success: boolean
  message: string
  step?: number
} {
  if (backupStack.length === 0) {
    return { success: false, message: '没有可还原的备份数据' }
  }
  const entry = backupStack.pop()
  try {
    entry.restore()
    return { success: true, message: `已还原: ${entry.description}`, step: entry.step }
  } catch (e: any) {
    return { success: false, message: `还原失败: ${e?.message ?? String(e)}` }
  }
}

/**
 * 获取当前备份栈大小
 */
export function getBackupCount(): number {
  return backupStack.length
}

/**
 * 获取备份栈摘要信息（不含还原函数，不可序列化函数）
 */
export function getBackupSummary(): Array<{
  step: number
  description: string
  type: string
  timestamp: number
}> {
  return backupStack.map(entry => ({
    step: entry.step,
    description: entry.description,
    type: entry.type,
    timestamp: entry.timestamp
  }))
}

/**
 * 清空备份栈
 */
export function clearBackup(): void {
  backupStack.length = 0
}
