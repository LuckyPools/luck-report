<template>
  <u-button
      :title="$t('openFile')"
      class="tool-button"
      icon="icon-folder"
      @click="execute"
  >
    <OpenDialog ref="openDialog" />
  </u-button>
</template>

<script>
import OpenDialog from '@/views/report/designer/tool-bar/open-tool/open-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'OpenTool',
  components: {
    UButton,
    OpenDialog
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {

    };
  },
  mounted() {

  },
  methods: {
    execute() {
      if (this.$refs.openDialog && this.$refs.openDialog.show) {
        this.$refs.openDialog.show();
      }
    }
  }
};
</script>

<style scoped>
</style>
