<template>
  <div class="simple-value-editor">
    <div class="editor-container">
      <div class="form-group">
        <label>{{ $t('property.simple.lineHeight') }}：</label>
        <div class="u-inline">
          <u-input-number
              v-model="lineHeight"
              @change="onLineHeightChange"
              :placeholder="$t('property.simple.tip')"
          />
        </div>
      </div>
      <div class="form-group">
        <label>{{ $t('property.simple.content') }}：</label>
        <textarea
          v-model="content"
          @input="onContentChange"
          style="width: 360px"
          class="form-control"
          rows="3">
        </textarea>
      </div>
    </div>
  </div>
</template>

<script>
import {setDirty} from "@/utils/table";
import UInputNumber from '@/components/input-number/index.vue';

export default {
  name: 'SimpleValueEditor',
  components: {
    UInputNumber
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      content: '',
      lineHeight: '',
      cellDef: null
    };
  },
  created() {
    // 存储行索引和列索引
    this.rowIndex = null;
    this.colIndex = null;
  },
  methods: {

    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.cellDef = cellDef;

      // 初始化内容
      if (cellDef && cellDef.value && cellDef.value.value !== undefined) {
        this.content = cellDef.value.value;
      } else {
        this.content = '';
      }

      // 初始化行高
      if (cellDef && cellDef.cellStyle && cellDef.cellStyle.lineHeight !== undefined) {
        this.lineHeight = cellDef.cellStyle.lineHeight;
      } else {
        this.lineHeight = '';
      }
    },

    onContentChange() {
      // 更新单元格内容
      if (this.context && this.context.hot && this.rowIndex !== null && this.colIndex !== null) {
        this.context.hot.setDataAtCell(this.rowIndex, this.colIndex, this.content);
      }

      // 标记为脏数据
      setDirty();

      // 更新cellDef
      if (this.cellDef) {
        // 确保value对象存在
        if (!this.cellDef.value) {
          this.cellDef.value = { type: 'simple', value: '' };
        }
        // 更新值并确保类型正确
        this.cellDef.value.type = 'simple';
        this.cellDef.value.value = this.content;
        // 通过context确保cellDef被正确存储
        if (this.context && typeof this.context.setCell === 'function') {
          this.context.setCell(this.rowIndex, this.colIndex, this.cellDef);
        }
      }
    },

    onLineHeightChange() {
      if (this.cellDef) {
        // 确保cellStyle对象存在
        if (!this.cellDef.cellStyle) {
          this.cellDef.cellStyle = {};
        }

        this.cellDef.cellStyle.lineHeight = this.lineHeight;

        // 更新表格单元格样式
        const hot = this.context.hot;
        if (hot) {
          const td = hot.getCell(this.rowIndex, this.colIndex);
          if (td) {
            if (this.lineHeight === '') {
              td.style.lineHeight = '';
            } else {
              td.style.lineHeight = this.lineHeight;
            }
            hot.render();
          }
        }

        setDirty();
      }
    }
  }
}
</script>

<style scoped>
textarea:focus {
  outline: none;
}
</style>

