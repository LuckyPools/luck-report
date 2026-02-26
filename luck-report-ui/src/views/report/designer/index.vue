<template>
    <div ref="container" id='container'>
      <div class="u-designer" >
        <!-- 左侧区域：顶部工具和内容表格 -->
        <div class="left-part">
          <!-- 顶部工具 -->
          <TopToolBar v-if="contextCreated" ref="topToolBar" />
          <!-- 内容表格组件 -->
          <ContentTable
            @cell-selected="handleCellSelected"
            @context-created="handleContextCreated"
          />
        </div>
        <!-- 右侧区域：侧边栏 -->
        <div class="right-part">
          <ResourcePanel v-if="contextCreated" ref="sidePanel" />
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

export default {
  name: 'DesignerPage',
  components: {
    PrintLine,
    TopToolBar,
    ResourcePanel,
    ContentTable
  },
  data() {
    return {
      contextCreated: false
    };
  },
  methods: {

    /**
     * 处理context创建事件
     */
    handleContextCreated() {
      this.contextCreated = true;
    },

    /**
     * 处理单元格选择事件
     */
    handleCellSelected({rowIndex, colIndex, row2Index, col2Index}) {
      // 调用SidePanel组件的refreshPropertyPanel方法
      if (this.$refs.sidePanel) {
        this.$refs.sidePanel.refreshPropertyPanel(rowIndex, colIndex, row2Index, col2Index);
      }
      // 调用TopToolBar组件的refreshTools方法
      if (this.$refs.topToolBar) {
        this.$refs.topToolBar.refreshTools(rowIndex, colIndex, row2Index, col2Index);
      }
    },


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
