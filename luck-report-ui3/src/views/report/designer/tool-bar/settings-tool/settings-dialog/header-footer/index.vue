<template>
  <a-form>
    <div class="form-desc">{{ t('dialog.setting.hfdesc') }}</div>

    <a-row>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.header')" >
          <a-button
            @click="handleOpenHeaderFontDialog">
            {{ t('dialog.setting.fontStyleSetting') }}
          </a-button>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.headerMargin')" >
          <a-input-number
            v-model:value="localHeaderMargin"
            @change="handleHeaderMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfLeft')">
          <a-textarea
            ref="leftHeaderRef"
            v-model:value="localHeader.left"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleHeaderLeftChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfCenter')">
          <a-textarea
            ref="centerHeaderRef"
            v-model:value="localHeader.center"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleHeaderCenterChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfRight')">
          <a-textarea
            ref="rightHeaderRef"
            v-model:value="localHeader.right"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleHeaderRightChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 10px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.footer')" >
          <a-button
            @click="handleOpenFooterFontDialog">
            {{ t('dialog.setting.fontStyleSetting') }}
          </a-button>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.footerMargin')" >
          <a-input-number
            v-model:value="localFooterMargin"
            @change="handleFooterMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfLeft')" >
          <a-textarea
            ref="leftFooterRef"
            v-model:value="localFooter.left"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleFooterLeftChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfCenter')" >
          <a-textarea
            ref="centerFooterRef"
            v-model:value="localFooter.center"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleFooterCenterChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.hfRight')" >
          <a-textarea
            ref="rightFooterRef"
            v-model:value="localFooter.right"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            @change="handleFooterRightChange"
          />
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
      console.log('[DEBUG][header-footer] handleHeaderLeftChange, localHeader=', JSON.stringify(this.localHeader))
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
      this.applyEditorStyles(this.localHeader, ['leftHeaderRef', 'centerHeaderRef', 'rightHeaderRef']);
    },
    setFooterEditorStyles() {
      this.applyEditorStyles(this.localFooter, ['leftFooterRef', 'centerFooterRef', 'rightFooterRef']);
    },
    /**
     * 应用样式到 textarea 元素
     * @param style - 样式对象
     * @param refs - ref 名称数组
     */
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
        const componentRef = this.$refs[refName];
        // ant design textarea 组件通过 textarea 属性获取内部 textarea 元素
        const el = componentRef?.textarea || componentRef;
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
  margin-bottom: 10px;
  color: #999999;
  font-size: 12px;
}
.property-label :deep(.ant-form-item-label) {
  align-items: flex-start;
}
</style>
