/**
 * handsontable 实例类型项目内别名
 *
 * 工作流程：
 * - node_modules/handsontable 的 d.ts 公开导出一个类 `Handsontable extends _Handsontable.Core`
 * - 直接 import 该类即可拿到全部官方方法（countRows / getSettings / setDataAtCell / ...）
 * - handsontable-augment.ts 通过交叉类型 `& HandsontableAugment` 把私有字段（view 引用链）合并进来
 * - 之前版本使用 `_Handsontable.Core`，但因 d.ts 是脚本式全局声明，在 module 文件中 TS 偶发无法解析
 *
 * 调用方：
 * - 所有需要 handsontable 实例类型的 .ts/.vue 文件统一从本文件 import HandsontableInstance
 */

/** 触发官方 d.ts 与 handsontable-augment.ts 的全局增强加载（side-effect import） */
import Handsontable from 'handsontable'
import type { HandsontableAugment } from '@/types/handsontable-augment'

/**
 * handsontable 6.2.2 实例类型
 * - 左侧：官方公开类 Handsontable（继承自 _Handsontable.Core，含全部公共方法）
 * - 右侧：HandsontableAugment（项目侧私有字段 view 引用链）
 * - 交叉类型取并集，调用方既能拿到官方方法，也能拿到 view 等私有字段
 */
export type HandsontableInstance = Handsontable & HandsontableAugment
