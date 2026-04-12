<template>
    <div ref="container" id='container'>
      <div class="u-designer" >
        <!-- 左侧区域：顶部工具和内容表格 -->
        <div class="left-part">
          <!-- 顶部工具 -->
          <TopToolBar v-if="contextCreated" ref="topToolBar" :selectedCells="selectedCells" />
          <!-- 内容表格组件 -->
          <ContentTable
            :reportPath="internalReportPath"
            @cell-selected="handleCellSelected"
            @context-created="handleContextCreated"
            @navigate="handleNavigate"
            @save="handleSave"
            @error="handleError"
          />
        </div>
        <!-- 右侧区域：侧边栏 -->
        <div class="right-part">
          <ResourcePanel v-if="contextCreated" ref="sidePanel" :selectedCells="selectedCells" />
        </div>
      </div>
      <!-- 打印线 -->
      <PrintLine v-if="false" ref="printLine" />

    </div>
</template>

<script>
import 'handsontable/dist/handsontable.min.css'
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/lint/lint.css';
import '../../../assets/css/designer/tree.css';

import 'codemirror/mode/javascript/javascript.js';

import ResourcePanel from '@/views/report/designer/resource-panel/index.vue';
import PrintLine from './print-line/index.vue';
import TopToolBar from '@/views/report/designer/tool-bar/index.vue';
import ContentTable from '@/views/report/designer/edit-table/index.vue';
import { createNavigator, getLibMode } from '@/lib/navigator';

export default {
  name: 'DesignerPage',
  components: {
    PrintLine,
    TopToolBar,
    ResourcePanel,
    ContentTable
  },
  props: {
    reportPath: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      contextCreated: false,
      selectedCells: {
        rowIndex: null,
        colIndex: null,
        row2Index: null,
        col2Index: null
      },
      internalReportPath: this.reportPath
    };
  },
  computed: {
    navigator() {
      return createNavigator(this);
    },
    isLibMode() {
      return getLibMode();
    }
  },
  watch: {
    reportPath(val) {
      this.internalReportPath = val;
    }
  },
  methods: {
    handleContextCreated() {
      this.contextCreated = true;
    },

    handleCellSelected({rowIndex, colIndex, row2Index, col2Index}) {
      this.selectedCells = {
        rowIndex,
        colIndex,
        row2Index,
        col2Index
      };
    },

    handleNavigate(data) {
      this.$emit('navigate', data);
    },

    handleSave(data) {
      this.$emit('save', data);
    },

    handleError(err) {
      this.$emit('error', err);
    },

    getReportData() {
      return this.$refs.contentTable?.getReportData?.();
    },

    saveReport() {
      return this.$refs.contentTable?.saveReport?.();
    },

    navigateTo(target, params, openInNewTab = true) {
      this.navigator.navigate({ target, params, openInNewTab });
    },

    setReportPath(path) {
      this.internalReportPath = path;
    },

    setLocale(locale) {
      this.$i18n.locale = locale;
    }
  }
}
</script>

<style scoped>
#container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.u-designer{
  height: 100%;
  display: flex;
  flex-direction: row;
}

.left-part {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-part {
  width: 400px;
  overflow: hidden;
}
</style>
