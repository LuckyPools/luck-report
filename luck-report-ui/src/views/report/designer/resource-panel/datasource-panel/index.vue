<template>
  <div style="width:100%;">
    <!-- 工具栏 -->
    <div class="ds-toolbar">
      <u-button
        type="info"
        class="toolbar-btn"
        icon="icon-database"
        :title="$t('property.datasource.title')"
        @click="showDatasourceDialog"
      >
      </u-button>

      <u-button
        type="info"
        class="toolbar-btn"
        icon="icon-leaf"
        :title="$t('property.datasource.addBean')"
        @click="showSpringDialog"
      >
      </u-button>

      <u-button
        type="info"
        class="toolbar-btn"
        icon="icon-share"
        :title="$t('property.datasource.addBuildin')"
        @click="showBuildinDialog"
      >
      </u-button>
    </div>

    <!-- 树容器 -->
    <div ref="treeContainer">
      <!-- 数据库树组件 -->
      <DatabaseTree
        v-for="(datasource, index) in jdbcDatasources"
        :key="'jdbc_' + '_' + index"
        :datasources="datasources"
        :datasource="datasource"
        ref="databaseTree"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
      />

      <!-- Spring树组件 -->
      <SpringTree
        v-for="(datasource, index) in springDatasources"
        :key="'spring_' + '_' + index"
        :name="datasource.name"
        :datasets="datasource.datasets || []"
        :datasources="datasources"
        :bean-id="datasource.beanId"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
        @update-datasets="updateSpringDatasets(datasource, $event)"
      />

      <!-- 内置数据源树组件 -->
      <BuildinTree
        v-for="(datasource, index) in buildinDatasources"
        :key="'buildin_' + '_' + index"
        :name="datasource.name"
        :datasets="datasource.datasets || []"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
      />
    </div>

    <!-- 数据源对话框 -->
    <DatasourceDialog
      ref="datasourceDialog"
      :datasources="datasources"
      :visible="datasourceDialogVisible"
      :datasource="currentDatasource"
      @close="datasourceDialogVisible = false"
      @save="addJdbcDatasource"
    />

    <!-- Spring对话框 -->
    <SpringDialog
      ref="springDialog"
      :datasources="datasources"
      :visible="springDialogVisible"
      :datasource="currentSpringDatasource"
      @close="springDialogVisible = false"
      @save="addSpringDatasource"
    />

    <!-- 内置数据源选择对话框 -->
    <BuildinDatasourceSelectDialog
      ref="buildinDialog"
      :datasources="datasources"
      :visible="buildinDialogVisible"
      @close="buildinDialogVisible = false"
      @select="addBuildinDatasource"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import DatabaseTree from './database-tree/index.vue';
import SpringTree from './spring-tree/index.vue';
import BuildinTree from './buildin-tree/index.vue';
import DatasourceDialog from './datasource-dialog/index.vue';
import SpringDialog from './spring-dialog/index.vue';
import BuildinDatasourceSelectDialog from './buildin-datasource-select-dialog/index.vue';
import UButton from "@/components/button/index.vue";
import {deepCopy} from "@/components/utils";
import { updateReportDef } from '@/utils/contextActions.js';

