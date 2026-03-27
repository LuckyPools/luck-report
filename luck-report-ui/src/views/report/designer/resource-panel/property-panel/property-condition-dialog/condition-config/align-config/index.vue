<template>
  <div>
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="alignChecked" @change="onAlignChange">
          {{ $t('dialog.propCondition.align') }}
        </u-checkbox>
      </div>
      <span v-show="alignChecked" style="margin-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="align"
              :clearable="true"
              @change="onAlignValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in alignOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="alignScope"
              :clearable="true"
              @change="onAlignScopeChange"
              style="width: 120px"
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
        <u-checkbox v-model="valignChecked" @change="onValignChange">
          {{ $t('dialog.propCondition.valign') }}
        </u-checkbox>
      </div>
      <span v-show="valignChecked" style="margin-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="valign"
              :clearable="true"
              @change="onValignValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in valignOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="valignScope"
              :clearable="true"
              @change="onValignScopeChange"
              style="width: 120px"
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
import configOptions from '../constants/config-options.js';

export default {
  name: 'AlignConfig',
  components: {
    USelect,
    UOption,
    UCheckbox
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      alignChecked: false,
      align: '',
      alignScope: 'cell',

      valignChecked: false,
      valign: '',
      valignScope: 'cell',

      alignOptions: [],
      valignOptions: [],
      scopeOptions: []
    };
  },
  created() {
    this.alignOptions = configOptions.getAlignOptions(this.$t);
    this.valignOptions = configOptions.getValignOptions(this.$t);
    this.scopeOptions = configOptions.getScopeOptions(this.$t);
  },
  watch: {
    cellStyle: {
      handler(newVal) {
        this.loadAlignProperties(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    loadAlignProperties(cellStyle) {
      if (!cellStyle) return;

      this.alignChecked = !!(cellStyle.align && cellStyle.align !== '');
      this.align = this.alignChecked ? cellStyle.align : '';
      this.alignScope = cellStyle.alignScope || 'cell';

      this.valignChecked = !!(cellStyle.valign && cellStyle.valign !== '');
      this.valign = this.valignChecked ? cellStyle.valign : '';
      this.valignScope = cellStyle.valignScope || 'cell';
    },

    onAlignChange() {
      this.$emit('align-change', {
        type: 'align',
        checked: this.alignChecked,
        value: this.alignChecked ? 'center' : null,
        scope: this.alignChecked ? 'cell' : null
      });
    },

    onAlignValueChange() {
      this.$emit('align-change', {
        type: 'align',
        checked: this.alignChecked,
        value: this.align,
        scope: this.alignScope
      });
    },

    onAlignScopeChange() {
      this.$emit('align-change', {
        type: 'align',
        checked: this.alignChecked,
        value: this.align,
        scope: this.alignScope
      });
    },

    onValignChange() {
      this.$emit('align-change', {
        type: 'valign',
        checked: this.valignChecked,
        value: this.valignChecked ? 'middle' : null,
        scope: this.valignChecked ? 'cell' : null
      });
    },

    onValignValueChange() {
      this.$emit('align-change', {
        type: 'valign',
        checked: this.valignChecked,
        value: this.valign,
        scope: this.valignScope
      });
    },

    onValignScopeChange() {
      this.$emit('align-change', {
        type: 'valign',
        checked: this.valignChecked,
        value: this.valign,
        scope: this.valignScope
      });
    }
  }
};
</script>
