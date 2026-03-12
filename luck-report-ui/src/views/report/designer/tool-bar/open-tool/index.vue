<template>
  <u-button
      :title="$t('openFile')"
      class="tool-button"
      icon="icon-folder"
      @click="visible = true"
  >
    <OpenDialog 
      :visible="visible" 
      @update:visible="visible = $event"
    />
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
  data() {
    return {
      visible: false
    };
  },
  methods: {

  }
};
</script>

<style scoped>
</style>
