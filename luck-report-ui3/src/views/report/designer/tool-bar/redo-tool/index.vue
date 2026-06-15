<template>
  <u-button
      :title="$t('tools.redo.redo')"
      class="tool-button"
      icon="icon-redo"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import { undoManager } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'RedoTool',
  components: {UButton},
  methods: {
    handleClick() {
      if (undoManager.hasRedo()) {
        undoManager.redo();
      } else {
        showAlert(this.$t('tools.redo.noRedo'));
      }
    }
  }
};
</script>

<style scoped>
</style>
