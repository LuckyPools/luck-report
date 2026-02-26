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
          <i class="iconfont icon-database"></i>
          <a href="###" class="ds_name">{{ name }}</a>
        </span>

        <!-- 数据集列表 -->
        <ul
          v-show="datasourceExpanded"
          style="margin-left: -16px;"
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

    <!-- SQL数据集对话框 -->
    <SqlDatasetDialog ref="sqlDatasetDialog" @save="handleSqlDatasetSave"/>

    <!-- 数据源对话框 -->
    <DatasourceDialog
      ref="datasourceDialogRef"
      :datasources="datasources"
      @save="handleDatasourceSave"
    />

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
import DatasourceDialog from '@/views/report/designer/resource-panel/datasource-panel/datasource-dialog/index.vue';
import FieldNameDialog from '../field-name-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import { buildJdbcFields } from '@/api/designer/index.js';

export default {
  name: 'DatabaseTree',
  components: {
    SqlDatasetDialog,
    DatasourceDialog,
    FieldNameDialog,
    ContextMenu
  },
  props: {
    ds: {
      type: Object,
      required: true
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
      type: 'jdbc',
      id: uuid.v1(),
      name: this.ds.name,
      username: this.ds.username,
      password: this.ds.password,
      driver: this.ds.driver,
      url: this.ds.url,
      datasets: this.ds.datasets || [],
      datasourceExpanded: true,
      datasetExpanded: {},
      contextMenus: {},
      currentDataset: null
    };
  },
  mounted() {
    this.initDatasetExpanded();
  },
  watch: {
    ds: {
      handler(newDs) {
        if (newDs) {
          this.name = newDs.name;
          this.username = newDs.username;
          this.password = newDs.password;
          this.driver = newDs.driver;
          this.url = newDs.url;
          this.datasets = newDs.datasets || [];
          this.initDatasetExpanded();
        }
      },
      deep: true
    }
  },
  methods: {
    /**
     * 初始化数据集展开状态
     */
    initDatasetExpanded() {
      this.datasets.forEach((dataset, index) => {
        this.$set(this.datasetExpanded, index, true);
        // 如果字段不存在，则构建字段
        if (!dataset.fields) {
          this.buildFields(dataset, index);
        }
      });
    },

    /**
     * 切换数据源展开/折叠
     */
    toggleDatasource() {
      this.datasourceExpanded = !this.datasourceExpanded;
    },

    /**
     * 切换数据集展开/折叠
     */
    toggleDataset(index) {
      this.$set(this.datasetExpanded, index, !this.datasetExpanded[index]);
    },

    /**
     * 显示数据源右键菜单
     */
    showDatasourceContextMenu(event) {
      console.log('showDatasourceContextMenu called', event);
      const items = [
        { key: 'add', name: this.$t('tree.addDataset'), icon: 'add' },
        { key: 'edit', name: this.$t('tree.edit'), icon: 'edit' },
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' }
      ];

      if (this.$refs.contextMenu) {
        console.log('Showing context menu with items:', items);
        this.$refs.contextMenu.show(event, items, (key) => {
          console.log('Menu item clicked:', key);
          if (key === 'add') {
            this.addDatasetAction();
          } else if (key === 'edit') {
            this.editDatasourceAction();
          } else if (key === 'delete') {
            this.deleteDatasourceAction();
          }
        });
      } else {
        console.error('contextMenu ref not found');
      }
    },

    /**
     * 显示数据集右键菜单
     */
    showDatasetContextMenu(event, dataset, index) {
      console.log('showDatasetContextMenu called', event, dataset, index);
      const items = [
        { key: 'add', name: this.$t('tree.addField'), icon: 'add' },
        { key: 'edit', name: this.$t('tree.edit'), icon: 'edit' },
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' },
        { key: 'refresh', name: this.$t('tree.refresh'), icon: 'loading' }
      ];

      if (this.$refs.contextMenu) {
        console.log('Showing dataset context menu with items:', items);
        this.$refs.contextMenu.show(event, items, (key) => {
          console.log('Dataset menu item clicked:', key);
          if (key === 'add') {
            this.addFieldAction(dataset);
          } else if (key === 'edit') {
            this.editDatasetAction(dataset, index);
          } else if (key === 'delete') {
            this.deleteDatasetAction(dataset, index);
          } else if (key === 'refresh') {
            this.refreshDatasetAction(dataset, index);
          }
        });
      } else {
        console.error('contextMenu ref not found');
      }
    },

    /**
     * 显示字段右键菜单
     */
    showFieldContextMenu(event, dataset, field, fieldIndex) {
      const items = [
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' }
      ];

      this.$refs.contextMenu.show(event, items, (key) => {
        if (key === 'delete') {
          this.deleteFieldAction(dataset, field, fieldIndex);
        }
      });
    },


    /**
     * 编辑数据源操作
     */
    editDatasourceAction() {
      this.$nextTick(() => {
        if (this.$refs.datasourceDialogRef) {
          // 显示对话框，传递当前数据源数据
          this.$refs.datasourceDialogRef.show({
            name: this.name,
            username: this.username,
            password: this.password,
            driver: this.driver,
            url: this.url,
            type: this.type,
            datasources: this.datasources
          });
        } else {
          console.warn('DatasourceDialog reference not found');
        }
      });
    },

    /**
     * 处理数据源保存事件
     */
    handleDatasourceSave(datasourceData) {
      // 更新本地数据
      this.name = datasourceData.name;
      this.username = datasourceData.username;
      this.password = datasourceData.password;
      this.driver = datasourceData.driver;
      this.url = datasourceData.url;

      // 通过事件通知父组件更新 ds 对象
      this.$emit('update-datasource', datasourceData);
    },

    /**
     * 删除数据源操作
     */
    deleteDatasourceAction() {
      showConfirm(this.$t('tree.delConfirm') + `[${this.name}]？`).then(() => {
        this.$emit('remove', this.name);
      });
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
     * 添加数据集操作
     */
    addDatasetAction() {
        this.$nextTick(() => {
            if (this.$refs.sqlDatasetDialog) {
                // 创建包含必要数据库信息的对象，而不是传递整个组件实例
                const dbInfo = {
                    name: this.name,
                    username: this.username,
                    password: this.password,
                    driver: this.driver,
                    url: this.url,
                    type: this.type,
                    datasources: this.datasources
                };
                this.$refs.sqlDatasetDialog.show(
                    dbInfo,
                    { parameters: [] }
                );
            }
        });
    },

    /**
     * 编辑数据集操作
     */
    editDatasetAction(dataset, index) {
        this.$nextTick(() => {
            if (this.$refs.sqlDatasetDialog) {
                // 创建包含必要数据库信息的对象，而不是传递整个组件实例
                const dbInfo = {
                    name: this.name,
                    username: this.username,
                    password: this.password,
                    driver: this.driver,
                    url: this.url,
                    type: this.type,
                    datasources: this.datasources
                };
                this.$refs.sqlDatasetDialog.show(
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
      showConfirm(this.$t('tree.delDatasetConfirm') + `[${dataset.name}]?`).then(() => {
        this.datasets.splice(index, 1);
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
     * 删除字段操作
     */
    deleteFieldAction(dataset, field, fieldIndex) {
      showConfirm(this.$t('tree.delFieldConfirm') + `[${field.name}]?`).then(() => {
        if (dataset.fields) {
          dataset.fields.splice(fieldIndex, 1);
          this.$forceUpdate();
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
        // 字段已存在，直接显示
        this.$forceUpdate();
        return;
      }
      // 从服务器获取字段
      const params = {
        sql: dataset.sql,
        parameters: JSON.stringify(dataset.parameters || []),
        username: this.username,
        password: this.password,
        driver: this.driver,
        url: this.url,
        type: 'jdbc'
      };

      try {
        const fields = await buildJdbcFields(params);
        dataset.fields = fields;
        this.$forceUpdate();
      } catch (error) {
        if (error.message) {
          showAlert('服务端错误：' + error.message);
        } else {
          showAlert(this.$t('tree.loadFieldFail'));
        }
      }
    },

    /**
     * 处理SQL数据集保存事件
     * 参数 name 是数据集的 name，this.name 是数据源的 name
     */
    handleSqlDatasetSave(name, oldName, sql, parameters) {
      // 创建新的数据源对象，避免直接修改 props
      const datasourceData = {
        name: this.name,
        oldName: this.name,
        username: this.username,
        password: this.password,
        driver: this.driver,
        url: this.url,
        type: this.type,
        datasets: this.datasets.map(dataset => ({ ...dataset })) // 深拷贝当前数据集数组
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
      this.$emit('update-datasource', datasourceData);
      this.buildFields(dataset, );
    },

    /**
     * 构建点击事件（从BaseTree继承）
     */
    _buildClickEvent(dataset, field, context) {
      const hot = context.hot;
      const cellsMap = context.cellsMap;
      const selected = hot.getSelected();

      if (!selected || selected.length === 0) {
        showAlert(this.$t('tree.cellTip'));
        return;
      }

      const rowIndex = selected[0];
      const colIndex = selected[1];
      let cellDef = context.getCell(rowIndex, colIndex);

      const oldCellDef = Object.assign({}, cellDef);

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

      cellDef.expand = 'Down';
      const value = cellDef.value;
      value.aggregate = 'group';
      value.datasetName = dataset.name;
      value.property = field.name;
      value.order = 'none';

      let text = value.datasetName + '.' + value.aggregate + '(';
      const prop = value.property;
      text += prop + ')';
      hot.setDataAtCell(rowIndex, colIndex, text);

      // 设置脏标记
      if (window.setDirty) {
        window.setDirty();
      }

      hot.render();

      // 触发选择结束事件
      if (window.Handsontable && window.Handsontable.hooks) {
        window.Handsontable.hooks.run(hot, 'afterSelectionEnd', selected[0], selected[1], selected[2], selected[3]);
      }

      // 添加到撤销管理器
      if (window.undoManager) {
        window.undoManager.add({
          redo: function() {
            cellDef = context.getCell(rowIndex, colIndex);
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
            cellDef.expand = 'Down';
            const value = cellDef.value;
            value.aggregate = 'group';
            value.datasetName = dataset.name;
            value.property = field.name;
            value.order = 'none';

            let text = value.datasetName + '.' + value.aggregate + '(';
            text += value.property + ')';
            hot.setDataAtCell(rowIndex, colIndex, text);
            if (window.setDirty) window.setDirty();
            hot.render();
            if (window.Handsontable && window.Handsontable.hooks) {
              window.Handsontable.hooks.run(hot, 'afterSelectionEnd', selected[0], selected[1], selected[2], selected[3]);
            }
          },
          undo: function() {
            cellDef = context.getCell(rowIndex, colIndex);
            context.removeCell(cellDef);
            context.addCell(oldCellDef);
            const value = oldCellDef.value;
            let text = value.value || '';
            if (value.type === 'dataset') {
              text = value.datasetName + '.' + value.aggregate + '(';
              text += value.property + ')';
            }
            hot.setDataAtCell(rowIndex, colIndex, text);
            if (window.setDirty) window.setDirty();
            hot.render();
            if (window.Handsontable && window.Handsontable.hooks) {
              window.Handsontable.hooks.run(hot, 'afterSelectionEnd', selected[0], selected[1], selected[2], selected[3]);
            }
          }
        });
      }
    }
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

