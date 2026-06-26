<template>
  <div class="u-inline">
    <a-dropdown trigger="click">
      <a-button type="text" :title="t('tools.border.borderLine')" class="info-button">
        <i class="iconfont icon-no-border"></i>
      </a-button>
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item v-for="item in menuItems" :key="item.key">
            <i :class="item.icon" style="margin-right: 8px"></i>
            <span>{{ t(item.text) }}</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 自定义边框对话框 -->
    <CustomBorderDialog
      :visible="customBorderVisible"
      :topBorder="customBorderData.topBorder"
      :bottomBorder="customBorderData.bottomBorder"
      :leftBorder="customBorderData.leftBorder"
      :rightBorder="customBorderData.rightBorder"
      @close="customBorderVisible = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * BorderTool 边框工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击菜单 → 全/无/左/右/上/下/自定义 边框
 * 2. 自定义边框弹出 CustomBorderDialog → handleSave 应用
 * 3. 每次操作走 undo/redo 链路
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - ButtonGroup（自定义下拉按钮）→ a-dropdown + a-button + a-menu
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → ref + reactive + 普通函数
 * - 移除 $emit，本组件无对外事件
 */
import { reactive, ref } from 'vue'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert, deepCopy } from '@/utils/comnon'
import { rgbToHex } from '@/utils/color'
import CustomBorderDialog from '@/views/report/designer/resource-panel/property-panel/custom-border-dialog/index.vue'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BorderTool' })


const { t } = useI18n()
/** 边框对象 */
interface BorderStyle {
  width: number
  color: string
  style: string
}

/** 单元格 key → 原 4 边框快照（用于 undo 恢复） */
type OldBorderMap = Record<string, {
  leftBorder: BorderStyle | string
  rightBorder: BorderStyle | string
  topBorder: BorderStyle | string
  bottomBorder: BorderStyle | string
}>

/** 边框应用目标 */
type BorderTarget = 'left' | 'right' | 'top' | 'bottom' | null

/** 自定义边框对话框初始值 */
const customBorderVisible = ref<boolean>(false)
const customBorderData = reactive<{
  topBorder: BorderStyle
  bottomBorder: BorderStyle
  leftBorder: BorderStyle
  rightBorder: BorderStyle
}>({
  topBorder: { style: 'solid', width: 1, color: '#000000' },
  bottomBorder: { style: 'solid', width: 1, color: '#000000' },
  leftBorder: { style: 'solid', width: 1, color: '#000000' },
  rightBorder: { style: 'solid', width: 1, color: '#000000' }
})

/** 菜单项（text 存 i18n key，模板内通过 $t 翻译） */
const menuItems: Array<{ key: string; text: string; icon: string; action: () => void }> = [
  {
    key: 'full',
    text: 'tools.border.allLine',
    icon: 'iconfont icon-full-border',
    action: () => handleFullBorder()
  },
  {
    key: 'none',
    text: 'tools.border.noBorder',
    icon: 'iconfont icon-no-border',
    action: () => handleNoBorder()
  },
  {
    key: 'left',
    text: 'tools.border.leftBorder',
    icon: 'iconfont icon-left-border',
    action: () => handleLeftBorder()
  },
  {
    key: 'right',
    text: 'tools.border.rightBorder',
    icon: 'iconfont icon-right-border',
    action: () => handleRightBorder()
  },
  {
    key: 'top',
    text: 'tools.border.topBorder',
    icon: 'iconfont icon-top-border',
    action: () => handleTopBorder()
  },
  {
    key: 'bottom',
    text: 'tools.border.bottomBorder',
    icon: 'iconfont icon-bottom-border',
    action: () => handleBottomBorder()
  },
  {
    key: 'custom',
    text: 'tools.border.customBorder',
    icon: 'iconfont icon-full-border',
    action: () => handleCustomBorder()
  }
]

/** a-menu 点击入口（按 key 分发到具体动作） */
function handleMenuClick(info: MenuInfo): void {
  const target = menuItems.find((it) => it.key === info.key)
  target?.action()
}

/**
 * 检查是否有选中的单元格
 * @returns true=有选择；false=无选择且已弹提示
 */
function checkSelection(): boolean {
  const hot = TableManager.get()
  const selected = hot?.getSelected()
  if (!selected || selected.length === 0) {
    showAlert(t('selectTargetCellFirst'))
    return false
  }
  return true
}

/**
 * 提取并归一化选中区域
 * @returns [startRow, startCol, endRow, endCol]
 */
function pickRange(table: HandsontableInstance): [number, number, number, number] {
  const selected = table.getSelected()
  let [startRow, startCol, endRow, endCol] = selected[0]
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]
  return [startRow, startCol, endRow, endCol]
}

