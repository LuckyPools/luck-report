<template>
  <div>
    <UDialog
      :title="$t('dialog.sql.title')"
      width="1080px"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <div class="content-layout">
          <!-- 左侧容器：搜索表格 -->
          <div class="left-panel">
            <SearchTable
                ref="searchTable"
                :db="db"
                @add="handleAddSql"
            />
          </div>

          <!-- 右侧容器：SQL 编辑器和参数编辑器 -->
          <div class="right-panel">
            <SqlEditor
                ref="sqlEditor"
                :initialName="datasetName"
            />
            <ParameterEditor
                ref="parameterEditor"
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
    <PreviewDataDialog ref="previewDataDialog" />
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
import { previewData } from '@/api/designer/index.js';
import {showAlert} from "@/utils/comnon";

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
  data() {
    return {
      visible: false,
      db: null,
      datasources: [],
      datasetName: '',
      parameters: [],
      oldName: '',
      currentData: {}
    };
  },
  methods: {
    /**
     * 显示对话框
     * @param {Object} db - 数据库配置
     * @param {Object} data - 数据集数据
     */
    show(db, data) {
      this.db = db;
      this.datasources = db?.datasources || [];

      // 清空旧数据
      this.currentData = {};
      this.datasetName = '';
      this.parameters = [];
      this.oldName = '';

      // 设置新数据
      if (data) {
        this.currentData = { ...data };
        this.datasetName = data.name || '';
        this.parameters = Array.isArray(data.parameters) ? [...data.parameters] : [];
        this.oldName = data.name || '';
      }

      this.visible = true;

      // 延迟初始化/更新 CodeMirror 和加载表格数据
      this.$nextTick(() => {
          // 调用SqlEditor组件的initCodeMirror方法
          if (this.$refs.sqlEditor) {
              this.$refs.sqlEditor.initCodeMirror(this.currentData.sql);
              this.$refs.sqlEditor.setDatasetName(this.datasetName);
          }
          // 调用SearchTable组件的loadDatabaseTables方法
          if (this.$refs.searchTable) {
              this.$refs.searchTable.loadDatabaseTables();
          }
      });
    },

    /**
     * 处理添加 SQL
     */
    handleAddSql(sql) {
      console.log('收到添加SQL请求:', sql);
      if (this.$refs.sqlEditor) {
        console.log('调用SqlEditor的setSql方法');
        this.$refs.sqlEditor.setSql(sql);
      } else {
        console.error('SqlEditor组件引用不存在');
      }
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
    async handlePreview() {
      // 获取SQL和其他必要参数
      const sql = this.$refs.sqlEditor ? this.$refs.sqlEditor.getSql() : '';
      const type = this.db.type;
      const parameters = {
        sql,
        type,
        parameters: JSON.stringify(this.currentData.parameters)
      };

      if (type === 'jdbc') {
        parameters.username = this.db.username;
        parameters.password = this.db.password;
        parameters.driver = this.db.driver;
        parameters.url = this.db.url;
      } else if (type === 'buildin') {
        parameters.name = this.db.name;
      }

      // 显示预览对话框
      if (this.$refs.previewDataDialog) {
        this.$refs.previewDataDialog.show();

        try {
          const data = await previewData(parameters);
          this.$refs.previewDataDialog.showData(data);
        } catch (error) {
          let msg = this.$t('dialog.sql.previewFail');
          if(error.msg){
            msg = error.msg;
          }
          this.$refs.previewDataDialog.showError(`<div style='color: #d30e00;'>${msg}</div>`);
        }
      }
    },

    /**
     * 处理确认保存（来自页脚按钮）
     */
    handleConfirm() {
      const name = this.$refs.sqlEditor ? this.$refs.sqlEditor.getDatasetName() : '';
      const sql = this.$refs.sqlEditor ? this.$refs.sqlEditor.getSql() : '';

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
        for (let datasource of this.datasources) {
          // 确保datasets属性存在且可迭代
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
      this.visible = false;
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

