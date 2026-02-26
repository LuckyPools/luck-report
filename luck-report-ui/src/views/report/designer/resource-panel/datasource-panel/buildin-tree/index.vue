<template>
  <div class="tree" style="margin-left: 10px">
    <ul style="padding-left: 20px;">
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
          style="margin-left: -16px;"
        >
          <li
            v-for="(dataset, index) in localDatasets"
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

    <!-- SQL数据集对话框 -->
    <SqlDatasetDialog ref="sqlDatasetDialog" @save="handleSqlDatasetSave"/>

    <!-- 字段名输入对话框 -->
    <FieldNameDialog ref="fieldNameDialog" @save="handleFieldNameSave" />

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenu" />
  </div>
</template>

<script>
import uuid from 'node-uuid';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import SqlDatasetDialog from '@/views/report/designer/resource-panel/datasource-panel/sql-dataset-dialog/index.vue';
import FieldNameDialog from '../field-name-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import { buildFields } from '@/api/designer/index.js';

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
    },
    datasources: {
      type: Array,
      required: true
    },
    context: {
      type: Object,
      required: true
    }
  },
  data() {
      return {
        id: 'buildin_' + uuid.v1(),
        datasourceExpanded: true,
        datasetExpanded: {},
        localDatasets: [],
        currentDataset: null
      };
  },
  created() {
    // 初始化本地数据集副本
    this.localDatasets = this.datasets ? [...this.datasets] : [];

    // 初始化数据集展开状态
    if (this.localDatasets && this.localDatasets.length > 0) {
      for (let i = 0; i < this.localDatasets.length; i++) {
        this.$set(this.datasetExpanded, i, true);
      }
    }
  },
  watch: {
    datasets: {
      handler(newVal) {
        // 当父组件更新 datasets 时，更新本地副本
        this.localDatasets = newVal ? [...newVal] : [];

        // 更新数据集展开状态
        this.datasetExpanded = {};
        if (this.localDatasets && this.localDatasets.length > 0) {
          for (let i = 0; i < this.localDatasets.length; i++) {
            this.$set(this.datasetExpanded, i, true);
          }
        }
      },
      deep: true
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
      let that = this;
      this.$nextTick(() => {
        if (that.$refs.sqlDatasetDialog) {
          // 创建包含 type 和 name 属性的对象
          const dbInfo = {
            type: 'buildin',
            name: that.name
          };

          that.$refs.sqlDatasetDialog.show(
            dbInfo,
            { parameters: [] }
          );
        }
      });
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
      let that = this;
      this.currentDataset = dataset;
      this.$nextTick(() => {
        if (that.$refs.fieldNameDialog) {
          that.$refs.fieldNameDialog.show(dataset);
        }
      });
    },

    /**
     * 处理字段名保存事件
     */
    handleFieldNameSave(fieldName, dataset) {
      if (fieldName) {
        if (!dataset.fields) {
          dataset.fields = [];
        }

        // 检查字段是否已存在
        const exists = dataset.fields.some(field => field.name === fieldName);
        if (exists) {
          showAlert(this.$t('tree.fieldExist'));
          return;
        }

        const field = { name: fieldName };
        dataset.fields.push(field);
        this.$forceUpdate();
      }
    },

    /**
     * 编辑数据集操作
     */
    editDatasetAction(dataset, index) {
        let that = this;
      this.$nextTick(() => {
        if (that.$refs.sqlDatasetDialog) {
          // 创建包含 type 和 name 属性的对象
          const dbInfo = {
            type: 'buildin',
            name: that.name
          };

            that.$refs.sqlDatasetDialog.show(
                dbInfo,
                dataset
            );
        }
      });
    },

    /**
     * 删除数据集操作
     */
    deleteDatasetAction(dataset, index) {
      showConfirm(`${this.$t('tree.delDatasetConfirm')}[${dataset.name}]?`).then(() => {
        this.localDatasets.splice(index, 1);
        this.$delete(this.datasetExpanded, index);
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
        if (dataset.fields) {
          dataset.fields.splice(fieldIndex, 1);
          that.$forceUpdate();
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
        // 如果已有字段，直接使用
        this.$forceUpdate();
        return;
      }

      // 准备参数
      const parameters = {
        sql: dataset.sql,
        parameters: JSON.stringify(dataset.parameters),
        name: this.name,
        type: 'buildin'
      };

      try {
        const fields = await buildFields(parameters);
        // 更新数据集字段
        this.$set(dataset, 'fields', fields);
        this.$forceUpdate();
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
      let hot = context.hot, cellsMap = context.cellsMap;
      let selected = hot.getSelected();

      if (!selected || selected.length === 0) {
        showAlert(this.$t('tree.cellTip'));
        return;
      }

      let rowIndex = selected[0], colIndex = selected[1];
      let cellDef = context.getCell(rowIndex, colIndex);

      let oldCellDef = Object.assign({}, cellDef);

      if (cellDef.value.type !== 'dataset') {
        context.removeCell(cellDef);
        cellDef = {
          value: { type: 'dataset', conditions: [] },
          rowNumber: cellDef.rowNumber,
          columnNumber: cellDef.columnNumber,
          cellStyle: cellDef.cellStyle
        };
        context.addCell(cellDef);
      }

      cellDef.expand = "Down";
      let value = cellDef.value;
      value.aggregate = "group";
      value.datasetName = dataset.name;
      value.property = field.name;
      value.order = 'none';

      let text = value.datasetName + "." + value.aggregate + "(";
      let prop = value.property;
      text += prop + ')';
      hot.setDataAtCell(rowIndex, colIndex, text);

      // 触发相关事件
      hot.render();
      // 这里省略了 undoManager 相关代码，因为 Vue 组件中通常使用 Vuex 管理状态

      // 触发选择结束事件
      if (hot.hooks) {
        hot.hooks.run(hot, 'afterSelectionEnd', selected[0], selected[1], selected[2], selected[3]);
      }
    },

    /**
     * 处理SQL数据集保存事件
     * 参数 name 是数据集的 name，this.name 是数据源的 name
     */
    handleSqlDatasetSave(name, oldName, sql, parameters) {
      // 创建数据源对象用于通知父组件更新
      const datasourceData = {
        name: this.name,
        oldName: this.name,
        datasets: this.localDatasets.map(dataset => ({ ...dataset }))
      };

      // 查找正在编辑的数据集
      let dataset = datasourceData.datasets.find(dataset => dataset.name === oldName);
      if (dataset) {
        // 编辑现有数据集
        dataset.name = name;
        dataset.sql = sql;
        dataset.parameters = parameters;
        dataset.fields = null;
      } else {
        // 添加新数据集
        dataset = { name, sql, parameters };
        datasourceData.datasets.push(dataset);
      }
      // 通过事件通知父组件更新数据源
      this.$emit('update-datasource', datasourceData);
      this.buildFields(dataset, );
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
