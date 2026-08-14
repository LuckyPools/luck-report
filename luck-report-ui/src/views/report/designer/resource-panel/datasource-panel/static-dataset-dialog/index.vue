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
        <!-- 顶部提示：静态数据集数据格式说明 -->
        <div class="import-tip-box">
          <div class="import-description">{{ $t('dialog.staticDataset.desc') }}</div>
        </div>
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
        <u-button type="info" @click="handlePreviewJson" style="margin-right: 10px">{{ $t('dialog.staticDataset.jsonPreview') }}</u-button>
        <u-button @click="handleConfirm">{{ $t('dialog.json.ok') }}</u-button>
      </div>
    </UDialog>

    <json-table-preview :data="content" :visible="previewDialogVisible" @close="previewDialogVisible=false" />
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
import JsonTablePreview
  from "@/views/report/designer/resource-panel/datasource-panel/static-dataset-dialog/json-table-preview/index.vue";
import showMessage from "@/components/message/instance";

export default {
  name: 'StaticDatasetDialog',
  components: {
    JsonEditor,
    UDialog,
    UButton,
    JsonTablePreview
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

      // JSON 数组合法性校验
      const jsonEditor = this.$refs.jsonEditor;
      if (jsonEditor) {
        const result = jsonEditor.validateJsonArray();
        if (!result.valid) {
          showAlert(result.message, "error");
          return;
        }
      }

      // 名称重复校验：仅在新建或改名时需要
      const check = !this.oldName || name !== this.oldName;
      if (check) {
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
      this.$emit('save', name, this.oldName, content);
      setDirty();
      this.closeDialog();
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.$emit('close');
    },

    handlePreviewJson() {
      if (this.content && this.content !== ''){
        this.previewDialogVisible = true;
      }else {
        showAlert(this.$t('dialog.json.jsonTip'));
      }
    },
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

/* 底部提示框样式，参照 import-dialog 的 import-tip-box */
.import-tip-box {
  padding: 8px 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border-left: 5px solid #007868;
  margin-bottom: 15px;
}

.import-description {
  line-height: 2;
  color: #929191;
}
</style>
