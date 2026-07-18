<template>
  <UDialog
    :title="$t('dialog.fontSetting.title')"
    width="400px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form :label-width="60">
        <!-- 字体选择 -->
        <u-form-item :label="$t('dialog.fontSetting.font')">
          <u-select
            v-model="localStyle.fontFamily"
          >
            <u-option
              v-for="option in fontFamilyOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 颜色选择 -->
        <u-form-item :label="$t('dialog.fontSetting.color')">
          <UColorPicker v-model="localColor" />
        </u-form-item>

        <!-- 字体大小 -->
        <u-form-item :label="$t('dialog.fontSetting.size')">
          <u-select
            v-model="localStyle.fontSize"
          >
            <u-option
              v-for="option in fontSizeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 粗体 -->
        <u-form-item :label="$t('dialog.fontSetting.bold')">
          <u-select
            v-model="localStyle.bold"
          >
            <u-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 斜体 -->
        <u-form-item :label="$t('dialog.fontSetting.italic')">
          <u-select
            v-model="localStyle.italic"
          >
            <u-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <!-- 下划线 -->
        <u-form-item :label="$t('dialog.fontSetting.underline')">
          <u-select
            v-model="localStyle.underline"
          >
            <u-option
              v-for="option in booleanOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>
      </u-form>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from "@/components/button/index.vue";
import UColorPicker from "@/components/color-picker/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { rgbToHex, hexToRgb } from '@/utils/color';

export default {
  name: 'FontSettingDialog',
  components: {
    UColorPicker,
    UButton,
    UDialog,
    USelect,
    UOption,
    UForm,
    UFormItem
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
        { value: 'true', label: this.$t('dialog.fontSetting.yes') },
        { value: 'false', label: this.$t('dialog.fontSetting.no') }
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
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
</style>
