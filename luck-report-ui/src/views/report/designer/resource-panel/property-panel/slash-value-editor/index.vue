<template>
  <div class="slash-value-editor">
    <label>{{ $t('property.slash.content') }}：</label>
    <div ref="headerContainer">
      <u-button
          style="margin-bottom: 10px;margin-top: 10px;float: right"
          @click="handleRefresh"
          icon="icon-refresh"
      >
        {{ $t('property.slash.refresh') }}
      </u-button>
      <div ref="slashContainer">
        <!-- 斜线项将在这里动态渲染 -->
        <div v-for="(slash, index) in slashes" :key="index" class="slash-item">

          <div style="margin-top: 10px">
            <span>{{ $t('property.slash.name') }}：</span>
            <div class="u-inline">
              <u-input
                  v-model="slash.text"
                  style="width:120px;"
                  @change="handleSlashChange(index)"
              />
            </div>
          </div>

          <div style="margin-top: 10px">
            <span>Y：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="slash.y"
                  @change="handleSlashChange(index)"
              >
              </u-input-number>
            </div>
          </div>

          <div style="margin-top: 10px">
            <span>X：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="slash.x"
                  @change="handleSlashChange(index)"
              >
              </u-input-number>
            </div>
          </div>

          <div style="margin-top: 10px">
            <span>{{ $t('property.slash.angle') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="slash.degree"
                  @change="handleSlashChange(index)"
              >
              </u-input-number>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import { setCell, getCell, getContext } from '@/utils/contextActions.js';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SlashValueEditor',
  components: {
    UButton,
    UInputNumber,
    UInput
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
      slashes: []
    };
  },
  watch: {
    rowIndex: {
      immediate: true,
      handler() {
        this.loadSlashes();
      }
    },
    colIndex: {
      immediate: true,
      handler() {
        this.loadSlashes();
      }
    }
  },
  mounted() {
    this.loadSlashes();
  },
  methods: {
    loadSlashes() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value && cellDef.value.slashes) {
        this.slashes = deepCopy(cellDef.value.slashes);
      } else {
        this.slashes = [];
      }
    },

    handleSlashChange(index) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef || !cellDef.value || !cellDef.value.slashes) return;

      const newCellDef = deepCopy(cellDef);
      newCellDef.value.slashes[index] = deepCopy(this.slashes[index]);

      setCell(this.rowIndex, this.colIndex, newCellDef);

      const context = getContext();
      if (context) {
        const crossTabWidget = new CrossTabWidget(context, this.rowIndex, this.colIndex, '');
      }

      setDirty();
    },

    handleRefresh() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) return;

      const context = getContext();
      if (context) {
        const crossTabWidget = new CrossTabWidget(context, this.rowIndex, this.colIndex, '');
        crossTabWidget.refreshCell();
        crossTabWidget.doDraw();

        this.loadSlashes();
      }
    }
  }
};
</script>

<style scoped>
.slash-value-editor {
  padding: 10px;
}

.slash-item{
  margin-top: 10px;
}
</style>
