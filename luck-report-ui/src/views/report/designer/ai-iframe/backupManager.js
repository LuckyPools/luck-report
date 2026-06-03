/**
 * 数据备份还原管理器
 * 用于 AI Agent 修改数据前的备份和异常时的逐步还原
 * 类似撤销步骤存储，限制最多保留最近20次备份
 */

const MAX_BACKUP_STEPS = 20;

const backupStack = [];

/**
 * 推入一条备份数据
 * 当备份数超过上限时，丢弃最早的一条
 *
 * @param {Object} entry - 备份条目
 * @param {string} entry.description - 备份描述，说明修改了什么数据
 * @param {string} entry.type - 备份数据类型，如 'cell'、'mergeCells'、'rowCol'、'datasource' 等
 * @param {Function} entry.restore - 还原函数，调用后可将数据恢复到修改前的状态
 * @return {number} 当前备份栈大小
 */
export function pushBackup(entry) {
    if (backupStack.length >= MAX_BACKUP_STEPS) {
        backupStack.shift();
    }
    backupStack.push({
        step: backupStack.length + 1,
        description: entry.description,
        type: entry.type,
        restore: entry.restore,
        timestamp: Date.now()
    });
    return backupStack.length;
}

/**
 * 弹出最近一条备份数据并执行还原
 * 只能一步步还原，类似撤销操作
 *
 * @return {{ success: boolean, message: string }} 还原结果
 */
export function popAndRestore() {
    if (backupStack.length === 0) {
        return {success: false, message: '没有可还原的备份数据'};
    }
    const entry = backupStack.pop();
    try {
        entry.restore();
        return {success: true, message: `已还原: ${entry.description}`, step: entry.step};
    } catch (e) {
        return {success: false, message: `还原失败: ${e.message}`};
    }
}

/**
 * 获取当前备份栈大小
 * @return {number}
 */
export function getBackupCount() {
    return backupStack.length;
}

/**
 * 获取备份栈摘要信息（不含还原函数，不可序列化函数）
 * @return {Array<{step: number, description: string, type: string, timestamp: number}>}
 */
export function getBackupSummary() {
    return backupStack.map(entry => ({
        step: entry.step,
        description: entry.description,
        type: entry.type,
        timestamp: entry.timestamp
    }));
}

/**
 * 清空备份栈
 */
export function clearBackup() {
    backupStack.length = 0;
}
