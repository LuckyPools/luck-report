/**
 * TableManager：handsontable 实例全局单例管理器
 *
 * 工作流程：
 * 1. ContentTable 组件在 onMounted 中调用 set(hot) 注入实例
 * 2. 其他模块（如 ContextMenu / CellRenderer / Operation）通过 get() 拿同一实例进行操作
 * 3. 组件销毁时调用 clear() 安全销毁实例并清空引用
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（注册/清空实例）
 * - src/views/report/designer/edit-table/utils/*（获取实例操作表格）
 * - src/utils/contextActions.ts（操作表格）
 *
 * 迁移说明：
 * - 原 manager.js 的 24 行对象单例保持原样
 * - 改为 TS 强类型：handsontable 实例类型来自 types/handsontable.d.ts
 */
import type { HandsontableInstance } from '@/types/handsontable'

/** TableManager 单例对象 */
const TableManager = {
  /** 当前 handsontable 实例，未初始化时为 null */
  table: null as HandsontableInstance | null,

  /**
   * 获取当前 handsontable 实例
   * @returns 当前实例，未注册时返回 null
   */
  get(): HandsontableInstance | null {
    return this.table
  },

  /**
   * 注册 handsontable 实例（单例替换）
   * @param table handsontable 实例
   */
  set(table: HandsontableInstance): void {
    this.table = table
  },

  /**
   * 判断是否已注册实例
   * @returns true=已注册；false=未注册
   */
  has(): boolean {
    return this.table !== null
  },

  /**
   * 销毁实例并清空引用
   * - 幂等：未注册时直接返回
   * - 安全：调用前会判断 destroy 方法存在
   */
  clear(): void {
    if (this.table && this.table.destroy) {
      this.table.destroy()
    }
    this.table = null
  }
}

export default TableManager