export default {
  name: 'DatasourcePanel',
  components: {
    UButton,
    DatabaseTree,
    SpringTree,
    BuildinTree,
    DatasourceDialog,
    SpringDialog,
    BuildinDatasourceSelectDialog
  },

  data() {
    return {
      datasources: [],
      buildinDialogVisible: false,
      datasourceDialogVisible: false,
      currentDatasource: null,
      springDialogVisible: false,
      currentSpringDatasource: null
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext || {};
    },
    // 分离不同类型的数据源以便渲染
    jdbcDatasources() {
      return this.datasources.filter(item => item.type === 'jdbc');
    },
    springDatasources() {
      return this.datasources.filter(item => item.type === 'spring');
    },
    buildinDatasources() {
      return this.datasources.filter(item => item.type === 'buildin');
    },

  },
  watch: {
    context: {
      handler(newContext) {
        if (newContext && newContext.reportDef) {
          this.initializeDatasources();
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 初始化数据源
     */
    initializeDatasources() {
      const context = this.context;
      if (!context) return;

      const reportDef = context.reportDef;
      if (!reportDef) return;

      if (!reportDef.datasources) {
        const newReportDef = deepCopy(reportDef);
        newReportDef.datasources = [];
        updateReportDef(newReportDef);
      }

      this.datasources = reportDef.datasources || [];
    },

    /**
     * 显示数据源对话框
     */
    showDatasourceDialog() {
      this.currentDatasource = null;
      this.datasourceDialogVisible = true;
    },

    /**
     * 显示Spring对话框
     */
    showSpringDialog() {
      this.currentSpringDatasource = null;
      this.springDialogVisible = true;
    },

    /**
     * 显示内置数据源对话框
     */
    showBuildinDialog() {
      this.buildinDialogVisible = true;
    },

    /**
     * 添加JDBC数据源
     */
    addJdbcDatasource(datasource) {
      const newDatasource = {
        name: datasource.name,
        username: datasource.username,
        password: datasource.password,
        type: datasource.type || 'jdbc',
        url: datasource.url,
        driver: datasource.driver,
        datasets: datasource.datasets || []
      };

      const newIndex = this.datasources.length;
      this.$set(this.datasources, newIndex, newDatasource);

      const reportDef = { ...this.context.reportDef, datasources: this.datasources };
      updateReportDef(reportDef);
    },

    /**
     * 添加Spring数据源
     */
    addSpringDatasource(datasource) {
      // 确保数据源对象有正确的属性
      const newDatasource = {
        name: datasource.name,
        beanId: datasource.beanId,
        type: datasource.type || 'spring',
        datasets: datasource.datasets || []
      };

      const newIndex = this.datasources.length;
      this.$set(this.datasources, newIndex, newDatasource);

      const reportDef = { ...this.context.reportDef, datasources: this.datasources };
      updateReportDef(reportDef);
    },

    /**
     * 添加内置数据源
     */
    addBuildinDatasource(datasource) {
      // 确保数据源对象有正确的属性
      const newDatasource = {
        name: datasource.name,
        type: datasource.type || 'buildin',
        datasets: datasource.datasets || []
      };

      const newIndex = this.datasources.length;
      this.$set(this.datasources, newIndex, newDatasource);

      const reportDef = { ...this.context.reportDef, datasources: this.datasources };
      updateReportDef(reportDef);
    },

    /**
     * 移除数据源
     */
    removeDatasource(name) {
      const index = this.datasources.findIndex(d => d.name === name);
      if (index !== -1) {
        this.datasources.splice(index, 1);

        const reportDef = { ...this.context.reportDef, datasources: this.datasources };
        updateReportDef(reportDef);
      }
    },

    /**
     * 更新数据源
     */
    updateDatasource(data) {
      // 查找并更新匹配的数据源
      const index = this.datasources.findIndex(item => item.name === data.oldName);
      if (index !== -1) {
        this.$set(this.datasources, index, { ...this.datasources[index], ...data });
      }

      const reportDef = { ...this.context.reportDef, datasources: this.datasources };
      updateReportDef(reportDef);
    },

    /**
     * 更新 Spring 数据源的数据集
     */
    updateSpringDatasets(datasource, datasets) {
      // 更新数据源的数据集
      datasource.datasets = datasets;
      const reportDef = { ...this.context.reportDef, datasources: this.datasources };
      updateReportDef(reportDef);
    },

    /**
     * 构建面板（兼容旧接口）
     */
    buildPanel() {
      return [{
        appendChild: (el) => {
          if (this.$refs.treeContainer) {
            this.$refs.treeContainer.appendChild(el);
          }
        }
      }];
    }
  }
};
</script>

<style scoped>
.ds-toolbar {
  background: rgb(248, 248, 248);
  line-height: 40px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
}

.toolbar-btn{
  border: none;
  background: #f8f8f8;
}
</style>
