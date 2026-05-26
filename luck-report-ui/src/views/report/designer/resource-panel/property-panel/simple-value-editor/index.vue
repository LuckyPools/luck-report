<template>
  <div class="simple-value-editor">

    <div class="property-quote">
      {{ $t('property.simple.config') }}
    </div>

    <u-form :label-width="100" labelPosition="left">
      <u-form-item class="property-label" :label="$t('property.simple.lineHeight')">
        <u-input-number
            v-model="lineHeight"
            :min="1"
            @change="onLineHeightChange"
            :placeholder="$t('property.simple.tip')"
        />
      </u-form-item>
      <u-form-item class="property-label" :label="$t('property.simple.content')">
        <textarea
          v-model="content"
          @input="onContentChange"
          style="width: 220px"
          class="form-control"
          rows="3">
        </textarea>
      </u-form-item>
    </u-form>
  </div>
</template>

<script>
import {setDirty} from "@/utils/table";
import { deepCopy } from '@/components/utils/index.js';
import UInputNumber from '@/components/input-number/index.vue';
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";
import { mapGetters, mapActions } from 'vuex';
import {setCell, getCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'SimpleValueEditor',
  components: {
    UInputNumber,
    UForm,
    UFormItem
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
    ...mapGetters('report', ['getContext', 'getIsCellUpdate']),
    context() {
      return this.getContext;
    },
    isCellUpdate() {
      return this.getIsCellUpdate;
    },
    cellPosition() {
      return `${this.rowIndex},${this.colIndex}`;
    }
  },
  watch: {
    cellPosition: {
      handler() {
        this.loadCellData();
      }
    },
    isCellUpdate: {
      handler(newVal) {
        if (newVal) {
          this.loadCellData();
          this.setCellUpdate(false);
        }
      }
    }
  },
  methods: {
    ...mapActions('report', ['setCellUpdate']),
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

      if (newCellDef) {
        if (!newCellDef.value) {
          newCellDef.value = { type: 'simple', value: '' };
        }
        newCellDef.value.type = 'simple';
        newCellDef.value.value = this.content;
        setCell(this.rowIndex, this.colIndex, newCellDef );
      }

      const hot = TableManager.get();
      if (hot && this.rowIndex !== null && this.colIndex !== null) {
        hot.setDataAtCell(this.rowIndex, this.colIndex, this.content);
      }

      setDirty();
    },

    onLineHeightChange() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      const newCellDef = deepCopy(cellDef);

      if (newCellDef) {
        if (!newCellDef.cellStyle) {
          newCellDef.cellStyle = {};
        }

        newCellDef.cellStyle.lineHeight = this.lineHeight;

        const hot = TableManager.get();
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
        setCell( this.rowIndex, this.colIndex, newCellDef );
      }
    }
  }
}
</script>

<style scoped>
textarea:focus {
  outline: none;
  border-color: #00554a;
}
</style>

