/**
 * HeaderUtils：行头渲染工具
 *
 * 工作流程：
 * 1. ContentTable 组件在数据加载/行变动后调用 renderRowHeader(hot)
 * 2. 根据 context.rowHeaders 中的 band 类型，给对应行号加上 HR/FR/T/S 标识
 * 3. 通过 hot.updateSettings({ rowHeaders }) 重新渲染行头单元格
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（mount / 行列变更后）
 * - src/views/report/designer/edit-table/utils/operation/*（行操作后调）
 *
 * 迁移说明：
 * - 函数签名不变：renderRowHeader(hot)
 * - hot 参数类型为 HandsontableInstance
 * - 内部 rowHeaders 显式标注 band 联合类型，便于识别所有支持的 band
 */
import { $t } from '@/locales';
import { getContext } from '@/utils/contextActions';
import type { HandsontableInstance } from '@/types/handsontable';
import type { ReportRowHeader } from '@/types/report-def';

/** 行头 band 联合类型（项目实际用到 5 种） */
export type RowHeaderBand = '' | 'headerrepeat' | 'footerrepeat' | 'title' | 'summary'

/** 行头展示项 */
export interface RenderRowHeaderItem {
  rowNumber: number
  band: RowHeaderBand
}

/**
 * 重新渲染行头
 * 读取 context.rowHeaders，按 band 生成带标记的 HTML，拼成行头数组后回写到 handsontable
 *
 * @param hot handsontable 实例
 */
export function renderRowHeader(hot: HandsontableInstance): void {
  const countRows = hot.countRows()
  const headers: string[] = []
  const context = getContext()
  if (!context) return
  const rowHeaders = context.rowHeaders as ReportRowHeader[]
  for (let i = 1; i <= countRows; i++) {
    let type = ''
    for (const header of rowHeaders) {
      if (header.rowNumber === (i - 1)) {
        const band = header.band as RowHeaderBand
        if (band === 'headerrepeat') {
          type = `<span style='color:blue;font-size: 10px' title='` + $t('table.header.hr') + `'>HR</span>`
        } else if (band === 'footerrepeat') {
          type = `<span style='color:#d30a16;font-size: 10px' title='` + $t('table.header.fr') + `'>FR</span>`
        } else if (band === 'title') {
          type = `<span style='color:#d30a16;font-size: 10px' title='` + $t('table.header.t') + `'>T</span>`
        } else if (band === 'summary') {
          type = `<span style='color:#d30a16;font-size: 10px' title='` + $t('table.header.s') + `'>S</span>`
        }
        break
      }
    }
    headers.push(i + type)
  }
  hot.updateSettings({
    rowHeaders: headers
  })
}
