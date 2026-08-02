<template>
  <div>
    <u-row v-if="showForecolor" class="condition-config-row" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="forceChecked" @change="onForceChange">
          {{ $t('dialog.propCondition.forecolor') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <UColorPicker
            v-show="forceChecked"
            v-model="forceColor"
            @input="onForceColorChange"
        />
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="forceChecked"
            v-model="forceScope"
            style="width: 120px"
            @change="onForceScopeChange"
        >
          <u-option
              v-for="option in scopeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
    </u-row>

    <u-row class="condition-config-row" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="bgcolorChecked" @change="onBgcolorChange">
          {{ $t('dialog.propCondition.bgcolor') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <UColorPicker
            v-show="bgcolorChecked"
            v-model="bgColor"
            @input="onBgColorChange"
        />
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="bgcolorChecked"
            v-model="bgcolorScope"
            style="width: 120px"
            @change="onBgcolorScopeChange"
        >
          <u-option
              v-for="option in scopeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
    </u-row>
  </div>
</template>

<script>
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import UColorPicker from '@/components/color-picker/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import configOptions from '../constants/config-options.js';
import { rgbToHex, hexToRgb } from '@/utils/color';

export default {
  name: 'ColorConfig',
  components: {
    USelect,
    UOption,
    UCheckbox,
    UColorPicker,
    URow,
    UCol
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
    },
    cellType: {
      type: String,
      default: 'simple'
    }
  },
  computed: {
    // 图片类(image/zxing/slash)与图表类(chart)无文字内容，前景色不生效，仅保留背景色
    showForecolor() {
      return !['image', 'zxing', 'slash', 'chart'].includes(this.cellType);
    }
  },
  data() {
    return {
      forceChecked: false,
      forceColor: '#000000',
      forceScope: 'cell',

      bgcolorChecked: false,
      bgColor: '#FFFFFF',
      bgcolorScope: 'cell',

      scopeOptions: []
    };
  },
  created() {
    this.scopeOptions = configOptions.getScopeOptions(this.$t);
  },
  watch: {
    cellStyle: {
      handler(newVal) {
        this.loadColorProperties(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    convertColorToRgb(color) {
      if (!color) return null;

      if (color.startsWith('#')) {
        return hexToRgb(color);
      } else if (color.length > 5 && color.startsWith('rgb')) {
        return color.substring(4, color.length - 1);
      }
      return color;
    },

    convertRgbToHex(rgbString) {
      if (!rgbString) return null;

      const rgbParts = rgbString.split(',');
      if (rgbParts.length === 3) {
        return rgbToHex(parseInt(rgbParts[0]), parseInt(rgbParts[1]), parseInt(rgbParts[2]));
      }
      return null;
    },

    loadColorProperties(cellStyle) {
      if (!cellStyle) return;

      this.forceChecked = !!(cellStyle.forecolor && cellStyle.forecolor !== '');
      if (this.forceChecked) {
        const hexColor = this.convertRgbToHex(cellStyle.forecolor);
        this.forceColor = hexColor || '#000000';
      } else {
        this.forceColor = '';
      }
      this.forceScope = cellStyle.forecolorScope || 'cell';

      this.bgcolorChecked = !!(cellStyle.bgcolor && cellStyle.bgcolor !== '');
      if (this.bgcolorChecked) {
        const hexColor = this.convertRgbToHex(cellStyle.bgcolor);
        this.bgColor = hexColor || '#FFFFFF';
      } else {
        this.bgColor = '';
      }
      this.bgcolorScope = cellStyle.bgcolorScope || 'cell';
    },

    onForceChange() {
      this.$emit('color-change', {
        type: 'forecolor',
        checked: this.forceChecked,
        value: this.forceChecked ? '0,0,0' : null,
        scope: this.forceChecked ? 'cell' : null
      });
    },

    onForceColorChange() {
      const rgbColor = this.convertColorToRgb(this.forceColor);
      this.$emit('color-change', {
        type: 'forecolor',
        checked: this.forceChecked,
        value: rgbColor,
        scope: this.forceScope
      });
    },

    onForceScopeChange() {
      this.$emit('color-change', {
        type: 'forecolor',
        checked: this.forceChecked,
        value: this.convertColorToRgb(this.forceColor),
        scope: this.forceScope
      });
    },

    onBgcolorChange() {
      this.$emit('color-change', {
        type: 'bgcolor',
        checked: this.bgcolorChecked,
        value: this.bgcolorChecked ? '0,0,0' : null,
        scope: this.bgcolorChecked ? 'cell' : null
      });
    },

    onBgColorChange() {
      const rgbColor = this.convertColorToRgb(this.bgColor);
      this.$emit('color-change', {
        type: 'bgcolor',
        checked: this.bgcolorChecked,
        value: rgbColor,
        scope: this.bgcolorScope
      });
    },

    onBgcolorScopeChange() {
      this.$emit('color-change', {
        type: 'bgcolor',
        checked: this.bgcolorChecked,
        value: this.convertColorToRgb(this.bgColor),
        scope: this.bgcolorScope
      });
    }
  }
};
</script>
