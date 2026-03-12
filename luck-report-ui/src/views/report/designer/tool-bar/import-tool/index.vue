<template>
  <u-button
      :title="$t('importExcel')"
      class="tool-button"
      icon="icon-cloud-upload"
      @click="visible = true"
  >
    <ImportDialog 
      :visible="visible" 
      @update:visible="visible = $event"
      @import-success="handleImportSuccess"
    />
  </u-button>
</template>

<script>
import ImportDialog from '@/views/report/designer/tool-bar/import-tool/import-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'ImportTool',
  components: {
    UButton,
    ImportDialog
  },
  data() {
    return {
      visible: false
    };
  },
  methods: {
    handleImportSuccess() {
      const routeData = this.$router.resolve({
        name: 'Designer',
      });
      window.open(routeData.href, "_self");
    }
  }
};
</script>

<style scoped>
</style>
