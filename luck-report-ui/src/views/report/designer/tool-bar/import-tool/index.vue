<template>
  <u-button
      :title="$t('importExcel')"
      class="tool-button"
      icon="icon-cloud-upload"
      @click="handleImport"
  >
    <ImportDialog ref="importDialog" />
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
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleImport() {
      if (this.$refs.importDialog && this.$refs.importDialog.show) {
        this.$refs.importDialog.show();
      }
    }
  }
};
</script>

<style scoped>
</style>
