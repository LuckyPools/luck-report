<template>
  <div>
    <UDialog
      :title="$t('dialog.staticDataset.title')"
      width="1000px"
      top="10vh"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <div class="content-layout">

          <JsonEditor
            ref="jsonEditor"
            :name="datasetName"
            :content="content"
            @json-change="handleContentChange"
            @dataset-name-change="handleDatasetNameChange"
          />


        </div>
      </div>

      <div slot="footer" style="text-align: right">
        <u-button @click="handleConfirm">{{ $t('dialog.json.ok') }}</u-button>
      </div>
    </UDialog>
  </div>
</template>

<script>

import { setDirty } from '@/utils/table.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import {showAlert} from "@/utils/comnon";
import { mapGetters } from 'vuex';
import {deepCopy} from "@/components/utils";
import JsonEditor
  from "@/views/report/designer/resource-panel/datasource-panel/static-dataset-dialog/json-editor/index.vue";

export default {
  name: 'StaticDatasetDialog',
  components: {
    JsonEditor,
    UDialog,
    UButton
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    datasourceData: {
      type: Object,
      default: null
    },
    datasetData: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  data() {
    return {
      datasetName: '',
      content: '',
      parameters: [],
      oldName: '',
      currentData: {},
      previewDialogVisible: false,
      previewParameters: null,
      triggerLoadSearchTable: false
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initData();
      }
    }
  },
  methods: {
    initData() {
      this.currentData = {};
      this.datasetName = '';
      this.content = '';
      this.parameters = [];
      this.oldName = '';

      if (this.datasetData) {
        this.currentData = { ...this.datasetData };
        this.datasetName = this.datasetData.name || '';
        this.content = this.datasetData.content || '';
        this.parameters = Array.isArray(this.datasetData.parameters) ? [...this.datasetData.parameters] : [];
        this.oldName = this.datasetData.name || '';
      }

      this.$nextTick(() => {
        this.triggerLoadSearchTable = true;
      });
    },

    handleSearchTableLoadComplete() {
      this.triggerLoadSearchTable = false;
    },

    /**
     * 处理json内容变化
     */
    handleContentChange(newJson) {
      this.content = newJson || '';
    },

    /**
     * 处理数据集名称变化
     */
    handleDatasetNameChange(newName) {
      this.datasetName = newName || '';
    },

    handleConfirm() {
      console.log("static save confirm")
      const name = this.datasetName || '';
      const content = this.content || '';

      if (!name || name === '') {
        showAlert(this.$t('dialog.json.nameTip'));
        return;
      }

      if (!content || content === '') {
        showAlert(this.$t('dialog.json.jsonTip'));
        return;
      }

      // 检查数据集名称是否重复
      let check = false;
      if (!this.oldName || name !== this.oldName) {
        check = true;
      }

      if (check) {
        //检查内容是否为json数组
        var jsonEditor = this.$refs.jsonEditor;
        if (jsonEditor) {
          var result = jsonEditor.validateJsonArray();
          if (!result.valid){
            showAlert(result.message,"error");
            return;
          }
        }

        for (let datasource of this.context.reportDef.datasources) {
          let datasets = datasource.datasets;
          if (!datasets || !Array.isArray(datasets)) {
            continue;
          }

          for (let dataset of datasets) {
            if (dataset.name === name) {
              showAlert(`${this.$t('dialog.json.ds')}[${name}]${this.$t('dialog.json.exist')}`);
              return;
            }
          }
        }
      }
      console.log("emit save",name,this.oldName,content);
      this.$emit('save', name, this.oldName, content);
      setDirty();
      this.closeDialog();
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.content-layout {
  display: flex;
  gap: 15px;
  height: 100%;
}

.left-panel {
  flex: 0 0 200px;
  height: 100%;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}
</style>
