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
import { deepCopy } from '@/components/utils/index.js';
import UInputNumber from '@/components/input-number/index.vue';
import { mapGetters } from 'vuex';
import {setCell, getCell, getContext} from "@/utils/contextActions";

export default {
  name: 'SimpleValueEditor',
  components: {
    UInputNumber
  },
  props: {
    rowIndex: {
      type: Number,
      default: 0
    },
    colIndex: {
      type: Number,
      default: 0
    },
    row2Index: {
      type: Number,
      default: 0
    },
    col2Index: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      content: '',
      lineHeight: ''
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  watch: {
    rowIndex: {
      immediate: true,
      handler() {
        this.loadCellData();
      }
    },
    colIndex: {
      immediate: true,
      handler() {
        this.loadCellData();
      }
    }
  },
  mounted() {
    this.loadCellData();
  },
  methods: {
    loadCellData() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        this.content = '';
        this.lineHeight = '';
        return;
      }

      if (cellDef && cellDef.value && cellDef.value.value !== undefined) {
        this.content = cellDef.value.value;
      } else {
        this.content = '';
      }

      if (cellDef && cellDef.cellStyle && cellDef.cellStyle.lineHeight !== undefined) {
        this.lineHeight = cellDef.cellStyle.lineHeight;
      } else {
        this.lineHeight = '';
      }
    },

    onContentChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      const newCellDef = deepCopy(cellDef);

      const context = getContext();
      if (context && context.hot && this.rowIndex !== null && this.colIndex !== null) {
        context.hot.setDataAtCell(this.rowIndex, this.colIndex, this.content);
      }

      setDirty();

      if (newCellDef) {
        if (!newCellDef.value) {
          newCellDef.value = { type: 'simple', value: '' };
        }
        newCellDef.value.type = 'simple';
        newCellDef.value.value = this.content;
        setCell(this.rowIndex, this.colIndex, newCellDef );
      }
    },

    onLineHeightChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      const newCellDef = deepCopy(cellDef);

      if (newCellDef) {
        if (!newCellDef.cellStyle) {
          newCellDef.cellStyle = {};
        }

        newCellDef.cellStyle.lineHeight = this.lineHeight;

        const context = getContext();
        if (context && context.hot) {
          const td = context.hot.getCell(this.rowIndex, this.colIndex);
          if (td) {
            if (this.lineHeight === '') {
              td.style.lineHeight = '';
            } else {
              td.style.lineHeight = this.lineHeight;
            }
            context.hot.render();
          }
        }

        setDirty();
        setCell( this.rowIndex, this.colIndex, newCellDef );
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

