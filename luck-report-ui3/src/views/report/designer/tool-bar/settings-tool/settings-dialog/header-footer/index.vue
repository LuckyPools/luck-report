<template>
  <a-form :label-col="{ style: { width: '50px' } }">
    <div class="form-desc">{{ t('dialog.setting.hfdesc') }}</div>

    <a-row>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.header')">
          <a-button
            type="link"
            @click="handleOpenHeaderFontDialog">
            {{ t('dialog.setting.fontStyleSetting') }}
          </a-button>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.headerMargin')" :label-col="{ style: { width: '140px' } }">
          <a-input-number
            v-model:value="localHeaderMargin"
            @change="handleHeaderMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfLeft')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="leftHeader"
            v-model="localHeader.left"
            class="form-control editor-textarea"
            @change="handleHeaderLeftChange"
          ></textarea>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfCenter')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="centerHeader"
            v-model="localHeader.center"
            class="form-control editor-textarea"
            @change="handleHeaderCenterChange"
          ></textarea>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfRight')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="rightHeader"
            v-model="localHeader.right"
            class="form-control editor-textarea"
            @change="handleHeaderRightChange"
          ></textarea>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 10px;">
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.footer')">
          <a-button
            type="link"
            @click="handleOpenFooterFontDialog">
            {{ t('dialog.setting.fontStyleSetting') }}
          </a-button>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.footerMargin')" :label-col="{ style: { width: '140px' } }">
          <a-input-number
            v-model:value="localFooterMargin"
            @change="handleFooterMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfLeft')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="leftFooter"
            v-model="localFooter.left"
            class="form-control editor-textarea"
            @change="handleFooterLeftChange"
          ></textarea>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfCenter')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="centerFooter"
            v-model="localFooter.center"
            class="form-control editor-textarea"
            @change="handleFooterCenterChange"
          ></textarea>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfRight')" :label-col="{ style: { width: '80px' } }">
          <textarea
            ref="rightFooter"
            v-model="localFooter.right"
            class="form-control editor-textarea"
            @change="handleFooterRightChange"
          ></textarea>
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table';
import { useI18n } from 'vue-i18n';

export default {
  name: 'HeaderFooterSettings',
  setup() {
    return { t: useI18n().t };
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
      this.applyEditorStyles(this.localHeader, ['leftHeader', 'centerHeader', 'rightHeader']);
    },
    setFooterEditorStyles() {
      this.applyEditorStyles(this.localFooter, ['leftFooter', 'centerFooter', 'rightFooter']);
    },
    applyEditorStyles(style, refs) {
      if (!style) return;
      const styles = {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize + 'pt',
        color: this.forecolorToCss(style.forecolor),
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none'
      };
      refs.forEach(refName => {
        const el = this.$refs[refName];
        if (el && el.style) {
          Object.keys(styles).forEach(key => {
            el.style[key] = styles[key];
          });
        }
      });
    },
    forecolorToCss(forecolor) {
      if (!forecolor) return '#000000';
      const parts = String(forecolor).split(',').map(s => parseInt(s.trim(), 10));
      if (parts.length === 3 && parts.every(n => !isNaN(n))) {
        return '#' + parts.map(n => n.toString(16).padStart(2, '0')).join('');
      }
      return '#000000';
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
.property-label :deep(.ant-form-item-label) {
  align-items: flex-start;
}
</style>
