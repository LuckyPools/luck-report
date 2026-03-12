<template>
  <u-button
      :title="$t('tools.searchFormSwitch')"
      class="tool-button"
      icon="icon-form-design"
      @click="visible = true"
  >
    <search-form-dialog 
      :visible="visible" 
      @update:visible="visible = $event"
    />
  </u-button>
</template>

<script>
import SearchFormDialog from '@/views/report/designer/tool-bar/search-form-switch-tool/search-form-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SearchFormSwitchTool',
  components: {
    UButton,
    SearchFormDialog
  },
  data() {
    return {
      visible: false
    };
  }
};
</script>

<style scoped>
</style>
