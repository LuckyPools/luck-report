<template>
  <div>
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="forceChecked" @change="onForceChange">
          {{ $t('dialog.propCondition.forecolor') }}
        </u-checkbox>
      </div>

      <span v-show="forceChecked">
        <div class="u-inline">
          <UColorPicker
              v-model="forceColor"
              @input="onForceColorChange"
          />
        </div>

        <span>{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="forceScope"
              :clearable="true"
              @change="onForceScopeChange"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="bgcolorChecked" @change="onBgcolorChange">
          {{ $t('dialog.propCondition.bgcolor') }}
        </u-checkbox>
      </div>
      <span v-show="bgcolorChecked">
        <div class="u-inline">
          <UColorPicker
              v-model="bgColor"
              @input="onBgColorChange"
          />
        </div>
        <span>{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="bgcolorScope"
              :clearable="true"
              @change="onBgcolorScopeChange"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>
  </div>
</template>

<script>
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import UColorPicker from '@/components/color-picker/index.vue';
import configOptions from '../constants/config-options.js';

export default {
  name: 'ColorConfig',
  components: {
    USelect,
    UOption,
    UCheckbox,
    UColorPicker
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
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
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    },

    convertColorToRgb(color) {
      if (!color) return null;
      
      if (color.startsWith('#')) {
        const rgb = this.hexToRgb(color);
        if (rgb) {
          return `${rgb.r},${rgb.g},${rgb.b}`;
        }
      } else if (color.length > 5 && color.startsWith('rgb')) {
        return color.substring(4, color.length - 1);
      }
      return color;
    },

    convertRgbToHex(rgbString) {
      if (!rgbString) return null;
      
      const rgbParts = rgbString.split(',');
      if (rgbParts.length === 3) {
        return this.rgbToHex(parseInt(rgbParts[0]), parseInt(rgbParts[1]), parseInt(rgbParts[2]));
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
