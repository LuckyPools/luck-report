<template>
  <div>
    <u-row class="condition-config-row" type="flex" align="middle">
      <u-col :span="24">
        <u-checkbox v-model="localChecked" @change="onRenderFlagChange">
          {{ $t('dialog.propCondition.renderCell') }}
        </u-checkbox>
        <!-- <span class="render-cell-tip">{{ $t('dialog.propCondition.renderCellTip') }}</span> -->
      </u-col>
    </u-row>
  </div>
</template>

<script>
import UCheckbox from '@/components/checkbox/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'RenderConfig',
  components: {
    UCheckbox,
    URow,
    UCol
  },
  props: {
    // null/undefined=未配置(前端默认勾选); true=渲染; false=不渲染
    renderFlag: {
      default: null
    }
  },
  data() {
    return {
      localChecked: true
    };
  },
  watch: {
    renderFlag: {
      handler(newVal) {
        // 未配置时默认勾选(true),与后端默认值一致;否则用传入值
        this.localChecked = (newVal === null || newVal === undefined) ? true : newVal;
      },
      immediate: true
    }
  },
  methods: {
    onRenderFlagChange() {
      this.$emit('render-change', {
        checked: this.localChecked,
        value: this.localChecked
      });
    }
  }
};
</script>

<style scoped>
.render-cell-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
