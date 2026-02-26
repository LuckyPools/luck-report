<template>
  <u-button
      :title="$t('tools.searchFormSwitch')"
      class="tool-button"
      icon="icon-form-design"
      @click="execute"
  >
    <search-form-dialog ref="searchFormDialog" />
  </u-button>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import SearchFormDialog from '@/views/report/designer/tool-bar/search-form-switch-tool/search-form-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SearchFormSwitchTool',
  components: {
    UButton,
    SearchFormDialog
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  methods: {
    // 执行搜索表单切换操作
    execute() {
      setDirty();
      // 直接调用组件的show方法
      this.$refs.searchFormDialog.show(this.context.reportDef);
    }
  }
};
</script>

<style scoped>
</style>
