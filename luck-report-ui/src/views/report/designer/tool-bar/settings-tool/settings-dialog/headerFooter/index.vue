<template>
  <div>
    <div class="form-group form-group-hf-desc">
      {{ $t('dialog.setting.hfdesc') }}
    </div>

    <div>
      <label>{{ $t('dialog.setting.header') }}：</label>
      <u-button
          type="text"
          class="btn-hf-setting"
          @click="handleOpenHeaderFontDialog">
        {{ $t('dialog.setting.fontStyleSetting') }}
      </u-button>

      <span class="span-hf-margin">
        <span>{{ $t('dialog.setting.headerMargin') }}：</span>
      </span>
      <div class="u-inline">
        <u-input-number
          v-model="localHeaderMargin"
          @change="handleHeaderMarginChange"
        />
      </div>
    </div>

    <div class="form-group" style="margin-top:10px">
      <label class="label-align-top">{{ $t('dialog.setting.hfLeft') }}：</label>
      <textarea
        ref="leftHeader"
        v-model="localHeader.left"
        class="form-control editor-textarea"
        @change="handleHeaderLeftChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfCenter') }}：</span>
      <textarea
        ref="centerHeader"
        v-model="localHeader.center"
        class="form-control editor-textarea"
        @change="handleHeaderCenterChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfRight') }}：</span>
      <textarea
        ref="rightHeader"
        v-model="localHeader.right"
        class="form-control editor-textarea"
        @change="handleHeaderRightChange"
      ></textarea>
    </div>

    <div class="div-footer-section">
      <label>{{ $t('dialog.setting.footer') }}：</label>
      <u-button
          type="text"
          class="btn-hf-setting"
          @click="handleOpenFooterFontDialog">
        {{ $t('dialog.setting.fontStyleSetting') }}
      </u-button>

      <span class="span-hf-margin">
        <span>{{ $t('dialog.setting.footerMargin') }}：</span>
      </span>
      <div class="u-inline">
        <u-input-number
          v-model="localFooterMargin"
          @change="handleFooterMarginChange"
        />
      </div>
    </div>

    <div class="form-group" style="margin-top:10px">
      <label class="label-align-top">{{ $t('dialog.setting.hfLeft') }}：</label>
      <textarea
        ref="leftFooter"
        v-model="localFooter.left"
        class="form-control editor-textarea"
        @change="handleFooterLeftChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfCenter') }}：</span>
      <textarea
        ref="centerFooter"
        v-model="localFooter.center"
        class="form-control editor-textarea"
        @change="handleFooterCenterChange"
      ></textarea>

      <span class="span-align-top">{{ $t('dialog.setting.hfRight') }}：</span>
      <textarea
        ref="rightFooter"
        v-model="localFooter.right"
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
      localFooter: { ...this.footer },
      localHeaderMargin: pointToMM(this.header.margin),
      localFooterMargin: pointToMM(this.footer.margin)
    };
  },
  watch: {
    header: {
      handler(newVal) {
        this.localHeader = { ...newVal };
        this.localHeaderMargin = pointToMM(newVal.margin);
        this.$nextTick(() => {
          this.setHeaderEditorStyles();
        });
      },
      deep: true
    },
    footer: {
      handler(newVal) {
        this.localFooter = { ...newVal };
        this.localFooterMargin = pointToMM(newVal.margin);
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
    handleHeaderMarginChange() {
      if (!isNaN(this.localHeaderMargin)) {
        this.$emit('update:header', { ...this.localHeader, margin: mmToPoint(this.localHeaderMargin) });
        this.$emit('header-margin-change');
      }
    },
    handleFooterMarginChange() {
      if (!isNaN(this.localFooterMargin)) {
        this.$emit('update:footer', { ...this.localFooter, margin: mmToPoint(this.localFooterMargin) });
        this.$emit('footer-margin-change');
      }
    },
    handleHeaderLeftChange() {
      this.$emit('update:header', { ...this.localHeader });
      this.$emit('header-footer-change');
    },
    handleHeaderCenterChange() {
      this.$emit('update:header', { ...this.localHeader });
      this.$emit('header-footer-change');
    },
    handleHeaderRightChange() {
      this.$emit('update:header', { ...this.localHeader });
      this.$emit('header-footer-change');
    },
    handleFooterLeftChange() {
      this.$emit('update:footer', { ...this.localFooter });
      this.$emit('header-footer-change');
    },
    handleFooterCenterChange() {
      this.$emit('update:footer', { ...this.localFooter });
      this.$emit('header-footer-change');
    },
    handleFooterRightChange() {
      this.$emit('update:footer', { ...this.localFooter });
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
  margin: 0 5px 10px 5px;
  color: #999999;
  font-size: 12px;
}

.editor-textarea {
  font-size: 10pt;
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

textarea:focus {
  outline: none;
  border-color: #00554a;
}
</style>
