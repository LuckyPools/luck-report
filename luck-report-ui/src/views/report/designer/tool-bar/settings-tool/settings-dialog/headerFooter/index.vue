<template>
  <div>
    <div class="form-group form-group-hf-desc">
      {{ $t('dialog.setting.hfdesc') }}
    </div>

    <div>
      <label>{{ $t('dialog.setting.header') }}：</label>
      <u-button
          class="btn-hf-setting"
          @click="handleOpenHeaderFontDialog">
        {{ $t('dialog.setting.fontStyleSetting') }}
      </u-button>

      <span class="span-hf-margin">
        <span>{{ $t('dialog.setting.headerMargin') }}：</span>
      </span>
      <div class="u-inline">
        <u-input-number
          :value="headerMargin"
          @change="handleHeaderMarginChange"
        />
      </div>
    </div>

    <div class="form-group" style="margin-top:10px">
      <label class="label-align-top">{{ $t('dialog.setting.hfLeft') }}：</label>
      <textarea
        ref="leftHeader"
        :value="localHeader.left"
        class="form-control editor-textarea"
        @change="handleHeaderLeftChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfCenter') }}：</span>
      <textarea
        ref="centerHeader"
        :value="localHeader.center"
        class="form-control editor-textarea"
        @change="handleHeaderCenterChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfRight') }}：</span>
      <textarea
        ref="rightHeader"
        :value="localHeader.right"
        class="form-control editor-textarea"
        @change="handleHeaderRightChange"
      ></textarea>
    </div>

    <div class="div-footer-section">
      <label>{{ $t('dialog.setting.footer') }}：</label>
      <u-button
          class="btn-hf-setting"
          @click="handleOpenFooterFontDialog">
        {{ $t('dialog.setting.fontStyleSetting') }}
      </u-button>

      <span class="span-hf-margin">
        <span>{{ $t('dialog.setting.footerMargin') }}：</span>
      </span>
      <div class="u-inline">
        <u-input-number
          :value="footerMargin"
          @change="handleFooterMarginChange"
        />
      </div>
    </div>

    <div class="form-group" style="margin-top:10px">
      <label class="label-align-top">{{ $t('dialog.setting.hfLeft') }}：</label>
      <textarea
        ref="leftFooter"
        :value="localFooter.left"
        class="form-control editor-textarea"
        @change="handleFooterLeftChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfCenter') }}：</span>
      <textarea
        ref="centerFooter"
        :value="localFooter.center"
        class="form-control editor-textarea"
        @change="handleFooterCenterChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfRight') }}：</span>
      <textarea
        ref="rightFooter"
        :value="localFooter.right"
        class="form-control editor-textarea"
        @change="handleFooterRightChange"
      ></textarea>
    </div>
  </div>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table.js';
import UButton from "@/components/button/index.vue";
import UInputNumber from "@/components/input-number/index.vue";

export default {
  name: 'HeaderFooterSettings',
  components: {
    UButton,
    UInputNumber
  },
  props: {
    header: {
      type: Object,
      required: true
    },
    footer: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localHeader: { ...this.header },
      localFooter: { ...this.footer }
    };
  },
  computed: {
    headerMargin() {
      return pointToMM(this.localHeader.margin);
    },
    footerMargin() {
      return pointToMM(this.localFooter.margin);
    }
  },
  watch: {
    header: {
      handler(newVal) {
        this.localHeader = { ...newVal };
        this.$nextTick(() => {
          this.setHeaderEditorStyles();
        });
      },
      deep: true
    },
    footer: {
      handler(newVal) {
        this.localFooter = { ...newVal };
        this.$nextTick(() => {
          this.setFooterEditorStyles();
        });
      },
      deep: true
    }
  },
  mounted() {
    this.setHeaderEditorStyles();
    this.setFooterEditorStyles();
  },
  methods: {
    handleOpenHeaderFontDialog() {
      this.$emit('open-header-font-dialog');
    },
    handleOpenFooterFontDialog() {
      this.$emit('open-footer-font-dialog');
    },
    handleHeaderMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:header', { ...this.localHeader, margin: mmToPoint(value) });
        this.$emit('header-margin-change');
      }
    },
    handleFooterMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:footer', { ...this.localFooter, margin: mmToPoint(value) });
        this.$emit('footer-margin-change');
      }
    },
    handleHeaderLeftChange(event) {
      this.$emit('update:header', { ...this.localHeader, left: event.target.value });
      this.$emit('header-footer-change');
    },
    handleHeaderCenterChange(event) {
      this.$emit('update:header', { ...this.localHeader, center: event.target.value });
      this.$emit('header-footer-change');
    },
    handleHeaderRightChange(event) {
      this.$emit('update:header', { ...this.localHeader, right: event.target.value });
      this.$emit('header-footer-change');
    },
    handleFooterLeftChange(event) {
      this.$emit('update:footer', { ...this.localFooter, left: event.target.value });
      this.$emit('header-footer-change');
    },
    handleFooterCenterChange(event) {
      this.$emit('update:footer', { ...this.localFooter, center: event.target.value });
      this.$emit('header-footer-change');
    },
    handleFooterRightChange(event) {
      this.$emit('update:footer', { ...this.localFooter, right: event.target.value });
      this.$emit('header-footer-change');
    },
    setHeaderEditorStyles() {
      const headerEditors = [
        this.$refs.leftHeader,
        this.$refs.centerHeader,
        this.$refs.rightHeader
      ];

      headerEditors.forEach(editor => {
        if (editor) {
          this.applyEditorStyle(editor, this.localHeader);
        }
      });
    },
    setFooterEditorStyles() {
      const footerEditors = [
        this.$refs.leftFooter,
        this.$refs.centerFooter,
        this.$refs.rightFooter
      ];

      footerEditors.forEach(editor => {
        if (editor) {
          this.applyEditorStyle(editor, this.localFooter);
        }
      });
    },
    applyEditorStyle(editor, style) {
      editor.style.fontFamily = style.fontFamily;
      editor.style.fontSize = style.fontSize + 'pt';
      editor.style.color = `rgb(${style.forecolor})`;
      editor.style.fontWeight = style.bold && style.bold !== 'false' ? 'bold' : 'normal';
      editor.style.fontStyle = style.italic && style.italic !== 'false' ? 'italic' : 'normal';
      editor.style.textDecoration = style.underline && style.underline !== 'false' ? 'underline' : 'none';
    }
  }
};
</script>

<style scoped>
.form-group-hf-desc {
  margin-top: 12px;
  color: #999999;
  font-size: 12px;
}

.editor-textarea {
  font-size: 10pt;
  font-family: '宋体';
  padding: 5px;
  display: inline-block;
  width: 140px;
  height: 80px;
}

.label-align-top {
  vertical-align: top;
}

.span-align-top {
  margin-left: 15px;
  vertical-align: top;
}

.span-hf-margin {
  margin-left: 10px;
}

.btn-hf-setting {
  margin-left: 10px;
}

.div-footer-section {
  margin-top: 10px;
}
</style>
