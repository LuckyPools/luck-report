<template>
    <div ref="container" id="designer-container">
      <div class="u-designer" >
        <!-- 左侧区域：顶部工具和内容表格 -->
        <div class="left-part">
          <!-- 顶部工具 -->
          <TopToolBar ref="topToolBar" :selectedCells="selectedCells" />
          <!-- 内容表格组件 -->
          <ContentTable
            :reportPath="localReportPath"
            @cell-selected="handleCellSelected"
            @navigate="handleNavigate"
            @save="handleSave"
            @error="handleError"
          />
        </div>
        <!-- 右侧区域：侧边栏 -->
        <div class="right-part">
          <ResourcePanel ref="sidePanel" :selectedCells="selectedCells" />
        </div>
      </div>
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
import TopToolBar from '@/views/report/designer/tool-bar/index.vue';
import ContentTable from '@/views/report/designer/edit-table/index.vue';
import { createNavigator, getLibMode } from '@/lib/navigator';
import { getUrlSearchParams } from '@/utils/url';
import { setLocale } from '@/locales';

export default {
  name: 'DesignerPage',
  components: {
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
      selectedCells: {
        rowIndex: null,
        colIndex: null,
        row2Index: null,
        col2Index: null
      },
      localReportPath: this.reportPath
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
      this.localReportPath = val;
    }
  },
  mounted() {
    this.parseLocaleFromUrl();
  },
  methods: {
    /**
     * 从URL解析lang参数并设置语言
     */
    parseLocaleFromUrl() {
      const searchParams = getUrlSearchParams();
      const lang = searchParams.get('lang');
      if (lang) {
        setLocale(lang);
      }
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
      this.localReportPath = path;
    },

    setLocale(locale) {
      setLocale(locale);
    }
  }
}
</script>

<style scoped>
#designer-container {
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
