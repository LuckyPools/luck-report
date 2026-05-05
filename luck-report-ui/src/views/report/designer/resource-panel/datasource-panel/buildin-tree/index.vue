<template>
  <div class="tree" style="margin-left: 10px">
    <ul class="tree-root">
      <li>
        <!-- 数据源节点 -->
        <span
          :id="id"
          @click="toggleDatasource"
          @contextmenu.prevent.stop="showDatasourceContextMenu($event)"
        >
          <i
            class="iconfont"
            :class="datasourceExpanded ? 'icon-minus-circle' : 'icon-plus-circle'"
            style="margin-right:2px"
          ></i>
          <i class="iconfont icon-share"></i>
          <a href="###" class="ds_name">{{ name }}</a>
        </span>

        <!-- 数据集列表 -->
        <ul
          v-show="datasourceExpanded"
          class="node-list"
        >
          <li
            v-for="(dataset, index) in datasets"
            :key="dataset.name + '_' + index"
          >
            <!-- 数据集节点 -->
            <span
              :id="'dataset_' + dataset.name + '_' + index"
              @click="toggleDataset(index)"
              @contextmenu.prevent.stop="showDatasetContextMenu($event, dataset, index)"
            >
              <i
                class="iconfont"
                :class="datasetExpanded[index] ? 'icon-minus-circle' : 'icon-plus-circle'"
                style="margin-right:2px"
              ></i>
              <i class="iconfont icon-sqlds"></i>
              <a href="###" class="dataset_name">{{ dataset.name }}</a>
            </span>

            <!-- 字段列表 -->
            <ul
              v-show="datasetExpanded[index]"
              style="padding-left: 22px;"
            >
              <li
                v-for="(field, fieldIndex) in dataset.fields"
                :key="field.name + '_' + fieldIndex"
              >
                <span
                  :id="'field_' + dataset.name + '_' + field.name + '_' + fieldIndex"
                  :title="$t('tree.doubleClick')"
                  @dblclick="handleFieldDoubleClick(dataset, field)"
                  @contextmenu.prevent.stop="showFieldContextMenu($event, dataset, field, fieldIndex)"
                >
                  <i class="iconfont icon-property"></i>
                  <a href="###">{{ field.name }}</a>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>

    <SqlDatasetDialog
      :visible="sqlDatasetDialogVisible"
      :db="currentDbInfo"
      :datasetData="currentDatasetData"
      @save="handleSqlDatasetSave"
      @close="sqlDatasetDialogVisible = false"
    />

    <!-- 字段名输入对话框 -->
    <FieldNameDialog
      ref="fieldNameDialog"
      :visible="fieldNameDialogVisible"
      :dataset="currentDataset"
      @save="handleFieldNameSave"
      @close="fieldNameDialogVisible = false"
    />

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenu" />
  </div>
</template>

