<template>
  <u-form :label-width="50" label-position="left">
    <div class="form-desc">{{ $t('dialog.setting.hfdesc') }}</div>

    <u-row>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.header')">
          <u-button
            type="text"
            @click="handleOpenHeaderFontDialog">
            {{ $t('dialog.setting.fontStyleSetting') }}
          </u-button>
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.headerMargin')" :label-width="140">
          <u-input-number
            v-model="localHeaderMargin"
            @change="handleHeaderMarginChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfLeft')" style="align-items: flex-start;">
          <textarea
            ref="leftHeader"
            v-model="localHeader.left"
            class="form-control editor-textarea"
            @change="handleHeaderLeftChange"
          ></textarea>
        </u-form-item>
      </u-col>
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfCenter')" style="align-items: flex-start;">
          <textarea
            ref="centerHeader"
            v-model="localHeader.center"
            class="form-control editor-textarea"
            @change="handleHeaderCenterChange"
          ></textarea>
        </u-form-item>
      </u-col>
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfRight')" style="align-items: flex-start;">
          <textarea
            ref="rightHeader"
            v-model="localHeader.right"
            class="form-control editor-textarea"
            @change="handleHeaderRightChange"
          ></textarea>
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 10px;">
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.footer')">
          <u-button
            type="text"
            @click="handleOpenFooterFontDialog">
            {{ $t('dialog.setting.fontStyleSetting') }}
          </u-button>
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.footerMargin')" :label-width="140">
          <u-input-number
            v-model="localFooterMargin"
            @change="handleFooterMarginChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfLeft')" style="align-items: flex-start;">
          <textarea
            ref="leftFooter"
            v-model="localFooter.left"
            class="form-control editor-textarea"
            @change="handleFooterLeftChange"
          ></textarea>
        </u-form-item>
      </u-col>
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfCenter')" style="align-items: flex-start;">
          <textarea
            ref="centerFooter"
            v-model="localFooter.center"
            class="form-control editor-textarea"
            @change="handleFooterCenterChange"
          ></textarea>
        </u-form-item>
      </u-col>
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.hfRight')" style="align-items: flex-start;">
          <textarea
            ref="rightFooter"
            v-model="localFooter.right"
            class="form-control editor-textarea"
            @change="handleFooterRightChange"
          ></textarea>
        </u-form-item>
      </u-col>
    </u-row>
  </u-form>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table.js';
import UButton from '@/components/button/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'HeaderFooterSettings',
  components: {
    UButton,
    UInputNumber,
    UForm,
    UFormItem,
    URow,
    UCol
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
.form-desc {
  margin: 0 5px 10px 5px;
  color: #999999;
  font-size: 12px;
}

.editor-textarea {
  font-size: 10pt;
  padding: 5px;
  display: block;
  width: 100%;
  max-width: 140px;
  height: 80px;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #00554a;
}
</style>
