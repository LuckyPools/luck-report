<template>
  <div class="slash-value-editor">
    <label>{{ $t('property.slash.content') }}：</label>
    <div ref="headerContainer">
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

      <u-button
        style="margin-bottom: 10px;margin-top: 10px;float: right"
        @click="handleRefresh"
        icon="icon-refresh"
      >
        {{ $t('property.slash.refresh') }}
      </u-button>
    </div>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
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
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      cellDef: null,
      rowIndex: 0,
      colIndex: 0,
      slashes: []
    };
  },
  methods: {
    /**
     * 显示编辑器
     */
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;

      // 加载斜线数据
      this.loadSlashes();
    },

    /**
     * 加载斜线数据
     */
    loadSlashes() {
      if (this.cellDef && this.cellDef.value && this.cellDef.value.slashes) {
        // 创建深拷贝以避免直接修改原始数据
        this.slashes = JSON.parse(JSON.stringify(this.cellDef.value.slashes));
      } else {
        this.slashes = [];
      }
    },

    /**
     * 处理斜线属性变化
     */
    handleSlashChange(index) {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.slashes) return;

      // 更新原始数据
      this.cellDef.value.slashes[index] = JSON.parse(JSON.stringify(this.slashes[index]));

      // 重新绘制单元格
      const crossTabWidget = this.cellDef.crossTabWidget;
      if (crossTabWidget) {
        crossTabWidget.doDraw(this.cellDef);
      }

      setDirty();
    },

    /**
     * 处理刷新按钮点击
     */
    handleRefresh() {
      if (!this.cellDef) return;

      const crossTabWidget = this.cellDef.crossTabWidget;
      if (crossTabWidget) {
        crossTabWidget.refreshCell();
        crossTabWidget.doDraw(this.cellDef, this.rowIndex, this.colIndex);

        // 重新加载斜线数据
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


