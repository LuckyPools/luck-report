<template>
  <div>
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="newValueChecked" @change="onNewValueChange">
          {{ $t('dialog.propCondition.newValue') }}
        </u-checkbox>
      </div>
      <span v-show="newValueChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input
              v-model="localNewValue"
              :placeholder="$t('dialog.propCondition.newValuePlaceholder')"
              style="width: 268px;"
              @change="onNewValueInputChange"
          />
        </div>
      </span>
    </div>

    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="formatChecked" @change="onFormatChange">
          {{ $t('dialog.propCondition.format') }}
        </u-checkbox>
      </div>
      <span v-show="formatChecked" style="margin-left: 10px;">
         <vue-simple-suggest
             v-model="format"
             :list="suggestionList"
             :filter-by-query="true"
             class="simple-suggest"
             style="display: inline-block"
             @input="onFormatInputChange"
         ></vue-simple-suggest>
      </span>
    </div>
  </div>
</template>

<script>
import UInput from '@/components/input/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import VueSimpleSuggest from 'vue-simple-suggest';
import 'vue-simple-suggest/dist/styles.css';
import configOptions from '../constants/config-options.js';

export default {
  name: 'ValueConfig',
  components: {
    UInput,
    UCheckbox,
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
  width: 268px !important;
  height: 35px;
}
</style>
