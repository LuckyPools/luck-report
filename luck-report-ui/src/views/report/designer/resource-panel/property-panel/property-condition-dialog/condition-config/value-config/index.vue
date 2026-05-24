<template>
  <div>
    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="newValueChecked" @change="onNewValueChange">
          {{ $t('dialog.propCondition.newValue') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-input
            v-show="newValueChecked"
            v-model="localNewValue"
            style="width: 250px"
            :placeholder="$t('dialog.propCondition.newValuePlaceholder')"
            @change="onNewValueInputChange"
        />
      </u-col>
    </u-row>

    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="formatChecked" @change="onFormatChange">
          {{ $t('dialog.propCondition.format') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <vue-simple-suggest
            v-show="formatChecked"
            v-model="format"
            :list="suggestionList"
            :filter-by-query="true"
            class="simple-suggest"
            @blur="onFormatInputChange"
        ></vue-simple-suggest>
      </u-col>
    </u-row>
  </div>
</template>

<script>
import UInput from '@/components/input/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import VueSimpleSuggest from 'vue-simple-suggest';
import 'vue-simple-suggest/dist/styles.css';
import configOptions from '../constants/config-options.js';

export default {
  name: 'ValueConfig',
  components: {
    UInput,
    UCheckbox,
    URow,
    UCol,
    VueSimpleSuggest
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
    },
    newValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      newValueChecked: false,
      localNewValue: '',

      formatChecked: false,
      format: '',

      suggestionList: []
    };
  },
  created() {
    this.suggestionList = configOptions.getSuggestionList();
  },
  watch: {
    cellStyle: {
      handler(newVal) {
        this.loadValueProperties(newVal);
      },
      immediate: true,
      deep: true
    },
    newValue: {
      handler(newVal) {
        if (newVal != null && newVal !== '') {
          this.newValueChecked = true;
          if (newVal !== this.localNewValue) {
            this.localNewValue = newVal;
          }
        } else if (newVal === null) {
          this.newValueChecked = false;
          this.localNewValue = '';
        }
      },
      immediate: true
    }
  },
  methods: {
    loadValueProperties(cellStyle) {
      if (!cellStyle) return;

      this.formatChecked = cellStyle.format != null;
      this.format = this.formatChecked ? cellStyle.format : '';
    },

    onNewValueChange() {
      if (this.newValueChecked) {
        this.$emit('value-change', {
          type: 'newValue',
          checked: true,
          value: this.localNewValue || ''
        });
      } else {
        this.$emit('value-change', {
          type: 'newValue',
          checked: false,
          value: null
        });
      }
    },

    onNewValueInputChange() {
      if (this.newValueChecked) {
        this.$emit('value-change', {
          type: 'newValue',
          checked: true,
          value: this.localNewValue
        });
      }
    },

    onFormatChange() {
      this.$emit('value-change', {
        type: 'format',
        checked: this.formatChecked,
        value: this.formatChecked ? this.format : null
      });
    },

    onFormatInputChange() {
      if (this.formatChecked) {
        this.$emit('value-change', {
          type: 'format',
          checked: true,
          value: this.format
        });
      }
    }
  }
};
</script>

<style scoped>
.simple-suggest /deep/ .default-input {
  width: 250px !important;
  height: 35px;
}
</style>
