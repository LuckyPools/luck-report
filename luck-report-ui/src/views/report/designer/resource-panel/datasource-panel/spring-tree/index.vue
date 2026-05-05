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
          <i class="iconfont icon-leaf"></i>
          <a href="###" class="ds_name">{{ localName }}</a>
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

    <!-- Bean方法配置对话框 -->
    <BeanMethodDialog
        :visible="beanMethodDialogVisible"
        :dataset="currentDataset"
        :datasources="datasources"
        :beanId="localBeanId"
        @save="handleBeanMethodSave"
        @close="beanMethodDialogVisible = false"
      />

    <!-- Spring数据源配置对话框 -->
    <SpringDialog
      ref="springDialog"
      :datasources="datasources"
      :visible="springDialogVisible"
      :datasource="currentSpringDatasource"
      @close="springDialogVisible = false"
      @save="handleSpringDatasourceSave"
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
import { v1 as uuidv1 } from 'uuid';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import BeanMethodDialog from '@/views/report/designer/resource-panel/datasource-panel/bean-method-dialog/index.vue';
import SpringDialog from '@/views/report/designer/resource-panel/datasource-panel/spring-dialog/index.vue';
import FieldNameDialog from '../field-name-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import { buildClass } from '@/api/designer/index.js';
import { mapGetters } from 'vuex';
import {addCell, getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'SpringTree',
  components: {
    BeanMethodDialog,
    SpringDialog,
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
    beanId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      id: 'spring_' + uuidv1(),
      datasourceExpanded: true,
      datasetExpanded: {},
      localName: this.name,
      localBeanId: this.beanId,
      currentDataset: null,
      beanMethodDialogVisible: false,
      springDialogVisible: false,
      currentSpringDatasource: null,
      fieldNameDialogVisible: false
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  created() {
    // 初始化数据集展开状态
    if (this.datasets && this.datasets.length > 0) {
      for (let i = 0; i < this.datasets.length; i++) {
        this.$set(this.datasetExpanded, i, true);
      }
    }
  },
  watch: {
    name(newName) {
      this.localName = newName;
    },
    beanId(newBeanId) {
      this.localBeanId = newBeanId;
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
        { key: 'edit', name: this.$t('tree.edit'), icon: 'edit' },
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' }
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
      } else if (key === 'edit') {
        this.editDatasourceAction();
      }
    },

    /**
     * 添加数据集操作
     */
    addDatasetAction() {
      this.currentDataset = null;
      this.beanMethodDialogVisible = true;
    },

    /**
     * 删除数据源操作
     */
    deleteDatasourceAction() {
      let that = this;
      showConfirm(`${this.$t('tree.delConfirm')}[${this.name}]？`).then(() => {
        that.$emit('remove', this.name);
      });
    },

    /**
     * 编辑数据源操作
     */
    editDatasourceAction() {
      this.currentSpringDatasource = {
        name: this.localName,
        beanId: this.localBeanId
      };
      this.springDialogVisible = true;
    },

    /**
     * 显示数据集右键菜单
     */
    showDatasetContextMenu(event, dataset, index) {
      const items = [
        { key: 'add', name: this.$t('tree.addField'), icon: 'add' },
        { key: 'edit', name: this.$t('tree.edit'), icon: 'edit' },
        { key: 'delete', name: this.$t('tree.del'), icon: 'delete' },
        { key: 'refresh', name: this.$t('tree.refresh'), icon: 'loading' }
      ];

      this.$refs.contextMenu.show(event, items, (key) => {
        this.handleDatasetMenuAction(key, dataset, index);
      });
    },

    /**
     * 处理数据集菜单操作
     */
    handleDatasetMenuAction(key, dataset, index) {
      if (key === 'add') {
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
        const newDatasets = deepCopy(this.datasets);
        const targetDataset = newDatasets.find(d => d.name === dataset.name);
        
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
        this.$emit('update-datasets', newDatasets);
      }
    },

    /**
     * 编辑数据集操作
     */
    editDatasetAction(dataset, index) {
      this.currentDataset = dataset;
      this.beanMethodDialogVisible = true;
    },

    /**
     * 处理Bean方法保存事件
     */
    handleBeanMethodSave(name, method, clazz, oldName) {
      const newDatasets = deepCopy(this.datasets);
      
      if (oldName && oldName !== '') {
        const index = newDatasets.findIndex(dataset => dataset.name === oldName);
        if (index !== -1) {
          const dataset = newDatasets[index];
          const originalClazz = dataset.clazz || '';

          dataset.name = name;
          dataset.method = method;
          dataset.clazz = clazz;

          if (clazz !== originalClazz) {
            if (!clazz || clazz === '') {
              dataset.fields = [];
            } else {
              this.buildFields(dataset, index, false, newDatasets);
            }
          }

          this.$emit('update-datasets', newDatasets);
          return;
        }
      }

      const dataset = { name, method, clazz, fields: [] };
      newDatasets.push(dataset);
      const index = newDatasets.length - 1;
      this.$set(this.datasetExpanded, index, true);

      if (clazz && clazz !== '') {
        this.buildFields(dataset, index, false, newDatasets);
      }
      
      this.$emit('update-datasets', newDatasets);
    },

    /**
     * 删除数据集操作
     */
    deleteDatasetAction(dataset, index) {
        let that = this;
        showConfirm(`${this.$t('tree.delDatasetConfirm')}[${dataset.name}]?`).then(() => {
          const newDatasets = deepCopy(this.datasets);
          newDatasets.splice(index, 1);
          that.$delete(that.datasetExpanded, index);
          that.$emit('update-datasets', newDatasets);
        });
    },

    /**
     * 刷新数据集操作
     */
    refreshDatasetAction(dataset, index) {
      const newDatasets = deepCopy(this.datasets);
      const targetDataset = newDatasets.find(d => d.name === dataset.name);
      this.buildFields(targetDataset, index, true, newDatasets);
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
      showConfirm(`${this.$t('tree.delFieldConfirm')}[${field.name}]?`).then(() => {
        const newDatasets = deepCopy(this.datasets);
        const targetDataset = newDatasets.find(d => d.name === dataset.name);
        if (targetDataset.fields) {
          targetDataset.fields.splice(fieldIndex, 1);
          that.$emit('update-datasets', newDatasets);
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
    async buildFields(dataset, index, refresh = false, newDatasets = null) {
      const defaultFields = dataset.fields;

      if (!refresh && defaultFields) {
        if (newDatasets) {
          this.$emit('update-datasets', newDatasets);
        }
        return;
      }

      try {
        const response = await buildClass(dataset.clazz);
        const fields = response;
        this.$set(dataset, 'fields', fields);
        if (newDatasets) {
          this.$emit('update-datasets', newDatasets);
        }
      } catch (error) {
        if (error.msg) {
          showAlert("服务端错误：" + error.msg);
        } else {
          showAlert(this.$t('tree.loadFieldFail'));
        }
      }
    },

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
      const cellDef = getCell(rowIndex, colIndex);

      let newCellDef = deepCopy(cellDef);

      if (newCellDef.value.type !== 'dataset') {
        newCellDef = {
          value: { type: 'dataset', conditions: [] },
          rowNumber: newCellDef.rowNumber,
          columnNumber: newCellDef.columnNumber,
          cellStyle: newCellDef.cellStyle
        };
        addCell( newCellDef);
      } else {
        setCell( rowIndex, colIndex, newCellDef )
      }

      newCellDef.expand = "Down";
      const value = newCellDef.value;
      value.aggregate = "group";
      value.datasetName = dataset.name;
      value.property = field.name;
      value.order = 'none';

      const text = value.datasetName + "." + value.aggregate + "(";
      const prop = value.property;
      text += prop + ')';
      hot.setDataAtCell(rowIndex, colIndex, text);

      hot.render();

      if (hot.hooks) {
        hot.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol);
      }
    },

    /**
     * 处理Spring数据源保存事件
     */
    handleSpringDatasourceSave(datasourceData) {
      // 更新本地数据源名称和beanId
      this.localName = datasourceData.name;
      this.localBeanId = datasourceData.beanId;

      // 通过事件通知父组件更新
      this.$emit('update-datasource', datasourceData);
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
