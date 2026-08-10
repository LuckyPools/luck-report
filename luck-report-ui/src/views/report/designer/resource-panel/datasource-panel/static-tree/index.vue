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
          <i class="iconfont icon-database"></i>
          <a href="javascript:void(0)" class="ds_name">{{ datasource.name }}</a>
        </span>

        <!-- 数据集列表 -->
        <ul
            v-show="datasourceExpanded"
            class="node-list"
        >
          <li
              v-for="(dataset, index) in dsDatasets"
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
              <a href="javascript:void(0)" class="dataset_name">{{ dataset.name }}</a>
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
                    draggable="true"
                    @dblclick="handleFieldDoubleClick(dataset, field)"
                    @dragstart="handleFieldDragStart($event, dataset, field)"
                    @contextmenu.prevent.stop="showFieldContextMenu($event, dataset, field, fieldIndex)"
                >
                  <i class="iconfont icon-property"></i>
                  <a href="javascript:void(0)">{{ field.name }}</a>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>

    <StaticDatasourceDialog
        :visible="datasourceDialogVisible"
        :datasources="datasources"
        :datasource="currentDatasource"
        @close="datasourceDialogVisible = false"
        @save="handleDatasourceSave"
    />

    <!-- json数据集对话框 -->
    <StaticDatasetDialog
        :visible="jsonDatasetDialogVisible"
        :datasourceData="currentDatasourceData"
        :datasetData="currentDatasetData"
        @save="handleJsonDatasetSave"
        @close="jsonDatasetDialogVisible = false"
    />


    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenu"/>
  </div>
</template>

<script>
import {v1 as uuidv1} from 'uuid';
import {showAlert, showConfirm} from '@/utils/comnon.js';
import StaticDatasetDialog
  from '@/views/report/designer/resource-panel/datasource-panel/static-dataset-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import {buildJdbcFields} from '@/api/designer/index.js';
import {deepCopy} from '@/components/utils/index.js';
import {mapGetters} from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';
import StaticDatasourceDialog
  from "@/views/report/designer/resource-panel/datasource-panel/static-datasource-dialog/index.vue";

