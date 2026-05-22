<template>
  <div>
    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="fontChecked" @change="onFontChange">
          {{ $t('dialog.propCondition.font') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontChecked"
            v-model="fontFamily"
            :clearable="true"
            @change="onFontFamilyChange"
            style="width: 120px"
        >
          <u-option
              v-for="option in fontOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontChecked"
            v-model="fontFamilyScope"
            :clearable="true"
            @change="onFontFamilyScopeChange"
            style="width: 120px"
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

    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="fontSizeChecked" @change="onFontSizeChange">
          {{ $t('dialog.propCondition.fontSize') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontSizeChecked"
            v-model="fontSize"
            :clearable="true"
            @change="onFontSizeValueChange"
            style="width: 120px"
        >
          <u-option
              v-for="option in fontSizeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontSizeChecked"
            v-model="fontSizeScope"
            :clearable="true"
            @change="onFontSizeScopeChange"
            style="width: 120px"
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

    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="fontBoldChecked" @change="onFontBoldChange">
          {{ $t('dialog.propCondition.bold') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontBoldChecked"
            v-model="fontBold"
            :clearable="true"
            @change="onFontBoldValueChange"
            style="width: 120px"
        >
          <u-option
              v-for="option in yesNoOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontBoldChecked"
            v-model="fontBoldScope"
            :clearable="true"
            @change="onFontBoldScopeChange"
            style="width: 120px"
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

    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="fontItalicChecked" @change="onFontItalicChange">
          {{ $t('dialog.propCondition.italic') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontItalicChecked"
            v-model="fontItalic"
            :clearable="true"
            @change="onFontItalicValueChange"
            style="width: 120px"
        >
          <u-option
              v-for="option in yesNoOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontItalicChecked"
            v-model="fontItalicScope"
            :clearable="true"
            @change="onFontItalicScopeChange"
            style="width: 120px"
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

    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="fontUnderlineChecked" @change="onFontUnderlineChange">
          {{ $t('dialog.propCondition.underline') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontUnderlineChecked"
            v-model="fontUnderline"
            :clearable="true"
            @change="onFontUnderlineValueChange"
            style="width: 120px"
        >
          <u-option
              v-for="option in yesNoOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="fontUnderlineChecked"
            v-model="fontUnderlineScope"
            :clearable="true"
            @change="onFontUnderlineScopeChange"
            style="width: 120px"
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
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import configOptions from '../constants/config-options.js';

export default {
  name: 'FontConfig',
  components: {
    USelect,
    UOption,
    UCheckbox,
    URow,
    UCol
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      fontChecked: false,
      fontFamily: '',
      fontFamilyScope: 'cell',

      fontSizeChecked: false,
      fontSize: '',
      fontSizeScope: 'cell',

      fontBoldChecked: false,
      fontBold: '',
      fontBoldScope: 'cell',

      fontItalicChecked: false,
      fontItalic: '',
      fontItalicScope: 'cell',

      fontUnderlineChecked: false,
      fontUnderline: '',
      fontUnderlineScope: 'cell',

      fontOptions: [],
      fontSizeOptions: [],
      yesNoOptions: [],
      scopeOptions: []
    };
  },
  created() {
    this.fontOptions = configOptions.getFontOptions(this.$t);
    this.fontSizeOptions = configOptions.getFontSizeOptions();
    this.yesNoOptions = configOptions.getYesNoOptions(this.$t);
    this.scopeOptions = configOptions.getScopeOptions(this.$t);
  },
  watch: {
    cellStyle: {
      handler(newVal) {
        this.loadFontProperties(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    loadFontProperties(cellStyle) {
      if (!cellStyle) return;

      this.fontChecked = !!(cellStyle.fontFamily && cellStyle.fontFamily !== '0');
      this.fontFamily = this.fontChecked ? cellStyle.fontFamily : '';
      this.fontFamilyScope = cellStyle.fontFamilyScope || 'cell';

      this.fontSizeChecked = !!(cellStyle.fontSize && cellStyle.fontSize !== '0');
      this.fontSize = this.fontSizeChecked ? cellStyle.fontSize : '';
      this.fontSizeScope = cellStyle.fontSizeScope || 'cell';

      this.fontBoldChecked = !!(cellStyle.bold !== null && cellStyle.bold !== undefined && cellStyle.bold !== '');
      this.fontBold = this.fontBoldChecked ? (cellStyle.bold === true || cellStyle.bold === "true" ? "true" : "false") : '';
      this.fontBoldScope = cellStyle.boldScope || 'cell';

      this.fontItalicChecked = !!(cellStyle.italic !== null && cellStyle.italic !== undefined && cellStyle.italic !== '');
      this.fontItalic = this.fontItalicChecked ? (cellStyle.italic === true || cellStyle.italic === "true" ? "true" : "false") : '';
      this.fontItalicScope = cellStyle.italicScope || 'cell';

      this.fontUnderlineChecked = !!(cellStyle.underline !== null && cellStyle.underline !== undefined && cellStyle.underline !== '');
      this.fontUnderline = this.fontUnderlineChecked ? (cellStyle.underline === true || cellStyle.underline === "true" ? "true" : "false") : '';
      this.fontUnderlineScope = cellStyle.underlineScope || 'cell';
    },

    onFontChange() {
      this.$emit('font-change', {
        type: 'fontFamily',
        checked: this.fontChecked,
        value: this.fontChecked ? '宋体' : null,
        scope: this.fontChecked ? 'cell' : null
      });
    },

    onFontFamilyChange() {
      this.$emit('font-change', {
        type: 'fontFamily',
        checked: this.fontChecked,
        value: this.fontFamily,
        scope: this.fontFamilyScope
      });
    },

    onFontFamilyScopeChange() {
      this.$emit('font-change', {
        type: 'fontFamily',
        checked: this.fontChecked,
        value: this.fontFamily,
        scope: this.fontFamilyScope
      });
    },

    onFontSizeChange() {
      this.$emit('font-change', {
        type: 'fontSize',
        checked: this.fontSizeChecked,
        value: this.fontSizeChecked ? '12' : null,
        scope: this.fontSizeChecked ? 'cell' : null
      });
    },

    onFontSizeValueChange() {
      this.$emit('font-change', {
        type: 'fontSize',
        checked: this.fontSizeChecked,
        value: this.fontSize,
        scope: this.fontSizeScope
      });
    },

    onFontSizeScopeChange() {
      this.$emit('font-change', {
        type: 'fontSize',
        checked: this.fontSizeChecked,
        value: this.fontSize,
        scope: this.fontSizeScope
      });
    },

    onFontBoldChange() {
      this.$emit('font-change', {
        type: 'bold',
        checked: this.fontBoldChecked,
        value: this.fontBoldChecked ? true : null,
        scope: this.fontBoldChecked ? 'cell' : null
      });
    },

    onFontBoldValueChange() {
      this.$emit('font-change', {
        type: 'bold',
        checked: this.fontBoldChecked,
        value: this.fontBold,
        scope: this.fontBoldScope
      });
    },

    onFontBoldScopeChange() {
      this.$emit('font-change', {
        type: 'bold',
        checked: this.fontBoldChecked,
        value: this.fontBold,
        scope: this.fontBoldScope
      });
    },

    onFontItalicChange() {
      this.$emit('font-change', {
        type: 'italic',
        checked: this.fontItalicChecked,
        value: this.fontItalicChecked ? true : null,
        scope: this.fontItalicChecked ? 'cell' : null
      });
    },

    onFontItalicValueChange() {
      this.$emit('font-change', {
        type: 'italic',
        checked: this.fontItalicChecked,
        value: this.fontItalic,
        scope: this.fontItalicScope
      });
    },

    onFontItalicScopeChange() {
      this.$emit('font-change', {
        type: 'italic',
        checked: this.fontItalicChecked,
        value: this.fontItalic,
        scope: this.fontItalicScope
      });
    },

    onFontUnderlineChange() {
      this.$emit('font-change', {
        type: 'underline',
        checked: this.fontUnderlineChecked,
        value: this.fontUnderlineChecked ? true : null,
        scope: this.fontUnderlineChecked ? 'cell' : null
      });
    },

    onFontUnderlineValueChange() {
      this.$emit('font-change', {
        type: 'underline',
        checked: this.fontUnderlineChecked,
        value: this.fontUnderline,
        scope: this.fontUnderlineScope
      });
    },

    onFontUnderlineScopeChange() {
      this.$emit('font-change', {
        type: 'underline',
        checked: this.fontUnderlineChecked,
        value: this.fontUnderline,
        scope: this.fontUnderlineScope
      });
    }
  }
};
</script>