/**
 * 处理全边框
 */
function handleFullBorder(): void {
  applyBorder(null, {
    width: 1,
    color: '0,0,0',
    style: 'solid'
  })
}

/**
 * 处理无边框
 */
function handleNoBorder(): void {
  applyBorder(null, '')
}

/** 通用动作：处理单边边框 */
function handleLeftBorder(): void {
  applyBorder('left', { width: 1, color: '0,0,0', style: 'solid' })
}
function handleRightBorder(): void {
  applyBorder('right', { width: 1, color: '0,0,0', style: 'solid' })
}
function handleTopBorder(): void {
  applyBorder('top', { width: 1, color: '0,0,0', style: 'solid' })
}
function handleBottomBorder(): void {
  applyBorder('bottom', { width: 1, color: '0,0,0', style: 'solid' })
}

/**
 * 应用边框（写 store + 推 undo）
 * @param target 边框目标，null 表示四边统一
 * @param newBorder 新边框值（对象或空串）
 */
function applyBorder(target: BorderTarget, newBorder: BorderStyle | string): void {
  if (!checkSelection()) return
  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldBorderStyle = updateBorderStyles(startRow, startCol, endRow, endCol, newBorder, target)
  table.render()

  undoManager.add({
    redo: () => {
      updateBorderStyles(startRow, startCol, endRow, endCol, newBorder, target)
      table.render()
      setDirty()
    },
    undo: () => {
      updateOldBorderStyles(startRow, startCol, endRow, endCol, oldBorderStyle)
      setDirty()
    }
  })
  setDirty()
}

/**
 * 弹出自定义边框对话框
 */
function handleCustomBorder(): void {
  if (!checkSelection()) return

  const table = TableManager.get()
  if (!table) return
  const selected = table.getSelected()
  const [startRow, startCol] = selected[0]
  const cellDef = getCell(startRow, startCol) as ReportCell | null

  const defaultBorderStyle: BorderStyle = { style: 'solid', width: 1, color: '#000000' }

  const convertColorToHex = (borderStyle: unknown): BorderStyle => {
    if (!borderStyle || borderStyle === '') {
      return { style: 'none', width: 1, color: '#000000' }
    }
    const result = { ...(borderStyle as BorderStyle) }
    if (result.style === 'none') {
      return { style: 'none', width: 1, color: '#000000' }
    }
    if (typeof result.color === 'string' && result.color.includes(',')) {
      const rgb = result.color.split(',')
      result.color = rgbToHex(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10))
    }
    return result
  }

  if (cellDef && cellDef.cellStyle) {
    const cs = cellDef.cellStyle as ReportCellStyle
    customBorderData.topBorder = convertColorToHex(cs.topBorder)
    customBorderData.bottomBorder = convertColorToHex(cs.bottomBorder)
    customBorderData.leftBorder = convertColorToHex(cs.leftBorder)
    customBorderData.rightBorder = convertColorToHex(cs.rightBorder)
  } else {
    customBorderData.topBorder = { ...defaultBorderStyle }
    customBorderData.bottomBorder = { ...defaultBorderStyle }
    customBorderData.leftBorder = { ...defaultBorderStyle }
    customBorderData.rightBorder = { ...defaultBorderStyle }
  }

  customBorderVisible.value = true
}

/** 自定义边框保存事件 */
function handleSave(
  arg1: BorderStyle | { topBorder: BorderStyle; bottomBorder: BorderStyle; leftBorder: BorderStyle; rightBorder: BorderStyle },
  bottomBorderArg?: BorderStyle,
  leftBorderArg?: BorderStyle,
  rightBorderArg?: BorderStyle
): void {
  const table = TableManager.get()
  if (!table) return
  const selected = table.getSelected()
  const [startRow, startCol, endRow, endCol] = selected[0]

  // CustomBorderDialog 在有 cellStyle 时传一个对象；否则按 4 个参数顺序传
  let topBorder: BorderStyle
  let bottomBorder: BorderStyle
  let leftBorder: BorderStyle
  let rightBorder: BorderStyle
  if (
    bottomBorderArg === undefined &&
    leftBorderArg === undefined &&
    rightBorderArg === undefined &&
    typeof arg1 === 'object' &&
    arg1 !== null &&
    'topBorder' in arg1
  ) {
    const payload = arg1 as {
      topBorder: BorderStyle
      bottomBorder: BorderStyle
      leftBorder: BorderStyle
      rightBorder: BorderStyle
    }
    topBorder = payload.topBorder
    bottomBorder = payload.bottomBorder
    leftBorder = payload.leftBorder
    rightBorder = payload.rightBorder
  } else {
    topBorder = arg1 as BorderStyle
    bottomBorder = bottomBorderArg as BorderStyle
    leftBorder = leftBorderArg as BorderStyle
    rightBorder = rightBorderArg as BorderStyle
  }

  const oldBorderStyle = updateCustomBorderStyle(
    startRow, startCol, endRow, endCol,
    leftBorder, rightBorder, topBorder, bottomBorder
  )

  undoManager.add({
    redo: () => {
      updateCustomBorderStyle(
        startRow, startCol, endRow, endCol,
        leftBorder, rightBorder, topBorder, bottomBorder
      )
      setDirty()
    },
    undo: () => {
      updateOldBorderStyles(startRow, startCol, endRow, endCol, oldBorderStyle)
      setDirty()
    }
  })
  setDirty()
}

