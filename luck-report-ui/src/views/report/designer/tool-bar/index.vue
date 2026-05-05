<template>
  <div class="ud-toolbar" :style="toolbarStyle" ref="toolbar">
    <div class="ud-toolbar-title">
      <div class="file-info">
        {{ fileName }}
      </div>
      <PreviewTool ref="previewTool" />
      <PreviewPageTool ref="previewPageTool" />
      <SaveTool ref="saveTool" />
      <SaveAsTool ref="saveAsTool" />
      <OpenTool ref="openTool" />
      <ImportTool ref="importTool" />
      <UndoTool ref="undoTool" />
      <RedoTool ref="redoTool" />
      <SearchFormSwitchTool ref="searchFormSwitchTool" />
      <SettingsTool ref="settingsTool" />
    </div>
    <div class="ud-toolbar-content">
      <div class="toolbar-box">
        <MergeTool ref="mergeTool" :selectedCells="selectedCells" />
        <AlignLeftTool ref="alignLeftTool" :selectedCells="selectedCells" />
        <AlignTopTool ref="alignTool" :selectedCells="selectedCells" />
        <BorderTool ref="borderTool" :selectedCells="selectedCells" />
        <FontFamilyTool ref="fontFamilyTool" :selectedCells="selectedCells" />
        <FontSizeTool ref="fontSizeTool" :selectedCells="selectedCells" />
        <BoldTool ref="boldTool" :selectedCells="selectedCells" />
        <ItalicTool ref="italicTool" :selectedCells="selectedCells" />
        <UnderlineTool ref="underlineTool" :selectedCells="selectedCells" />
        <FontColorTool ref="fontColorTool" :selectedCells="selectedCells" />
        <BgColorTool ref="bgColorTool" :selectedCells="selectedCells" />
        <CrosstabTool ref="crosstabTool" :selectedCells="selectedCells" />
        <ImageTool ref="imageTool" :selectedCells="selectedCells" />
        <ChartTool ref="chartTool" :selectedCells="selectedCells" />
        <ZxingTool ref="zxingTool" :selectedCells="selectedCells" />
      </div>
    </div>
  </div>
</template>

<script>
import ImportTool from '@/views/report/designer/tool-bar/import-tool/index.vue';
import SaveTool from '@/views/report/designer/tool-bar/save-tool/index.vue';
import SaveAsTool from '@/views/report/designer/tool-bar/save-as-tool/index.vue';
import PreviewTool from '@/views/report/designer/tool-bar/preview-tool/index.vue';
import PreviewPageTool from '@/views/report/designer/tool-bar/preview-page-tool/index.vue';
import OpenTool from '@/views/report/designer/tool-bar/open-tool/index.vue';
import UndoTool from '@/views/report/designer/tool-bar/undo-tool/index.vue';
import RedoTool from '@/views/report/designer/tool-bar/redo-tool/index.vue';
import AlignLeftTool from '@/views/report/designer/tool-bar/align-left-tool/index.vue';
import AlignTopTool from '@/views/report/designer/tool-bar/align-tool/index.vue';
import MergeTool from '@/views/report/designer/tool-bar/merge-tool/index.vue';
import FontFamilyTool from '@/views/report/designer/tool-bar/font-family-tool/index.vue';
import FontSizeTool from '@/views/report/designer/tool-bar/font-size-tool/index.vue';
import BoldTool from '@/views/report/designer/tool-bar/bold-tool/index.vue';
import ItalicTool from '@/views/report/designer/tool-bar/italic-tool/index.vue';
import UnderlineTool from '@/views/report/designer/tool-bar/underline-tool/index.vue';
import BgColorTool from '@/views/report/designer/tool-bar/bg-color-tool/index.vue';
import FontColorTool from '@/views/report/designer/tool-bar/font-color-tool/index.vue';
import CrosstabTool from '@/views/report/designer/tool-bar/crosstab-tool/index.vue';
import ImageTool from '@/views/report/designer/tool-bar/image-tool/index.vue';
import ChartTool from '@/views/report/designer/tool-bar/chart-tool/index.vue';
import ZxingTool from '@/views/report/designer/tool-bar/zxing-tool/index.vue';
import SearchFormSwitchTool from '@/views/report/designer/tool-bar/search-form-switch-tool/index.vue';
import SettingsTool from '@/views/report/designer/tool-bar/settings-tool/index.vue';
import BorderTool from "@/views/report/designer/tool-bar/border-tool/index.vue";

export default {
  name: 'TopToolBar',
  components: {
    BorderTool,
    ImportTool,
    SaveTool,
    SaveAsTool,
    PreviewTool,
    PreviewPageTool,
    OpenTool,
    UndoTool,
    RedoTool,
    AlignLeftTool,
    AlignTopTool,
    MergeTool,
    FontFamilyTool,
    FontSizeTool,
    BoldTool,
    ItalicTool,
    UnderlineTool,
    FontColorTool,
    BgColorTool,
    CrosstabTool,
    ImageTool,
    ChartTool,
    ZxingTool,
    SearchFormSwitchTool,
    SettingsTool
  },
  props: {
    selectedCells: {
      type: Object,
      default: () => ({
        rowIndex: null,
        colIndex: null,
        row2Index: null,
        col2Index: null
      })
    }
  },
  computed: {
    /**
     * 获取context
     */
    context: function() {
      return this.$store.getters['report/getContext'] || {}
    },

    /**
     * 获取fileName
     */
    fileName: function() {
      const fileName = this.$store.getters['report/getFileName']
      if(fileName){
        return decodeURIComponent(fileName);
      }else{
        return 'Blank';
      }
    }
  },
  data() {
    return {
      toolbarStyle: {
        position: 'relative',
      }
    };
  },
  methods: {
  }
};
</script>

<style scoped>
.ud-toolbar{
  width: 100%;
}

.tool-btn-group{
  display: inline-block;
}

.ud-toolbar-title{
  width: 100%;
  height: 50px;
  background-color: #00554a;
  color: white;
}

.ud-toolbar-content{
  background-color: #f3f5f7;
}

.toolbar-box{
  background-color: white;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
}

.file-info{
  position: absolute;
  text-align: center;
  width: 100%;
  line-height: 50px;
  font-size: 14px;
}

.tool-button{
  font-size: 16px;
  margin: 7px 0;
}

.tool-button:hover {
  background-color: rgb(0 119 103 / 70%) !important
}

.info-button{
  font-size: 16px;
  margin: 2px 0;
  border: none;
}

</style>
