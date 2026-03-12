<template>
  <u-button
      :title="$t('tools.save.saveAs')"
      class="tool-button"
      icon="icon-save-as"
      @click="visible = true"
  >
    <SaveDialog 
      :visible="visible" 
      @update:visible="visible = $event"
      @saveAfter="handleSaveAfter"
    />
  </u-button>
</template>

<script>
import SaveDialog from '@/views/report/designer/tool-bar/save-as-tool/save-dialog/index.vue';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';

export default {
  name: 'SaveAsTool',
  components: {
    SaveDialog,
    UButton
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  data() {
    return {
      visible: false
    };
  },
  methods: {
    handleSaveAfter(fullFile) {
      window.location.replace("?reportPath=" + fullFile);
    }
  }
};
</script>

<style scoped>
</style>
