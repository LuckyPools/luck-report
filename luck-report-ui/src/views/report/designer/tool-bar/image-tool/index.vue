<template>
  <u-button
      :title="$t('tools.image.title')"
      type="info"
      class="info-button"
      icon="icon-image"
      @click="execute"
  >
  </u-button>
</template>

<script>
import { buildNewCellDef, setDirty, undoManager } from '@/utils/table.js';
import Handsontable from 'handsontable';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";
import imageIcon from '@/assets/icons/image.svg';

export default {
  name: 'ImageTool',
  components: {UButton},
  props: {
    context: {
      type: Object,
      required: true
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
    // 执行插入图片操作
    execute() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      // 确保startRow <= endRow和startCol <= endCol
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      let oldCellDef = this.context.getCell(startRow, startCol);
      let oldCellData = hot.getDataAtCell(startRow, startCol);
      let newCellDef = buildNewCellDef(startRow + 1, startCol + 1);
      newCellDef.value = {
        type: 'image',
        source: 'text',
        value: ''
      };

      this.context.addCell(newCellDef);
      const imagePath = imageIcon;

      // 使用原生JavaScript替代jQuery操作
      const td = hot.getCell(startRow, startCol);
      if (td) {
        td.innerHTML = '';
        const img = document.createElement('img');
        img.src = imagePath;
        img.width = 20;
        td.appendChild(img);
      }

      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);

      undoManager.add({
        redo: () => {
          oldCellDef = this.context.getCell(startRow, startCol);
          oldCellData = hot.getDataAtCell(startRow, startCol);
          newCellDef = buildNewCellDef(startRow + 1, startCol + 1);
          newCellDef.value = {
            type: 'image',
            source: 'text',
            value: ''
          };
          this.context.addCell(newCellDef);
          hot.setDataAtCell(startRow, startCol, '');
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          this.context.addCell(oldCellDef);
          hot.setDataAtCell(startRow, startCol, oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        }
      });
    }
  }
};
</script>

<style scoped>
.btn:hover {
  background-color: #e6e6e6 !important;
}
</style>
