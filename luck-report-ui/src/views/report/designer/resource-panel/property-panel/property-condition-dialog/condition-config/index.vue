<template>
  <div class="condition-style">
    <ColorConfig
      :cell-style="localItem.cellStyle"
      @color-change="handleColorChange"
    />

    <FontConfig
      :cell-style="localItem.cellStyle"
      @font-change="handleFontChange"
    />

    <AlignConfig
      :cell-style="localItem.cellStyle"
      @align-change="handleAlignChange"
    />

    <BorderConfig
      :cell-style="localItem.cellStyle"
      @border-change="handleBorderChange"
      @border-save="handleBorderSave"
    />

    <ValueConfig
      :cell-style="localItem.cellStyle"
      :new-value="localItem.newValue"
      @value-change="handleValueChange"
    />

    <SizeConfig
      :row-height="localItem.rowHeight"
      :col-width="localItem.colWidth"
      @size-change="handleSizeChange"
    />

    <PagingConfig
      :paging="localItem.paging"
      @paging-change="handlePagingChange"
    />

    <LinkConfig
      :link-url="localItem.linkUrl"
      :link-target-window="localItem.linkTargetWindow"
      :link-parameters="localItem.linkParameters"
      @link-change="handleLinkChange"
    />
  </div>
</template>

<script>
import ColorConfig from './color-config/index.vue';
import FontConfig from './font-config/index.vue';
import AlignConfig from './align-config/index.vue';
import BorderConfig from './border-config/index.vue';
import ValueConfig from './value-config/index.vue';
import SizeConfig from './size-config/index.vue';
import PagingConfig from './paging-config/index.vue';
import LinkConfig from './link-config/index.vue';

export default {
  name: 'ConditionConfig',
  components: {
    ColorConfig,
    FontConfig,
    AlignConfig,
    BorderConfig,
    ValueConfig,
    SizeConfig,
    PagingConfig,
    LinkConfig
  },
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      localItem: {
        cellStyle: null,
        rowHeight: null,
        colWidth: null,
        newValue: null,
        linkUrl: null,
        linkTargetWindow: null,
        linkParameters: null,
        paging: null,
        name: null
      }
    };
  },
  watch: {
    item: {
      handler(newVal) {
        this.updateConfig(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    updateConfig(config) {
      if (!config) {
        this.localItem = {
          cellStyle: {},
          rowHeight: null,
          colWidth: null,
          newValue: null,
          linkUrl: null,
          linkTargetWindow: null,
          linkParameters: null,
          paging: null,
          name: null
        };
      } else {
        const tempItem = JSON.parse(JSON.stringify(config));

        this.localItem = {
          cellStyle: tempItem.cellStyle || {},
          rowHeight: tempItem.rowHeight !== undefined ? tempItem.rowHeight : null,
          colWidth: tempItem.colWidth !== undefined ? tempItem.colWidth : null,
          newValue: tempItem.newValue !== undefined ? tempItem.newValue : null,
          linkUrl: tempItem.linkUrl !== undefined ? tempItem.linkUrl : null,
          linkTargetWindow: tempItem.linkTargetWindow !== undefined ? tempItem.linkTargetWindow : null,
          linkParameters: tempItem.linkParameters !== undefined ? tempItem.linkParameters : null,
          paging: tempItem.paging !== undefined ? tempItem.paging : null,
          name: tempItem.name !== undefined ? tempItem.name : null,
        };
      }
    },

    handleColorChange({ type, checked, value, scope }) {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (type === 'forecolor') {
        this.localItem.cellStyle.forecolor = value;
        this.localItem.cellStyle.forecolorScope = scope;
      } else if (type === 'bgcolor') {
        this.localItem.cellStyle.bgcolor = value;
        this.localItem.cellStyle.bgcolorScope = scope;
      }

      this.emitPropertyChange();
    },

    handleFontChange({ type, checked, value, scope }) {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (type === 'fontFamily') {
        this.localItem.cellStyle.fontFamily = value;
        this.localItem.cellStyle.fontFamilyScope = scope;
      } else if (type === 'fontSize') {
        this.localItem.cellStyle.fontSize = value;
        this.localItem.cellStyle.fontSizeScope = scope;
      } else if (type === 'bold') {
        this.localItem.cellStyle.bold = value;
        this.localItem.cellStyle.boldScope = scope;
      } else if (type === 'italic') {
        this.localItem.cellStyle.italic = value;
        this.localItem.cellStyle.italicScope = scope;
      } else if (type === 'underline') {
        this.localItem.cellStyle.underline = value;
        this.localItem.cellStyle.underlineScope = scope;
      }

      this.emitPropertyChange();
    },

    handleAlignChange({ type, checked, value, scope }) {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (type === 'align') {
        this.localItem.cellStyle.align = value;
        this.localItem.cellStyle.alignScope = scope;
      } else if (type === 'valign') {
        this.localItem.cellStyle.valign = value;
        this.localItem.cellStyle.valignScope = scope;
      }

      this.emitPropertyChange();
    },

    handleBorderChange({ checked, borders }) {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.leftBorder = borders.leftBorder;
      this.localItem.cellStyle.rightBorder = borders.rightBorder;
      this.localItem.cellStyle.topBorder = borders.topBorder;
      this.localItem.cellStyle.bottomBorder = borders.bottomBorder;

      this.emitPropertyChange();
    },

    handleBorderSave(borderData) {
      if (this.localItem.cellStyle) {
        this.localItem.cellStyle.topBorder = borderData.topBorder;
        this.localItem.cellStyle.bottomBorder = borderData.bottomBorder;
        this.localItem.cellStyle.leftBorder = borderData.leftBorder;
        this.localItem.cellStyle.rightBorder = borderData.rightBorder;
      }
      this.emitPropertyChange();
    },

    handleValueChange({ type, checked, value }) {
      if (type === 'newValue') {
        this.localItem.newValue = value;
      } else if (type === 'format') {
        if (!this.localItem.cellStyle) {
          this.localItem.cellStyle = {};
        }
        this.localItem.cellStyle.format = value;
      }

      this.emitPropertyChange();
    },

    handleSizeChange({ type, checked, value }) {
      if (type === 'rowHeight') {
        this.localItem.rowHeight = value;
      } else if (type === 'colWidth') {
        this.localItem.colWidth = value;
      }

      this.emitPropertyChange();
    },

    handlePagingChange({ checked, paging }) {
      this.localItem.paging = paging;
      this.emitPropertyChange();
    },

    handleLinkChange({ checked, linkUrl, linkTargetWindow, linkParameters }) {
      this.localItem.linkUrl = linkUrl;
      this.localItem.linkTargetWindow = linkTargetWindow;
      this.localItem.linkParameters = linkParameters;
      this.emitPropertyChange();
    },

    emitPropertyChange() {
      this.$nextTick(() => {
        this.$emit('property-changed', this.localItem);
      });
    }
  }
};
</script>
<style scoped>
.condition-style{
  height: 446px;
  overflow-y: scroll;
}
</style>
