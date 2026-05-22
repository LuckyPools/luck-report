<template>
  <div class="condition-style">
    <ColorConfig
      :cell-style="localGroup.cellStyle"
      @color-change="handleColorChange"
    />

    <FontConfig
      :cell-style="localGroup.cellStyle"
      @font-change="handleFontChange"
    />

    <AlignConfig
      :cell-style="localGroup.cellStyle"
      @align-change="handleAlignChange"
    />

    <BorderConfig
      :cell-style="localGroup.cellStyle"
      @border-change="handleBorderChange"
      @border-save="handleBorderSave"
    />

    <ValueConfig
      :cell-style="localGroup.cellStyle"
      :new-value="localGroup.newValue"
      @value-change="handleValueChange"
    />

    <SizeConfig
      :row-height="localGroup.rowHeight"
      :col-width="localGroup.colWidth"
      @size-change="handleSizeChange"
    />

    <PagingConfig
      :paging="localGroup.paging"
      @paging-change="handlePagingChange"
    />

    <LinkConfig
      :link-url="localGroup.linkUrl"
      :link-target-window="localGroup.linkTargetWindow"
      :link-parameters="localGroup.linkParameters"
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
    selectedGroup: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      localGroup: {
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
    selectedGroup: {
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
        this.localGroup = {
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
        const tempGroup = JSON.parse(JSON.stringify(config));

        this.localGroup = {
          cellStyle: tempGroup.cellStyle || {},
          rowHeight: tempGroup.rowHeight !== undefined ? tempGroup.rowHeight : null,
          colWidth: tempGroup.colWidth !== undefined ? tempGroup.colWidth : null,
          newValue: tempGroup.newValue !== undefined ? tempGroup.newValue : null,
          linkUrl: tempGroup.linkUrl !== undefined ? tempGroup.linkUrl : null,
          linkTargetWindow: tempGroup.linkTargetWindow !== undefined ? tempGroup.linkTargetWindow : null,
          linkParameters: tempGroup.linkParameters !== undefined ? tempGroup.linkParameters : null,
          paging: tempGroup.paging !== undefined ? tempGroup.paging : null,
          name: tempGroup.name !== undefined ? tempGroup.name : null,
        };
      }
    },

    handleColorChange({ type, checked, value, scope }) {
      if (!this.localGroup.cellStyle) {
        this.localGroup.cellStyle = {};
      }

      if (type === 'forecolor') {
        this.localGroup.cellStyle.forecolor = value;
        this.localGroup.cellStyle.forecolorScope = scope;
      } else if (type === 'bgcolor') {
        this.localGroup.cellStyle.bgcolor = value;
        this.localGroup.cellStyle.bgcolorScope = scope;
      }

      this.emitPropertyChange();
    },

    handleFontChange({ type, checked, value, scope }) {
      if (!this.localGroup.cellStyle) {
        this.localGroup.cellStyle = {};
      }

      if (type === 'fontFamily') {
        this.localGroup.cellStyle.fontFamily = value;
        this.localGroup.cellStyle.fontFamilyScope = scope;
      } else if (type === 'fontSize') {
        this.localGroup.cellStyle.fontSize = value;
        this.localGroup.cellStyle.fontSizeScope = scope;
      } else if (type === 'bold') {
        this.localGroup.cellStyle.bold = value;
        this.localGroup.cellStyle.boldScope = scope;
      } else if (type === 'italic') {
        this.localGroup.cellStyle.italic = value;
        this.localGroup.cellStyle.italicScope = scope;
      } else if (type === 'underline') {
        this.localGroup.cellStyle.underline = value;
        this.localGroup.cellStyle.underlineScope = scope;
      }

      this.emitPropertyChange();
    },

    handleAlignChange({ type, checked, value, scope }) {
      if (!this.localGroup.cellStyle) {
        this.localGroup.cellStyle = {};
      }

      if (type === 'align') {
        this.localGroup.cellStyle.align = value;
        this.localGroup.cellStyle.alignScope = scope;
      } else if (type === 'valign') {
        this.localGroup.cellStyle.valign = value;
        this.localGroup.cellStyle.valignScope = scope;
      }

      this.emitPropertyChange();
    },

    handleBorderChange({ checked, borders }) {
      if (!this.localGroup.cellStyle) {
        this.localGroup.cellStyle = {};
      }

      this.localGroup.cellStyle.leftBorder = borders.leftBorder;
      this.localGroup.cellStyle.rightBorder = borders.rightBorder;
      this.localGroup.cellStyle.topBorder = borders.topBorder;
      this.localGroup.cellStyle.bottomBorder = borders.bottomBorder;

      this.emitPropertyChange();
    },

    handleBorderSave(borderData) {
      if (this.localGroup.cellStyle) {
        this.localGroup.cellStyle.topBorder = borderData.topBorder;
        this.localGroup.cellStyle.bottomBorder = borderData.bottomBorder;
        this.localGroup.cellStyle.leftBorder = borderData.leftBorder;
        this.localGroup.cellStyle.rightBorder = borderData.rightBorder;
      }
      this.emitPropertyChange();
    },

    handleValueChange({ type, checked, value }) {
      if (type === 'newValue') {
        this.localGroup.newValue = value;
      } else if (type === 'format') {
        if (!this.localGroup.cellStyle) {
          this.localGroup.cellStyle = {};
        }
        this.localGroup.cellStyle.format = value;
      }

      this.emitPropertyChange();
    },

    handleSizeChange({ type, checked, value }) {
      if (type === 'rowHeight') {
        this.localGroup.rowHeight = value;
      } else if (type === 'colWidth') {
        this.localGroup.colWidth = value;
      }

      this.emitPropertyChange();
    },

    handlePagingChange({ checked, paging }) {
      this.localGroup.paging = paging;
      this.emitPropertyChange();
    },

    handleLinkChange({ checked, linkUrl, linkTargetWindow, linkParameters }) {
      this.localGroup.linkUrl = linkUrl;
      this.localGroup.linkTargetWindow = linkTargetWindow;
      this.localGroup.linkParameters = linkParameters;
      this.emitPropertyChange();
    },

    emitPropertyChange() {
      this.$nextTick(() => {
        this.$emit('property-changed', this.localGroup);
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
