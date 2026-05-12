<template>
  <u-button
      :title="$t('tools.image.title')"
      type="info"
      class="info-button"
      icon="icon-image"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import { buildNewCellDef, setDirty, undoManager } from '@/utils/table.js';
import Handsontable from 'handsontable';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import UButton from "@/components/button/index.vue";
import imageIcon from '@/assets/icons/image.svg';
import {addCell, getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'ImageTool',
  components: {UButton},
  methods: {
    checkSelection() {
      const hot = TableManager.get();
      const selected = hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },
    // 执行插入图片操作
    handleClick() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = TableManager.get();
      const selected = hot.getSelected();
      let [startRow, startCol, endRow, endCol] = selected[0];

      // 确保startRow <= endRow和startCol <= endCol
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      let oldCellDef = getCell(startRow, startCol);
      let oldCellData = hot.getDataAtCell(startRow, startCol);
      let newCellDef = buildNewCellDef(startRow + 1, startCol + 1);
      newCellDef.value = {
        type: 'image',
        source: 'text',
        value: ''
      };

      addCell( newCellDef);
      const imagePath = imageIcon;

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
          oldCellDef = deepCopy(getCell(startRow, startCol));
          oldCellData = hot.getDataAtCell(startRow, startCol);
          newCellDef = buildNewCellDef(startRow + 1, startCol + 1);
          newCellDef.value = {
            type: 'image',
            source: 'text',
            value: ''
          };
          addCell(newCellDef);
          hot.setDataAtCell(startRow, startCol, '');
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          if (oldCellDef) {
            const newOldCellDef = deepCopy(oldCellDef);
            addCell({ i: startRow, j: startCol, cellDef: newOldCellDef });
          } else {
            setCell(startRow, startCol, null );
          }
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
</style>
