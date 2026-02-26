<template>
  <u-button
      :title="$t('tools.undo.undo')"
      class="tool-button"
      icon="icon-undo"
      @click="execute"
  >
  </u-button>
</template>

<script>
import { undoManager } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'UndoTool',
  components: {UButton},
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  methods: {
    execute() {
      if (undoManager.hasUndo()) {
        undoManager.undo();
      } else {
        showAlert(this.$t('tools.undo.noUndo'));
      }
    }
  }
};
</script>

<style scoped>
</style>
