<template>
  <UDialog
    top="20px"
    :title="$t('dialog.searchForm.title')"
    width="1200px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="search-form-dialog-content">
      <search-form :searchFormConfig="searchFormConfig" ref="searchFormDesigner"></search-form>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import SearchForm from "@/views/report/designer/search-form/index.vue";
import {deepClone} from "@/views/report/designer/search-form/utils";
import { mapGetters } from 'vuex';
import { updateReportDef } from '@/utils/contextActions.js';

export default {
  name: 'SearchFormDialog',
  components: {
    UButton,
    UDialog,
    SearchForm
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      iframeSrc: '',
      index: 0,
      searchFormConfig: null
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.context.reportDef.searchForm) {
        this.searchFormConfig = deepClone(this.context.reportDef.searchForm);
      }
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  methods: {

    buildData() {
      const searchFormDesigner = this.$refs.searchFormDesigner;
      searchFormDesigner.AssembleFormData();
      const formData = searchFormDesigner.formData;
      const newReportDef = deepClone(this.context.reportDef);
      newReportDef.searchForm = deepClone(formData);
      updateReportDef(newReportDef);
    },

    handleClose() {
      this.$emit('update:visible', false);
    },

    handleOk() {
      this.buildData();
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
.search-form-dialog-content {
  height: 600px;
  padding: 0;
}
</style>