export default {
  name: 'StaticTree',
  components: {
    StaticDatasourceDialog,
    StaticDatasetDialog,
    ContextMenu
  },
  props: {
    datasource: {
      type: Object,
      required: true
    },
    datasources: {
      type: Array,
      required: true
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    dsDatasets() {
      return this.datasource.datasets || [];
    }
  },
  data() {
    return {
      type: 'staticDs',
      id: uuidv1(),
      datasourceExpanded: true,
      datasetExpanded: {},
      contextMenus: {},
      currentDataset: null,
      datasourceDialogVisible: false,
      currentDatasource: null,
      fieldNameDialogVisible: false,
      jsonDatasetDialogVisible: false,
      currentDatasourceData: null,
      currentDatasetData: null
    };
  },
  methods: {

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
      const items = [
        {key: 'add', name: this.$t('tree.addDataset'), icon: 'add'},
        {key: 'edit', name: this.$t('tree.edit'), icon: 'edit'},
        {key: 'delete', name: this.$t('tree.del'), icon: 'delete'}
      ];

      if (this.$refs.contextMenu) {
        this.$refs.contextMenu.show(event, items, (key) => {
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
      const items = [
        {key: 'add', name: this.$t('tree.addField'), icon: 'add'},
        {key: 'edit', name: this.$t('tree.edit'), icon: 'edit'},
        {key: 'delete', name: this.$t('tree.del'), icon: 'delete'},
        {key: 'refresh', name: this.$t('tree.refresh'), icon: 'loading'}
      ];

      if (this.$refs.contextMenu) {
        this.$refs.contextMenu.show(event, items, (key) => {
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
        {key: 'delete', name: this.$t('tree.del'), icon: 'delete'}
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
      this.currentDatasource = {
        name: this.datasource.name,
        remark: this.datasource.remark
      };
      console.log("要编辑的数据源信息", this.currentDatasource);
      this.datasourceDialogVisible = true;
    },

    /**
     * 处理数据源保存事件
     */
    handleDatasourceSave(datasourceData) {
      console.log("要保存的数据源", datasourceData);
      this.$emit('update-datasource', datasourceData);
    },

    /**
     * 删除数据源操作
     */
    deleteDatasourceAction() {
      showConfirm(this.$t('tree.delConfirm') + `[${this.datasource.name}]？`).then(() => {
        this.$emit('remove', this.datasource.name);
      });
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
        const newDatasets = deepCopy(this.dsDatasets);
        const targetDataset = newDatasets.find(item => item.name === dataset.name);
        if (!targetDataset.fields) {
          targetDataset.fields = [];
        }

        const exists = targetDataset.fields.some(field => field.name === fieldName);
        if (exists) {
          showAlert(this.$t('tree.fieldExist'));
          return;
        }

        targetDataset.fields.push({name: fieldName});
        this.$emit('update-datasource', {
          name: this.datasource.name,
          oldName: this.datasource.name,
          username: this.datasource.username,
          password: this.datasource.password,
          driver: this.datasource.driver,
          url: this.datasource.url,
          type: this.type,
          datasets: newDatasets
        });
      }
    },

    /**
     * 添加数据集操作
     */
    addDatasetAction() {
      this.currentDatasourceData = {
        name: this.datasource.name,
        remark: '',
        type: this.type,
        datasources: this.datasources
      };
      this.currentDatasetData = {parameters: []};
      this.jsonDatasetDialogVisible = true;
    },

    /**
     * 编辑数据集操作
     */
    editDatasetAction(dataset, index) {
      console.log("edit dataset", dataset)
      this.currentDatasourceData = {
        name: this.datasource.name,
        remark: '',
        type: this.type,
        datasource: this.datasources
      };
      this.currentDatasetData = dataset;
      this.jsonDatasetDialogVisible = true;
    },

    /**
     * 删除数据集操作
     */
    deleteDatasetAction(dataset, index) {
      showConfirm(this.$t('tree.delDatasetConfirm') + `[${dataset.name}]?`).then(() => {
        const newDatasets = deepCopy(this.dsDatasets);
        newDatasets.splice(index, 1);
        this.$delete(this.datasetExpanded, index);
        this.$emit('update-datasource', {
          name: this.datasource.name,
          oldName: this.datasource.name,
          remark: '',
          type: this.type,
          datasets: newDatasets
        });
      });
    },

    /**
     * 刷新数据集操作
     */
    refreshDatasetAction(dataset, index) {
      const newDatasets = deepCopy(this.dsDatasets);
      const targetDataset = newDatasets.find(item => item.name === dataset.name);
      if (targetDataset) {
        targetDataset.fields = null;
        this.$emit('update-datasource', {
          name: this.datasource.name,
          oldName: this.datasource.name,
          remark: '',
          type: this.type,
          datasets: newDatasets
        });
        this.$nextTick(() => {
          this.buildFields(targetDataset, index);
        });
      }
    },

    /**
     * 删除字段操作
     */
    deleteFieldAction(dataset, field, fieldIndex) {
      showConfirm(this.$t('tree.delFieldConfirm') + `[${field.name}]?`).then(() => {
        const newDatasets = deepCopy(this.dsDatasets);
        const targetDataset = newDatasets.find(item => item.name === dataset.name);
        if (targetDataset && targetDataset.fields) {
          targetDataset.fields.splice(fieldIndex, 1);
          this.$emit('update-datasource', {
            name: this.datasource.name,
            oldName: this.datasource.name,
            remark: '',
            type: this.type,
            datasets: newDatasets
          });
        }
      });
    },

    /**
     * 字段双击事件
     */
    handleFieldDoubleClick(dataset, field) {
      this.buildClickEvent(dataset, field, this.context);
    },

    /**
     * 字段拖拽开始事件
     * @param {DragEvent} event - 拖拽事件对象
     * @param {Object} dataset - 数据集对象
     * @param {Object} field - 字段对象
     */
    handleFieldDragStart(event, dataset, field) {
      const dragData = {
        datasetName: dataset.name,
        fieldName: field.name,
        type: 'dataset-field'
      };
      event.dataTransfer.setData('application/json', JSON.stringify(dragData));
      event.dataTransfer.effectAllowed = 'copy';
    },

    /**
     * 构建字段列表
     */
    async buildFields(dataset, index) {
      console.log("this.datasource", this.datasource)
      console.log("build dataset fields", dataset)
      const defaultFields = dataset.fields;

      if (defaultFields) {
        return;
      }

      //开始根据json字符串构建fields
      const parsed = JSON.parse(dataset.content.trim());
      // 取第一个元素的 key 作为代表（或合并所有元素的 key）
      const keys = [...new Set(parsed.flatMap(item =>
          item && typeof item === 'object' ? Object.keys(item) : []
      ))];
      const fields = keys.map(key => ({name: key}));

      const newDatasets = deepCopy(this.dsDatasets);
      const targetDataset = newDatasets.find(item => item.name === dataset.name);
      if (targetDataset) {
        targetDataset.fields = fields;
      }

      console.log("emit update-datasource", newDatasets);
      this.$emit('update-datasource', {
        name: this.datasource.name,
        oldName: this.datasource.name,
        remark: this.datasource.remark,
        type: this.type,
        datasets: newDatasets
      });
    },

    /**
     * 处理SQL数据集保存事件
     * 参数 name 是数据集的 name，this.datasource.name 是数据源的 name
     */
    handleJsonDatasetSave(name, oldName, content) {
      const newDatasets = deepCopy(this.dsDatasets);
      console.log("handleJsonDatasetSave", newDatasets)
      let dataset = newDatasets.find(item => item.name === oldName);
      if (dataset) {
        dataset.name = name;
        dataset.content = content;
        dataset.fields = null;
      } else {
        dataset = {name, content};
        newDatasets.push(dataset);
      }
      console.log("emit update-datasource", newDatasets)
      this.$emit('update-datasource', {
        name: this.datasource.name,
        oldName: this.datasource.name,
        remark: this.datasource.remark,
        type: this.type,
        datasets: newDatasets
      });
      this.$nextTick(() => {
        this.buildFields(dataset);
      });
      console.log("dataset save finish!")
    },

    /**
     * 构建点击事件（从 BaseTree 继承）
     */
    buildClickEvent(dataset, field, context) {
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
      const cellDef = getCell(rowIndex, colIndex);

      const oldCellDef = deepCopy(cellDef);

      let newCellDef;
      if (cellDef.value.type !== 'dataset') {
        newCellDef = {
          value: {type: 'dataset', conditions: []},
          rowNumber: cellDef.rowNumber,
          columnNumber: cellDef.columnNumber,
          cellStyle: cellDef.cellStyle
        };
      } else {
        newCellDef = deepCopy(cellDef);
      }

      newCellDef.expand = 'Down';
      const value = newCellDef.value;
      value.aggregate = 'group';
      value.datasetName = dataset.name;
      value.property = field.name;
      value.order = 'none';

      let text = value.datasetName + '.' + value.aggregate + '(';
      const prop = value.property;
      text += prop + ')';

      setCell(rowIndex, colIndex, newCellDef)
      hot.setDataAtCell(rowIndex, colIndex, text);

      if (window.setDirty) {
        window.setDirty();
      }

      hot.render();

      if (window.Handsontable && window.Handsontable.hooks) {
        window.Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol);
      }

      if (window.undoManager) {
        window.undoManager.add({
          redo: () => {
            const currentCellDef = getCell(rowIndex, colIndex);
            let redoCellDef;
            if (currentCellDef.value.type !== 'dataset') {
              redoCellDef = {
                value: {type: 'dataset', conditions: []},
                rowNumber: currentCellDef.rowNumber,
                columnNumber: currentCellDef.columnNumber,
                cellStyle: currentCellDef.cellStyle
              };
            } else {
              redoCellDef = deepCopy(currentCellDef);
            }
            redoCellDef.expand = 'Down';
            const redoValue = redoCellDef.value;
            redoValue.aggregate = 'group';
            redoValue.datasetName = dataset.name;
            redoValue.property = field.name;
            redoValue.order = 'none';

            let redoText = redoValue.datasetName + '.' + redoValue.aggregate + '(';
            redoText += redoValue.property + ')';
            setCell(rowIndex, colIndex, redoCellDef);
            hot.setDataAtCell(rowIndex, colIndex, redoText);
            if (window.setDirty) window.setDirty();
            hot.render();
            if (window.Handsontable && window.Handsontable.hooks) {
              window.Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol);
            }
          },
          undo: () => {
            setCell(rowIndex, colIndex, oldCellDef);
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
              window.Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol);
            }
          }
        });
      }
    }
  }
};
</script>
<style scoped>
.tree {
  a {
    text-decoration: none;
    margin-left: 4px;
    color: #000;
  }
}
</style>
