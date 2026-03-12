<template>
  <u-button
      :title="$t('setting')"
      class="tool-button"
      icon="icon-settings"
      @click="handleClick"
  >
    <SettingsDialog
        :visible="dialogVisible"
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
  data() {
    return {
      dialogVisible: false
    };
  },
  methods: {
    handleClick() {
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
