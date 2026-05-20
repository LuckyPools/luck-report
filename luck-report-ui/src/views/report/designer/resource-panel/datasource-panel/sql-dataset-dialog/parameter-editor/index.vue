<template>
  <div class="parameter-editor">
    <div class="row" style="margin:10px;">
      <ParameterTable
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
    }
  }
};
</script>

<style scoped>
.parameter-editor {
  width: 100%;
}
</style>
