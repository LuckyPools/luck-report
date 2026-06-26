<template>
  <a-modal
    :title="t('dialog.fontSetting.title')"
    width="400px"
    :open="visible"
    :okText="t('common.confirm')"
    :cancelText="t('common.cancel')"
    @cancel="handleClose"
    @ok="handleOk"
  >
    <div class="dialog-content">
      <a-form :label-col="{ style: { width: '60px' } }">
        <!-- 字体选择 -->
        <a-form-item :label="t('dialog.fontSetting.font')">
          <a-select
            v-model:value="localStyle.fontFamily"
          >
            <a-select-option
              v-for="option in fontFamilyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 颜色选择 -->
        <a-form-item :label="t('dialog.fontSetting.color')">
          <u-color-picker v-model:value="localColor" />
        </a-form-item>

        <!-- 字体大小 -->
        <a-form-item :label="t('dialog.fontSetting.size')">
          <a-select
            v-model:value="localStyle.fontSize"
          >
            <a-select-option
              v-for="option in fontSizeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 粗体 -->
        <a-form-item :label="t('dialog.fontSetting.bold')">
          <a-select
            v-model:value="localStyle.bold"
          >
            <a-select-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 斜体 -->
        <a-form-item :label="t('dialog.fontSetting.italic')">
          <a-select
            v-model:value="localStyle.italic"
          >
            <a-select-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 下划线 -->
        <a-form-item :label="t('dialog.fontSetting.underline')">
          <a-select
            v-model:value="localStyle.underline"
          >
            <a-select-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script>
import { rgbToHex, hexToRgb } from '@/utils/color';
import { useI18n } from 'vue-i18n';
import UColorPicker from '@/components/color-picker/index.vue';

// 模板里用 t(...)，方法里用 this.t(...)，由 setup() 从 useI18n 注入
export default {
  name: 'FontSettingDialog',
  // 关闭 inheritAttrs，避免父级透传的 @ok 事件（onOk）与模板里 a-modal 的 @ok
  // 合并成数组触发 ant-design-vue AModal 的 prop 类型检查警告
  inheritAttrs: false,
  components: {
    UColorPicker
  },
  setup() {
    return { t: useI18n().t };
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    fontStyle: {
      type: Object,
      default: () => ({
        fontFamily: '宋体',
        fontSize: 10,
        forecolor: '0,0,0',
        bold: false,
        italic: false,
        underline: false
      })
    }
  },
  data() {
    return {
      localStyle: {
        fontFamily: '宋体',
        fontSize: '10',
        forecolor: '0,0,0',
        bold: 'false',
        italic: 'false',
        underline: 'false'
      },
      localColor: '#000000',
      fontFamilies: [
        '宋体', '仿宋', '黑体', '楷体', '微软雅黑',
        'Arial', 'Impact', 'Times New Roman', 'Comic Sans MS', 'Courier New'
      ],
      fontSizes: Array.from({length: 100}, (_, i) => i + 1)
    };
  },
  computed: {
    fontFamilyOptions() {
      return this.fontFamilies.map(font => ({
        value: font,
        label: font
      }));
    },
    fontSizeOptions() {
      return this.fontSizes.map(size => ({
        value: String(size),
        label: String(size)
      }));
    },
    booleanOptions() {
      return [
        { value: 'true', label: this.t('dialog.fontSetting.yes') },
        { value: 'false', label: this.t('dialog.fontSetting.no') }
      ];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initializeStyle();
      }
    },
    fontStyle(newVal) {
      if (this.visible) {
        this.initializeStyle();
      }
    },
    localColor(newVal) {
      this.localStyle.forecolor = hexToRgb(newVal);
    }
  },
  created() {
    this.initializeStyle();
  },
  methods: {
    initializeStyle() {
      this.localStyle = {
        fontFamily: this.fontStyle.fontFamily || '宋体',
        forecolor: this.fontStyle.forecolor || '0,0,0',
        fontSize: this.fontStyle.fontSize !== undefined ? String(this.fontStyle.fontSize) : '10',
        bold: this.fontStyle.bold !== undefined ? String(this.fontStyle.bold) : 'false',
        italic: this.fontStyle.italic !== undefined ? String(this.fontStyle.italic) : 'false',
        underline: this.fontStyle.underline !== undefined ? String(this.fontStyle.underline) : 'false'
      };
      this.localColor = rgbToHex(this.localStyle.forecolor);
    },
    handleOk() {
      const resultStyle = {
        ...this.localStyle,
        bold: this.localStyle.bold === 'true',
        italic: this.localStyle.italic === 'true',
        underline: this.localStyle.underline === 'true'
      };

      this.$emit('ok', resultStyle);
      this.handleClose();
    },
    handleClose() {
      console.log('[DEBUG][font-setting-dialog] handleClose emit close')
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
</style>
