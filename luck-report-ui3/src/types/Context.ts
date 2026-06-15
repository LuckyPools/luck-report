/**
 * Context：报表设计器纯数据上下文
 *
 * 工作流程：
 * 1. Vue 组件（edit-table/index.vue）loadFile 完成后调用 new Context({ reportDef, cellsMap })
 * 2. 实例存到 Vuex（setContext）→ 其他模块通过 getContext() 拿
 * 3. 字段变化由 Vuex mutation 直接修改（保持原引用以提升性能）
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue：构造
 * - src/views/report/designer/edit-table/utils/*：通过 getContext() 消费
 *
 * 迁移说明：
 * - 原 .js 构造传 `vue 组件实例`，再取 `this.reportDef` / `this.cellsMap`；现改为纯数据入参
 * - 字段含义与原代码一致
 */
import type { ReportCell, ReportContext, ReportDef, ReportRowHeader } from '@/types/report-def'

/** Context 构造入参 */
export interface ContextInit {
  /** 报表核心定义（rows / columns / paper / ...） */
  reportDef: ReportDef
  /** 单元格映射（key = `row,col`） */
  cellsMap: Map<string, ReportCell>
}

/**
 * 报表设计器纯数据上下文
 *
 * 只存放数据，不放方法（操作方法由 contextActions.ts 接管）
 */
export default class Context implements ReportContext {
  /** 报表核心定义 */
  reportDef: ReportDef
  /** 单元格映射 */
  cellsMap: Map<string, ReportCell>
  /** 行头列表（由 addRowHeader 填充） */
  rowHeaders: ReportRowHeader[]
  /** 列字母表（A, B, ..., Z, AA, AB, ..., ZZ） */
  LETTERS: string[]
  /**
   * 字符串索引签名 - 对齐 ReportContext 接口
   * - 旧实现下，util 模块经常用 `context[key]` 动态塞一些临时字段
   * - 实现 [key: string]: unknown 兼容历史用法
   */
  [key: string]: unknown

  /**
   * 构造方法
   * @param init 包含 reportDef + cellsMap 的纯数据对象
   */
  constructor(init: ContextInit) {
    this.reportDef = init.reportDef
    this.cellsMap = init.cellsMap
    this.rowHeaders = []
    this.LETTERS = []
    this._initLetters()
  }

  /**
   * 初始化列字母表（用于 colHeaders 渲染）
   * - 大小写不敏感，全部大写
   * - 26 + 26*26 = 702 列以内足够覆盖常见报表
   */
  private _initLetters(): void {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    this.LETTERS = letters.concat([])
    for (let i = 0; i < letters.length; i++) {
      const name = letters[i]
      for (let j = 0; j < letters.length; j++) {
        this.LETTERS.push(name + letters[j])
      }
    }
  }
}