<script>
/* eslint-disable */
import { v1 as uuidv1 } from 'uuid';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import SqlDatasetDialog from '@/views/report/designer/resource-panel/datasource-panel/sql-dataset-dialog/index.vue';
import FieldNameDialog from '../field-name-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import { buildFields } from '@/api/designer/index.js';
import { mapGetters } from 'vuex';
import {addCell, getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'BuildinTree',
  components: {
    SqlDatasetDialog,
    FieldNameDialog,
    ContextMenu
  },
  props: {
    name: {
      type: String,
      required: true
    },
    datasets: {
      type: Array,
      default: () => []
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
        id: 'buildin_' + uuidv1(),
        datasourceExpanded: true,
        datasetExpanded: {},
        currentDataset: null,
        fieldNameDialogVisible: false,
        sqlDatasetDialogVisible: false,
        currentDbInfo: null,
        currentDatasetData: null
      };
  },
  created() {
    // 初始化数据集展开状态
    if (this.datasets && this.datasets.length > 0) {
      for (let i = 0; i < this.datasets.length; i++) {
        this.$set(this.datasetExpanded, i, true);
      }
    }
  },
  methods: {
    /**
     * 切换数据源展开/折叠状态
     */
    toggleDatasource() {
      this.datasourceExpanded = !this.datasourceExpanded;
    },

    /**
     * 切换数据集展开/折叠状态
     */
    toggleDataset(index) {
      this.$set(this.datasetExpanded, index, !this.datasetExpanded[index]);
    },

    /**
     * 显示数据源右键菜单
     */
    showDatasourceContextMenu(event) {
      const items = [
        { key: 'add', name: this.$t('tree.addDataset'), icon: 'add' },
        { key: 'delete', name: this.$t('tree.delete'), icon: 'delete' }
      ];

      let that = this;
      this.$refs.contextMenu.show(event, items, (key) => {
          that.handleDatasourceMenuAction(key);
      });
    },

    /**
     * 处理数据源菜单操作
     */
    handleDatasourceMenuAction(key) {
      if (key === 'add') {
        this.addDatasetAction();
      } else if (key === 'delete') {
        this.deleteDatasourceAction();
      }
    },

    /**
     * 添加数据集操作
     */
    addDatasetAction() {
      this.currentDbInfo = {
        type: 'buildin',
        name: this.name
      };
      this.currentDatasetData = { parameters: [] };
      this.sqlDatasetDialogVisible = true;
    },

    /**
     * 删除数据源操作
     */
    deleteDatasourceAction() {
      let that = this;
      showConfirm(`${this.$t('tree.delConfirm')}[${this.name}]？`).then(() => {
        that.$emit('remove', that.name);
      })
    },

    /**
     * 显示数据集右键菜单
     */
    showDatasetContextMenu(event, dataset, index) {
      const items = [
        { key: 'addField', name: this.$t('tree.addField'), icon: 'add' },
        { key: 'edit', name: this.$t('tree.edit'), icon: 'edit' },
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' },
        { key: 'refresh', name: this.$t('tree.refresh'), icon: 'loading' }
      ];

      let that = this;
      this.$refs.contextMenu.show(event, items, (key) => {
          that.handleDatasetMenuAction(key, dataset, index);
      });
    },

    /**
     * 处理数据集菜单操作
     */
    handleDatasetMenuAction(key, dataset, index) {
      if (key === 'addField') {
        this.addFieldAction(dataset);
      } else if (key === 'delete') {
        this.deleteDatasetAction(dataset, index);
      } else if (key === 'edit') {
        this.editDatasetAction(dataset, index);
      } else if (key === 'refresh') {
        this.refreshDatasetAction(dataset, index);
      }
    },

    /**
     * 添加字段操作
     */
    addFieldAction(dataset) {
      this.currentDataset = dataset;
      this.fieldNameDialogVisible = true;
    },

    /**
     * 处理字段名保存事件
     */
    handleFieldNameSave(fieldName, dataset) {
      if (fieldName) {
        if (!dataset.fields) {
          dataset.fields = [];
        }

        const newDatasets = deepCopy(this.datasets);
        const targetDataset = newDatasets.find(ds => ds.name === dataset.name);
        if (!targetDataset.fields) {
          targetDataset.fields = [];
        }

        const exists = targetDataset.fields.some(field => field.name === fieldName);
        if (exists) {
          showAlert(this.$t('tree.fieldExist'));
          return;
        }

        const field = { name: fieldName };
        targetDataset.fields.push(field);
        this.$emit('update-datasource', {
          name: this.name,
          oldName: this.name,
          datasets: newDatasets
        });
      }
    },

    /**
     * 编辑数据集操作
     */
    editDatasetAction(dataset, index) {
      this.currentDbInfo = {
        type: 'buildin',
        name: this.name
      };
      this.currentDatasetData = dataset;
      this.sqlDatasetDialogVisible = true;
    },

    /**
     * 删除数据集操作
     */
    deleteDatasetAction(dataset, index) {
      showConfirm(`${this.$t('tree.delDatasetConfirm')}[${dataset.name}]?`).then(() => {
        const newDatasets = deepCopy(this.datasets);
        newDatasets.splice(index, 1);
        this.$delete(this.datasetExpanded, index);
        this.$emit('update-datasource', {
          name: this.name,
          oldName: this.name,
          datasets: newDatasets
        });
      });
    },

    /**
     * 刷新数据集操作
     */
    refreshDatasetAction(dataset, index) {
      dataset.fields = null;
      this.buildFields(dataset, index);
    },

    /**
     * 显示字段右键菜单
     */
    showFieldContextMenu(event, dataset, field, fieldIndex) {
      const items = [
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' }
      ];

      let that = this;
      this.$refs.contextMenu.show(event, items, (key) => {
          that.handleFieldMenuAction(key, dataset, field, fieldIndex);
      });
    },

    /**
     * 处理字段菜单操作
     */
    handleFieldMenuAction(key, dataset, field, fieldIndex) {
      if (key === 'delete') {
        this.deleteFieldAction(dataset, field, fieldIndex);
      }
    },

    /**
     * 删除字段操作
     */
    deleteFieldAction(dataset, field, fieldIndex) {
      let that = this;
      showConfirm(`${this.$t('tree.delFieldConfirm')}[${field.name}]？`).then(() => {
        const newDatasets = deepCopy(this.datasets);
        const targetDataset = newDatasets.find(ds => ds.name === dataset.name);
        if (targetDataset && targetDataset.fields) {
          targetDataset.fields.splice(fieldIndex, 1);
          that.$emit('update-datasource', {
            name: that.name,
            oldName: that.name,
            datasets: newDatasets
          });
        }
      });
    },

    /**
     * 字段双击事件
     */
    handleFieldDoubleClick(dataset, field) {
      this._buildClickEvent(dataset, field, this.context);
    },

    /**
     * 构建字段列表
     */
    async buildFields(dataset, index) {
      const defaultFields = dataset.fields;

      if (defaultFields) {
        return;
      }

      const parameters = {
        sql: dataset.sql,
        parameters: JSON.stringify(dataset.parameters),
        name: this.name,
        type: 'buildin'
      };

      try {
        const fields = await buildFields(parameters);
        const newDatasets = deepCopy(this.datasets);
        const targetDataset = newDatasets.find(ds => ds.name === dataset.name);
        if (targetDataset) {
          targetDataset.fields = fields;
          this.$emit('update-datasource', {
            name: this.name,
            oldName: this.name,
            datasets: newDatasets
          });
        }
      } catch (error) {
        if (error.message) {
          showAlert("服务端错误：" + error.message);
        } else {
          showAlert(this.$t('tree.loadFieldFail'));
        }
      }
    },

    /**
     * BaseTree 的 _buildClickEvent 方法
     */
    _buildClickEvent(dataset, field, context) {
      const hot = TableManager.get();
      if (!hot) {
        showAlert(this.$t('tree.cellTip'));
        return;
      }
      const cellsMap = context.cellsMap;
      const selected = hot.getSelected();

      if (!selected || selected.length === 0) {
        showAlert(this.$t('tree.cellTip'));
        return;
      }

      const [rowIndex, colIndex, endRow, endCol] = selected[0];
      let cellDef = getCell(rowIndex, colIndex);

      if (cellDef.value.type !== 'dataset') {
        const newCellDef = deepCopy(cellDef);
        newCellDef.value = { type: 'dataset', conditions: [] };
        addCell( newCellDef );
        cellDef = newCellDef;
      }

      const newCellDef = deepCopy(cellDef);
      newCellDef.expand = "Down";
      const value = newCellDef.value;
      value.aggregate = "group";
      value.datasetName = dataset.name;
      value.property = field.name;
      value.order = 'none';

      let text = value.datasetName + "." + value.aggregate + "(";
      const prop = value.property;
      text += prop + ')';
      hot.setDataAtCell(rowIndex, colIndex, text);

      setCell(rowIndex, colIndex, newCellDef );

      hot.render();

      if (hot.hooks) {
        hot.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol);
      }
    },

    /**
     * 处理SQL数据集保存事件
     * 参数 name 是数据集的 name，this.name 是数据源的 name
     */
    handleSqlDatasetSave(name, oldName, sql, parameters) {
      const newDatasets = deepCopy(this.datasets);

      let dataset = newDatasets.find(dataset => dataset.name === oldName);
      if (dataset) {
        dataset.name = name;
        dataset.sql = sql;
        dataset.parameters = parameters;
        dataset.fields = null;
      } else {
        dataset = { name, sql, parameters };
        newDatasets.push(dataset);
      }

      this.$emit('update-datasource', {
        name: this.name,
        oldName: this.name,
        datasets: newDatasets
      });
      this.buildFields(dataset);
    },
  }
};
</script>
<style scoped>
.tree{
  a {
    text-decoration: none;
    margin-left: 4px;
    color: #000;
  }
}
</style>
