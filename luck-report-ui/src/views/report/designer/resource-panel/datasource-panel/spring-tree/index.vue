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

    <!-- Bean方法配置对话框 -->
    <BeanMethodDialog
        ref="beanMethodDialog"
        :datasources="localDatasets"
        :beanId="localBeanId"
        @save="handleBeanMethodSave"
      />

    <!-- Spring数据源配置对话框 -->
    <SpringDialog ref="springDialog" :datasources="datasources" @save="handleSpringDatasourceSave"/>

    <!-- 字段名输入对话框 -->
    <FieldNameDialog ref="fieldNameDialog" @save="handleFieldNameSave" />

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenu" />
  </div>
</template>

<script>
import uuid from 'node-uuid';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import BeanMethodDialog from '@/views/report/designer/resource-panel/datasource-panel/bean-method-dialog/index.vue';
import SpringDialog from '@/views/report/designer/resource-panel/datasource-panel/spring-dialog/index.vue';
import FieldNameDialog from '../field-name-dialog/index.vue';
import ContextMenu from '../context-menu/index.vue';
import { buildClass } from '@/api/designer/index.js';

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
    },
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      id: 'spring_' + uuid.v1(),
      datasourceExpanded: true,
      datasetExpanded: {},
      // 本地数据集副本
      localDatasets: [],
      // 本地数据源名称
      localName: this.name,
      // 本地beanId
      localBeanId: this.beanId,
      // 当前数据集
      currentDataset: null
    };
  },
  computed: {
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
    name(newName) {
      this.localName = newName;
    },
    beanId(newBeanId) {
      this.localBeanId = newBeanId;
    },
    // 监听本地数据集变化并同步到父组件
    localDatasets: {
      handler(newDatasets) {
        // 通知父组件数据集已更新
        this.$emit('update-datasets', newDatasets);
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
      let that = this;
      this.$nextTick(() => {
        if (that.$refs.beanMethodDialog) {
            that.$refs.beanMethodDialog.show();
        }
      });
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
      let that = this;
      this.$nextTick(() => {
        if (that.$refs.springDialog) {
            that.$refs.springDialog.show({
              name: that.localName,
              beanId: that.localBeanId
            });
        }
      });
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
        if (that.$refs.beanMethodDialog) {
            that.$refs.beanMethodDialog.show(dataset);
        }
      });
    },

    /**
     * 处理Bean方法保存事件
     */
    handleBeanMethodSave(name, method, clazz, oldName) {
      // 如果有 oldName，说明是编辑模式，需要查找并更新现有数据集
      if (oldName && oldName !== '') {
        // 查找匹配的数据集
        const index = this.localDatasets.findIndex(dataset => dataset.name === oldName);
        if (index !== -1) {
          // 更新现有数据集
          const dataset = this.localDatasets[index];
          const originalClazz = dataset.clazz || '';

          // 更新数据集信息
          dataset.name = name;
          dataset.method = method;
          dataset.clazz = clazz;

          // 只有当clazz发生变化时才重新构建字段
          if (clazz !== originalClazz) {
            // 当clazz变为空时，清空字段；当clazz变为非空且与原来不同时，重新加载字段
            if (!clazz || clazz === '') {
              // 清空字段
              dataset.fields = [];
            } else {
              // 强制刷新字段（因为clazz已更改）
              this.buildFields(dataset, index, false);
            }
          }

          this.$forceUpdate();
          return;
        }
      }

      // 没有找到匹配的数据集或者没有 oldName，说明是新增模式
      const dataset = { name, method, clazz, fields: [] };
      this.localDatasets.push(dataset);
      const index = this.localDatasets.length - 1;
      this.$set(this.datasetExpanded, index, true);

      if (clazz && clazz !== '') {
        this.buildFields(dataset, index);
      }
    },

    /**
     * 删除数据集操作
     */
    deleteDatasetAction(dataset, index) {
        let that = this;
        showConfirm(`${this.$t('tree.delDatasetConfirm')}[${dataset.name}]?`).then(() => {
          that.localDatasets.splice(index, 1);
          that.$delete(that.datasetExpanded, index);
        });
    },

    /**
     * 刷新数据集操作
     */
    refreshDatasetAction(dataset, index) {
      this.buildFields(dataset, index, true);
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
    async buildFields(dataset, index, refresh = false) {
      const defaultFields = dataset.fields;

      // 如果不是强制刷新且已有字段，直接使用
      if (!refresh && defaultFields ) {
        this.$forceUpdate();
        return;
      }

      // 发送请求获取字段
      try {
        const response = await buildClass(dataset.clazz);
        const fields = response;
        // 更新数据集字段
        this.$set(dataset, 'fields', fields);
        this.$forceUpdate();
      } catch (error) {
        if (error.msg) {
          showAlert("服务端错误：" + error.msg);
        } else {
          showAlert(this.$t('tree.loadFieldFail'));
        }
      }
    },

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
