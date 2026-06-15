<template>
  <a-dropdown trigger="click">
    <a-button :title="t('tools.zxing.title')" type="text" class="info-button">
      <i class="iconfont icon-qrcode"></i>
    </a-button>
    <template #overlay>
      <a-menu @click="handleMenuClick">
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <i :class="item.icon" style="margin-right: 8px"></i>
          <span>{{ item.text }}</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
/**
 * ZxingTool 二维码 / 条形码工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 下拉菜单选择 qrcode/barcode → 写入 type=zxing 单元格 value
 * 2. 推 undo/redo，支持 afterSelectionEnd 重新触发
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - 自定义 ButtonGroup 下拉按钮 → a-dropdown + a-button + a-menu
 * - @/utils/table.js → @/utils/table
 * - data()/methods → ref + 普通函数
 * - 移除 $emit，本组件无对外事件
 *
 * 注意事项：
 * - zxing 单元格 value 结构为 { type, category, source, data, [format], width, height }
 * - undo/redo 链路与原 Vue2 保持一致：先缓存旧 cellDef / cellData，再重做/回滚
 */
import Handsontable from 'handsontable'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { HandsontableInstance } from '@/types/handsontable'
import type { ReportCell, HandsontableSelectionRange } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ZxingTool' })


const { t } = useI18n()
/** zxing 单元格 value 类型 */
interface ZxingCellValue {
  width: number
  height: number
  type: 'zxing'
  category: 'qrcode' | 'barcode'
  source: string
  data: string
  format?: string
}

/** 菜单项 */
type ZxingCategory = 'qrcode' | 'barcode'

interface MenuItem {
  key: ZxingCategory
  text: string
  icon: string
  category: ZxingCategory
}

const menuItems: MenuItem[] = [
  {
    key: 'qrcode',
    text: 'tools.zxing.qrcode',
    icon: 'iconfont icon-qrcode',
    category: 'qrcode'
  },
  {
    key: 'barcode',
    text: 'tools.zxing.barcode',
    icon: 'iconfont icon-barcode',
    category: 'barcode'
  }
]

/** a-menu 点击入口（按 key 分发到具体动作） */
function handleMenuClick(info: MenuInfo): void {
  const target = menuItems.find((it) => it.key === info.key)
  if (target) {
    if (target.category === 'qrcode') {
      insertQRCode()
    } else if (target.category === 'barcode') {
      insertBarCode()
    }
  }
}

/**
 * 检查是否有选中的单元格
 * @returns true=有选择；false=无选择且已弹提示
 */
function checkSelection(): boolean {
  const hot = TableManager.get()
  const selected = hot?.getSelected()
  if (!selected || selected.length === 0) {
    showAlert((window as { $t?: (k: string) => string }).$t?.('selectTargetCellFirst') ?? 'selectTargetCellFirst')
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
  return selected[0]
}

/**
 * 计算单元格合并宽度（用于 zxing 图片的 width）
 */
function buildWidth(colIndex: number, colspan: number | undefined, hot: HandsontableInstance): number {
  const colWidth = hot.getColWidth(colIndex) - 3
  if (!colspan || colspan < 2) return colWidth
  let width = colWidth
  for (let i = colIndex + 1; i < colIndex + colspan; i++) {
    width += hot.getColWidth(i)
  }
  return width
}

/**
 * 计算单元格合并高度（用于 zxing 图片的 height）
 */
function buildHeight(rowIndex: number, rowspan: number | undefined, hot: HandsontableInstance): number {
  const rowHeight = hot.getRowHeight(rowIndex) - 3
  if (!rowspan || rowspan < 2) return rowHeight
  let height = rowHeight
  for (let i = rowIndex + 1; i < rowIndex + rowspan; i++) {
    height += hot.getRowHeight(i)
  }
  return height
}

/**
 * 在选中起始单元格写入二维码 value
 */
function insertQRCode(): void {
  insertZxing('qrcode')
}

/**
 * 在选中起始单元格写入条形码 value
 */
function insertBarCode(): void {
  insertZxing('barcode')
}

/**
 * 写入 zxing 单元格 value 的通用实现
 * @param category 二维码 / 条形码
 */
function insertZxing(category: ZxingCategory): void {
  if (!checkSelection()) return

  const hot = TableManager.get()
  if (!hot) return
  const [startRow, startCol, endRow, endCol] = pickRange()

  const cellDef = getCell(startRow, startCol) as ReportCell | null
  if (!cellDef) return

  // 缓存旧值用于 undo
  const oldCellDefCopy = deepCopy(cellDef) as ReportCell
  const oldCellData = hot.getDataAtCell(startRow, startCol)

  hot.setDataAtCell(startRow, startCol, '')
  const td = hot.getCell(startRow, startCol) as (HTMLElement & { colSpan?: number; rowSpan?: number }) | null
  const width = buildWidth(startCol, td?.colSpan, hot)
  const height = buildHeight(startRow, td?.rowSpan, hot)

  const newCellDef = deepCopy(cellDef) as ReportCell
  const zxingValue: ZxingCellValue = {
    width,
    height,
    type: 'zxing',
    category,
    source: 'text',
    data: ''
  }
  if (category === 'barcode') {
    zxingValue.format = 'CODE_128'
  }
  newCellDef.value = zxingValue as unknown as ReportCell['value']
  setCell(startRow, startCol, newCellDef)

  hot.render()
  setDirty()
  Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)

  undoManager.add({
    redo: () => {
      const currentCellDef = getCell(startRow, startCol) as ReportCell | null
      if (!currentCellDef) return
      const redoNewCellDef = deepCopy(currentCellDef) as ReportCell
      hot.setDataAtCell(startRow, startCol, '')
      const redoTd = hot.getCell(startRow, startCol) as (HTMLElement & { colSpan?: number; rowSpan?: number }) | null
      const redoWidth = buildWidth(startCol, redoTd?.colSpan, hot)
      const redoHeight = buildHeight(startRow, redoTd?.rowSpan, hot)
      const redoValue: ZxingCellValue = {
        width: redoWidth,
        height: redoHeight,
        type: 'zxing',
        category,
        source: 'text',
        data: ''
      }
      if (category === 'barcode') {
        redoValue.format = 'CODE_128'
      }
      redoNewCellDef.value = redoValue as unknown as ReportCell['value']
      setCell(startRow, startCol, redoNewCellDef)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    },
    undo: () => {
      const undoNewCellDef = deepCopy(oldCellDefCopy) as ReportCell
      setCell(startRow, startCol, undoNewCellDef)
      hot.setDataAtCell(startRow, startCol, oldCellData)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    }
  })
}
</script>

<style scoped>
.info-button {
  font-size: 16px;
  margin: 2px 0;
  border: none;
}
</style>
