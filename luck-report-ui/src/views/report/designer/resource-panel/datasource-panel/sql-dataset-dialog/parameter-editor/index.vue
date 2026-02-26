<template>
  <div class="parameter-editor">
    <div class="row" style="margin:10px;">
      <ParameterTable
        ref="parameterTable"
        :data="parameters"
        @add-parameter="handleAddParameter"
        @edit-parameter="handleEditParameter"
        @remove-parameter="handleRemoveParameter"
        @update="handleUpdate"
      />
    </div>
  </div>
</template>

<script>
import ParameterTable from '@/views/report/designer/resource-panel/datasource-panel/parameter-table/index.vue';

export default {
  name: 'ParameterEditor',
  props: {
    parameters: {
      type: Array,
      default: () => []
    }
  },
  components: {
    ParameterTable
  },
  // 移除直接修改子组件props的watch监听器，子组件的data prop会通过Vue的响应式系统自动更新
  methods: {
    handleAddParameter(newParam) {
      this.$emit('add-parameter', newParam);
    },
    handleEditParameter(index, updatedParam) {
      this.$emit('edit-parameter', index, updatedParam);
    },
    handleRemoveParameter(index) {
      this.$emit('remove-parameter', index);
    },
    handleUpdate() {
      this.$emit('update');
    },
    refreshData() {
      // 提供刷新数据的方法给父组件调用
      if (this.$refs.parameterTable) {
        this.$refs.parameterTable.refreshData();
      }
    }
  }
};
</script>

<style scoped>
.parameter-editor {
  width: 100%;
}
</style>