/**
 * 深拷贝边框对象
 */
function cloneBorder(border: BorderStyle | string): BorderStyle | string {
  if (border && border !== '') {
    const text = JSON.stringify(border)
    return JSON.parse(text) as BorderStyle
  }
  return border
}

/**
 * 写入自定义边框（4 边）
 * @returns 旧边框快照
 */
function updateCustomBorderStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  leftBorderStyle: BorderStyle | string,
  rightBorderStyle: BorderStyle | string,
  topBorderStyle: BorderStyle | string,
  bottomBorderStyle: BorderStyle | string
): OldBorderMap {
  const oldBorderStyle: OldBorderMap = {}
  const table = TableManager.get()
  if (!table) return oldBorderStyle

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldBorderStyle[`${i},${j}`] = {
        leftBorder: cellStyle.leftBorder as BorderStyle | string,
        rightBorder: cellStyle.rightBorder as BorderStyle | string,
        topBorder: cellStyle.topBorder as BorderStyle | string,
        bottomBorder: cellStyle.bottomBorder as BorderStyle | string
      }

      cellStyle.leftBorder = cloneBorder(leftBorderStyle)
      cellStyle.rightBorder = cloneBorder(rightBorderStyle)
      cellStyle.topBorder = cloneBorder(topBorderStyle)
      cellStyle.bottomBorder = cloneBorder(bottomBorderStyle)
      setCell(i, j, newCellDef)
    }
  }

  table.render()
  return oldBorderStyle
}

/**
 * 恢复旧边框（undo 链路）
 */
function updateOldBorderStyles(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldBorderStyle: OldBorderMap
): void {
  const table = TableManager.get()
  if (!table) return

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const oldBorder = oldBorderStyle[`${i},${j}`]
      if (!oldBorder) continue
      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle

      cellStyle.leftBorder = oldBorder.leftBorder || ''
      cellStyle.rightBorder = oldBorder.rightBorder || ''
      cellStyle.topBorder = oldBorder.topBorder || ''
      cellStyle.bottomBorder = oldBorder.bottomBorder || ''
      setCell(i, j, newCellDef)
    }
  }

  table.render()
}

/**
 * 按目标（4 边 / 单边）写入新边框
 * @returns 旧边框快照
 */
function updateBorderStyles(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  newBorder: BorderStyle | string,
  target: BorderTarget
): OldBorderMap {
  const oldStyle: OldBorderMap = {}
  const table = TableManager.get()
  if (!table) return oldStyle

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldStyle[`${i},${j}`] = {
        leftBorder: cellStyle.leftBorder as BorderStyle | string,
        rightBorder: cellStyle.rightBorder as BorderStyle | string,
        topBorder: cellStyle.topBorder as BorderStyle | string,
        bottomBorder: cellStyle.bottomBorder as BorderStyle | string
      }

      if (!target) {
        cellStyle.leftBorder = newBorder
        cellStyle.rightBorder = newBorder
        cellStyle.topBorder = newBorder
        cellStyle.bottomBorder = newBorder
      } else if (target === 'left') {
        cellStyle.leftBorder = newBorder
        cellStyle.rightBorder = ''
        cellStyle.topBorder = ''
        cellStyle.bottomBorder = ''
      } else if (target === 'right') {
        cellStyle.rightBorder = newBorder
        cellStyle.leftBorder = ''
        cellStyle.topBorder = ''
        cellStyle.bottomBorder = ''
      } else if (target === 'top') {
        cellStyle.topBorder = newBorder
        cellStyle.leftBorder = ''
        cellStyle.rightBorder = ''
        cellStyle.bottomBorder = ''
      } else if (target === 'bottom') {
        cellStyle.bottomBorder = newBorder
        cellStyle.leftBorder = ''
        cellStyle.rightBorder = ''
        cellStyle.topBorder = ''
      }

      setCell(i, j, newCellDef)
    }
  }

  return oldStyle
}
</script>
