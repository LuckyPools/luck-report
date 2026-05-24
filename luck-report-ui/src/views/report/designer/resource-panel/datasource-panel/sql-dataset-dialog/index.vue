<template>
  <div>
    <UDialog
      :title="$t('dialog.sql.title')"
      width="1080px"
      top="10vh"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <div class="content-layout">
          <!-- 左侧容器：搜索表格 -->
          <div class="left-panel">
            <SearchTable
                :datasourceData="datasourceData"
                :trigger-load="triggerLoadSearchTable"
                @add="handleAddSql"
                @load-complete="handleSearchTableLoadComplete"
            />
          </div>

          <!-- 右侧容器：SQL 编辑器和参数编辑器 -->
          <div class="right-panel">
            <SqlEditor
                :name="datasetName"
                :sql="sql"
                @sql-change="handleSqlChange"
                @dataset-name-change="handleDatasetNameChange"
            />
            <ParameterEditor
                :parameters="parameters"
                @add-parameter="handleAddParameter"
                @edit-parameter="handleEditParameter"
                @remove-parameter="handleRemoveParameter"
            />
          </div>
        </div>
      </div>

      <div slot="footer" style="text-align: right">
        <u-button @click="handlePreview" type="info" style="margin-right: 10px;">{{ $t('dialog.sql.preview') }}</u-button>
        <u-button @click="handleConfirm">{{ $t('dialog.sql.ok') }}</u-button>
      </div>
    </UDialog>
    <PreviewDataDialog
      :visible="previewDialogVisible"
      :parameters="previewParameters"
      @close="closePreviewDialog"
    />
  </div>
</template>

<script>

import { setDirty } from '@/utils/table.js';
import SearchTable from './search-table/index.vue';
import SqlEditor from './sql-editor/index.vue';
import ParameterEditor from './parameter-editor/index.vue';
import PreviewDataDialog from '@/views/report/designer/resource-panel/datasource-panel/preview-data-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import {showAlert} from "@/utils/comnon";
import { mapGetters } from 'vuex';
import {deepCopy} from "@/components/utils";

export default {
  name: 'SqlDatasetDialog',
  components: {
    SearchTable,
    SqlEditor,
    ParameterEditor,
    PreviewDataDialog,
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
      sql: '',
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
      this.sql = '';
      this.parameters = [];
      this.oldName = '';

      if (this.datasetData) {
        this.currentData = { ...this.datasetData };
        this.datasetName = this.datasetData.name || '';
        this.sql = this.datasetData.sql || '';
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
     * 处理SQL内容变化
     */
    handleSqlChange(newSql) {
      this.sql = newSql || '';
    },

    /**
     * 处理数据集名称变化
     */
    handleDatasetNameChange(newName) {
      this.datasetName = newName || '';
    },

    /**
     * 处理添加 SQL
     */
    handleAddSql(sql) {
      this.sql = sql || '';
    },

    /**
     * 处理添加参数
     */
    handleAddParameter(newParam) {
      this.parameters.push(newParam);
      this.currentData.parameters = [...this.parameters];
    },

    /**
     * 处理编辑参数
     */
    handleEditParameter(index, updatedParam) {
      if (this.parameters && this.parameters[index]) {
        this.$set(this.parameters, index, { ...updatedParam });
        this.currentData.parameters = [...this.parameters];
      }
    },

    /**
     * 处理删除参数
     */
    handleRemoveParameter(index) {
      if (this.parameters) {
        this.parameters.splice(index, 1);
        this.currentData.parameters = [...this.parameters];
      }
    },

    /**
     * 预览数据
     */
    handlePreview() {
      const sql = this.sql || '';
      if (!sql || sql === '') {
        showAlert(this.$t('dialog.sql.sqlTip'));
        return;
      }

      const type = this.datasourceData.type;
      const parameters = {
        sql,
        type,
        parameters: deepCopy(this.currentData.parameters)
      };

      if (type === 'jdbc') {
        parameters.username = this.datasourceData.username;
        parameters.password = this.datasourceData.password;
        parameters.driver = this.datasourceData.driver;
        parameters.url = this.datasourceData.url;
      } else if (type === 'buildin') {
        parameters.name = this.datasourceData.name;
      }

      this.previewParameters = parameters;
      this.previewDialogVisible = true;
    },

    handleConfirm() {
      const name = this.datasetName || '';
      const sql = this.sql || '';

      if (!name || name === '') {
        showAlert(this.$t('dialog.sql.nameTip'));
        return;
      }

      if (!sql || sql === '') {
        showAlert(this.$t('dialog.sql.sqlTip'));
        return;
      }

      // 检查数据集名称是否重复
      let check = false;
      if (!this.oldName || name !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let datasource of this.context.reportDef.datasources) {
          let datasets = datasource.datasets;
          if (!datasets || !Array.isArray(datasets)) {
            continue;
          }

          for (let dataset of datasets) {
            if (dataset.name === name) {
              showAlert(`${this.$t('dialog.sql.ds')}[${name}]${this.$t('dialog.sql.exist')}`);
              return;
            }
          }
        }
      }

      this.$emit('save', name, this.oldName, sql, this.currentData.parameters);
      setDirty();
      this.closeDialog();
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.$emit('close');
    },
    closePreviewDialog() {
      this.previewDialogVisible = false;
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
  flex: 0 0 300px;
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
