<template>
  <div class="ud-toolbar" :style="toolbarStyle" ref="toolbar">
    <div class="ud-toolbar-title">
      <div class="file-info">
        {{ fileName }}
      </div>
      <PreviewTool :context="context" ref="previewTool" />
      <PreviewPageTool :context="context" ref="previewPageTool" />
      <SaveTool :context="context" ref="saveTool" />
      <SaveAsTool :context="context" ref="saveAsTool" />
      <OpenTool :context="context" ref="openTool" />
      <ImportTool :context="context" ref="importTool" />
      <UndoTool :context="context" ref="undoTool" />
      <RedoTool :context="context" ref="redoTool" />
      <SearchFormSwitchTool :context="context" ref="searchFormSwitchTool" />
      <SettingsTool :context="context" ref="settingsTool" />
    </div>
    <div class="ud-toolbar-content">
      <div class="toolbar-box">
        <MergeTool :context="context" ref="mergeTool" />
        <AlignLeftTool :context="context" ref="alignLeftTool" />
        <AlignTopTool :context="context" ref="alignTool" />
        <BorderTool :context="context" />
        <FontFamilyTool :context="context" ref="fontFamilyTool" />
        <FontSizeTool :context="context" ref="fontSizeTool" />
        <BoldTool :context="context" ref="boldTool" />
        <ItalicTool :context="context" ref="italicTool" />
        <UnderlineTool :context="context" ref="underlineTool" />
        <ForecolorTool :context="context" ref="forecolorTool" />
        <BgcolorTool :context="context" ref="bgcolorTool" />
        <CrosstabTool :context="context" ref="crosstabTool" />
        <ImageTool :context="context" ref="imageTool" />
        <ChartTool :context="context" ref="chartTool" />
        <ZxingTool :context="context" ref="zxingTool" />
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
import BgcolorTool from '@/views/report/designer/tool-bar/bgcolor-tool/index.vue';
import ForecolorTool from '@/views/report/designer/tool-bar/forecolor-tool/index.vue';
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
    ForecolorTool,
    BgcolorTool,
    CrosstabTool,
    ImageTool,
    ChartTool,
    ZxingTool,
    SearchFormSwitchTool,
    SettingsTool
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

    /**
     * 刷新工具状态
     */
    refreshTools(rowIndex, colIndex, row2Index, col2Index) {
      if (this.$refs.boldTool && this.$refs.boldTool.refresh) {
        this.$refs.boldTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.italicTool && this.$refs.italicTool.refresh) {
        this.$refs.italicTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.underlineTool && this.$refs.underlineTool.refresh) {
        this.$refs.underlineTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.alignLeftTool && this.$refs.alignLeftTool.refresh) {
        this.$refs.alignLeftTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.alignTool && this.$refs.alignTool.refresh) {
        this.$refs.alignTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.fontFamilyTool && this.$refs.fontFamilyTool.refresh) {
        this.$refs.fontFamilyTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.fontSizeTool && this.$refs.fontSizeTool.refresh) {
        this.$refs.fontSizeTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.forecolorTool && this.$refs.forecolorTool.refresh) {
        this.$refs.forecolorTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.bgcolorTool && this.$refs.bgcolorTool.refresh) {
        this.$refs.bgcolorTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.crosstabTool && this.$refs.crosstabTool.refresh) {
        this.$refs.crosstabTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
      if (this.$refs.chartTool && this.$refs.chartTool.refresh) {
        this.$refs.chartTool.refresh(rowIndex, colIndex, row2Index, col2Index);
      }
    }
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
