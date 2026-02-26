<template>
  <u-button
      :title="$t('setting')"
      class="tool-button"
      icon="icon-settings"
      @click="execute"
  >
    <SettingsDialog
        :visible="dialogVisible"
        :context="context"
        @close="handleDialogClose"
        @ok="handleDialogOk"
    />
  </u-button>
</template>

<script>
import SettingsDialog from '@/views/report/designer/tool-bar/settings-tool/settings-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'SettingsTool',
  components: {
    UButton,
    SettingsDialog
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      dialogVisible: false
    };
  },
  methods: {
    execute() {
      // 直接显示对话框，不需要通过中间的JS类
      this.dialogVisible = true;
    },
    handleDialogClose() {
      this.dialogVisible = false;
    },
    handleDialogOk() {
      this.dialogVisible = false;
    }
  }
};
</script>

<style scoped>
</style>
