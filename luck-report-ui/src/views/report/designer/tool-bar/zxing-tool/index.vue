<template>
  <div class="tool-btn-group">
    <ButtonGroup
      iconClass="iconfont icon-qrcode"
      :title="$t('tools.zxing.title')"
      :customClass="'zxing-tool-dropdown'"
      :menuItems="menuItems"
    />
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import Handsontable from 'handsontable';
import ButtonGroup from '@/components/button-group/index.vue';
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'ZxingTool',
  components: {
    ButtonGroup
  },
  data() {
    return {
      menuItems: [
        {
          text: this.$t('tools.zxing.qrcode'),
          icon: 'iconfont icon-qrcode',
          action: () => this.insertQRCode()
        },
        {
          text: this.$t('tools.zxing.barcode'),
          icon: 'iconfont icon-barcode',
          action: () => this.insertBarCode()
        }
      ]
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  methods: {

    // 检查是否有选中的单元格
    checkSelection() {
      const selected = this.context.hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },
    // 插入二维码
    insertQRCode() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      const startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];
      let cellDef = getCell(startRow, startCol);
      let oldValue = deepCopy(cellDef.value), oldCellData = hot.getDataAtCell(startRow, startCol);

      hot.setDataAtCell(startRow, startCol, '');
      let td = hot.getCell(startRow, startCol);
      let width = this._buildWidth(startCol, td.colSpan, hot), height = this._buildHeight(startRow, td.rowSpan, hot);

      const newCellDef = deepCopy(cellDef);
      newCellDef.value = {
        width,
        height,
        type: 'zxing',
        category: 'qrcode',
        source: 'text',
        data: ''
      };
      setCell( startRow, startCol, newCellDef );

      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);

      undoManager.add({
        redo: () => {
          cellDef = getCell(startRow, startCol);
          oldValue = deepCopy(cellDef.value), oldCellData = hot.getDataAtCell(startRow, startCol);
          hot.setDataAtCell(startRow, startCol, '');
          td = hot.getCell(startRow, startCol);
          width = this._buildWidth(startCol, td.colSpan, hot), height = this._buildHeight(startRow, td.rowSpan, hot);
          const newCellDef = deepCopy(cellDef);
          newCellDef.value = {
            width,
            height,
            type: 'zxing',
            category: 'qrcode',
            source: 'text',
            data: ''
          };
          setCell( startRow, startCol,  newCellDef );
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          cellDef = getCell(startRow, startCol);
          const newCellDef = deepCopy(cellDef);
          newCellDef.value = oldValue;
          setCell(startRow,startCol,newCellDef );
          hot.setDataAtCell(startRow, startCol, oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        }
      });
    },
    // 插入条形码
    insertBarCode() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      const startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];
      let cellDef = getCell(startRow, startCol);
      let oldValue = deepCopy(cellDef.value), oldCellData = hot.getDataAtCell(startRow, startCol);

      hot.setDataAtCell(startRow, startCol, '');
      let td = hot.getCell(startRow, startCol);
      let width = this._buildWidth(startCol, td.colSpan, hot), height = this._buildHeight(startRow, td.rowSpan, hot);

      const newCellDef = deepCopy(cellDef);
      newCellDef.value = {
        width,
        height,
        type: 'zxing',
        category: 'barcode',
        source: 'text',
        format: 'CODE_128',
        data: ''
      };
      setCell(startRow,startCol, newCellDef );

      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);

      undoManager.add({
        redo: () => {
          cellDef = getCell(startRow, startCol);
          oldValue = deepCopy(cellDef.value), oldCellData = hot.getDataAtCell(startRow, startCol);
          hot.setDataAtCell(startRow, startCol, '');
          td = hot.getCell(startRow, startCol);
          width = this._buildWidth(startCol, td.colSpan, hot), height = this._buildHeight(startRow, td.rowSpan, hot);
          const newCellDef = deepCopy(cellDef);
          newCellDef.value = {
            width,
            height,
            type: 'zxing',
            category: 'barcode',
            source: 'text',
            format: 'CODE_128',
            data: ''
          };
          setCell(startRow, startCol,  newCellDef );
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          cellDef = getCell(startRow, startCol);
          const newCellDef = deepCopy(cellDef);
          newCellDef.value = oldValue;
          setCell(startRow, startCol, newCellDef );
          hot.setDataAtCell(startRow, startCol, oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        }
      });
    },
    // 构建宽度
    _buildWidth(colIndex, colspan, hot) {
      let width = hot.getColWidth(colIndex) - 3;
      if (!colspan || colspan < 2) {
        return width;
      }
      let start = colIndex + 1, end = colIndex + colspan;
      for (let i = start; i < end; i++) {
        width += hot.getColWidth(i);
      }
      return width;
    },
    // 构建高度
    _buildHeight(rowIndex, rowspan, hot) {
      let height = hot.getRowHeight(rowIndex) - 3;
      if (!rowspan || rowspan < 2) {
        return height;
      }
      let start = rowIndex + 1, end = rowIndex + rowspan;
      for (let i = start; i < end; i++) {
        height += hot.getRowHeight(i);
      }
      return height;
    }
  }
};
</script>

<style scoped>
</style>
