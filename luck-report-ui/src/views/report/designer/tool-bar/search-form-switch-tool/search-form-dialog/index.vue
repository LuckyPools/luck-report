<template>
  <UDialog
    top="20px"
    :title="$t('dialog.searchForm.title')"
    width="1200px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="search-form-dialog-content">
      <search-form :searchFormData="searchFormData" ref="searchFormDesigner"></search-form>
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

export default {
  name: 'SearchFormDialog',
  components: {
    UButton,
    UDialog,
    SearchForm
  },
  data() {
    return {
      visible: false,
      iframeSrc: '',
      index: 0,
      reportDef: null,
      searchFormData: null
    };
  },
  methods: {
    show(reportDef) {
      this.visible = true;
      this.reportDef = reportDef;
      if(this.reportDef.searchForm){
        this.searchFormData = deepClone(this.reportDef.searchForm)
      }
    },

    buildData(){
      const searchFormDesigner = this.$refs.searchFormDesigner;
      searchFormDesigner.AssembleFormData();
      const formData = searchFormDesigner.formData;
      this.reportDef.searchForm = deepClone(formData);
      console.log(JSON.stringify(formData))
    },

    handleClose() {
      this.visible = false;
    },

    handleOk() {
      this.buildData();
      this.visible = false;
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
