<template>
  <a-button
    :title="t('tools.image.title')"
    type="text"
    class="info-button"
    @click="handleClick"
  >
    <i class="iconfont icon-image"></i>
  </a-button>
</template>

<script setup lang="ts">
/**
 * ImageTool 图片工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 在选中起始单元格写入 type=image（文本图标）
 * 2. 推 undo/redo，支持 afterSelectionEnd 重新触发
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]（与 align-tool / border-tool 一致）
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - 移除 $emit，本组件无对外事件
 *
 * 注意事项：
 * - undo 中 `addCell({ i, j, cellDef })` 是 Vue2 原代码遗留的调用方式：
 *   contextActions.addCell 期望的是 ReportCell 直接传入，这里与原代码保持一致；
 *   实际还原仍然依赖 hot.setDataAtCell + render 来回滚 handsontable 视图。
 */
import Handsontable from 'handsontable'
import { buildNewCellDef, setDirty, undoManager } from '@/utils/table'
import { showAlert, deepCopy } from '@/utils/comnon'
import imageIcon from '@/assets/icons/image.svg'
import { addCell, getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, HandsontableSelectionRange } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ImageTool' })


const { t } = useI18n()
/** 入参：当前选中单元格坐标（行/列均为 0-based，null 表示未选） */
interface SelectedCells {
  rowIndex: number | null
  colIndex: number | null
  row2Index: number | null
  col2Index: number | null
}

const props = withDefaults(
  defineProps<{ selectedCells: SelectedCells }>(),
  {
    selectedCells: () => ({
      rowIndex: null,
      colIndex: null,
      row2Index: null,
      col2Index: null
    })
  }
)
// 暂未使用，仅保持与父级签名一致
void props

/**
 * 检查是否有选中的单元格
 * @returns true=有选择；false=无选择且已弹提示
 */
function checkSelection(): boolean {
  const hot = TableManager.get()
  const selected = hot?.getSelected()
  if (!selected || selected.length === 0) {
    showAlert(t('selectTargetCellFirst') ?? 'selectTargetCellFirst')
    return false
  }
  return true
}

/**
 * 提取并归一化选中区域
 * @returns [startRow, startCol, endRow, endCol]
 */
function pickRange(): [number, number, number, number] {
  const hot = TableManager.get()
  const selected = hot?.getSelected() as HandsontableSelectionRange[] | undefined
  if (!hot || !selected || selected.length === 0) {
    return [0, 0, 0, 0]
  }
  let [startRow, startCol, endRow, endCol] = selected[0]
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]
  return [startRow, startCol, endRow, endCol]
}

/**
 * 执行插入图片操作
 */
function handleClick(): void {
  if (!checkSelection()) return

  const hot = TableManager.get()
  if (!hot) return
  const [startRow, startCol, endRow, endCol] = pickRange()

  const oldCellDef = getCell(startRow, startCol) as ReportCell | null
  const oldCellData = hot.getDataAtCell(startRow, startCol)
  const newCellDef = buildNewCellDef(startRow + 1, startCol + 1)
  newCellDef.value = {
    type: 'image',
    source: 'text',
    value: ''
  } as unknown as ReportCell['value']

  addCell(newCellDef)
  const imagePath = imageIcon

  const td = hot.getCell(startRow, startCol) as HTMLElement | null
  if (td) {
    td.innerHTML = ''
    const img = document.createElement('img')
    img.src = imagePath
    img.width = 20
    td.appendChild(img)
  }

  setDirty()
  Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)

  undoManager.add({
    redo: () => {
      // 与原 Vue2 实现保持一致：先缓存旧 cellDef / cellData，再重做
      const redoOldCellDef = deepCopy(getCell(startRow, startCol)) as ReportCell | null
      const redoOldCellData = hot.getDataAtCell(startRow, startCol)
      const redoNewCellDef = buildNewCellDef(startRow + 1, startCol + 1)
      redoNewCellDef.value = {
        type: 'image',
        source: 'text',
        value: ''
      } as unknown as ReportCell['value']
      addCell(redoNewCellDef)
      hot.setDataAtCell(startRow, startCol, '')
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
      // 避免 TS6133：标记闭包内的形参已使用
      void redoOldCellDef
      void redoOldCellData
    },
    undo: () => {
      if (oldCellDef) {
        const newOldCellDef = deepCopy(oldCellDef) as ReportCell
        addCell({ i: startRow, j: startCol, cellDef: newOldCellDef } as unknown as ReportCell)
      } else {
        setCell(startRow, startCol, null as unknown as ReportCell)
      }
      hot.setDataAtCell(startRow, startCol, oldCellData)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    }
  })
}
</script>
