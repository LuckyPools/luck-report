<template>
  <div>
    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="linkChecked" @change="onLinkChange">
          {{ $t('dialog.propCondition.link') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-model="localLinkTargetWindow"
            style="width: 120px"
            @change="onLinkTargetChange"
        >
          <u-option
              v-for="option in linkTargetOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-button type="info" @click="configLinkParameter">
          {{ $t('dialog.propCondition.urlParameter') }}
        </u-button>
      </u-col>
    </u-row>

    <u-row v-show="linkChecked" style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
      </u-col>
      <u-col :span="8">
        <u-input
            v-show="linkChecked"
            v-model="localLinkUrl"
            style="width: 250px"
            :placeholder="$t('dialog.propCondition.linkUrlPlaceholder')"
            @change="onLinkUrlChange" />
      </u-col>
    </u-row>

    <URLParameterDialog
      :visible="urlParameterDialogVisible"
      :parameters="linkParameters || []"
      @update:visible="handleUrlParameterDialogClose"
      @saveAfter="handleUrlParameterSaveAfter"
      @parameters-change="onLinkParametersChange"
    />
  </div>
</template>

<script>
import UInput from '@/components/input/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import UButton from '@/components/button/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import URLParameterDialog from '../../../url-parameter-dialog/index.vue';
import { showAlert } from '@/utils/comnon.js';
import configOptions from '../constants/config-options.js';

export default {
  name: 'LinkConfig',
  components: {
    UInput,
    USelect,
    UOption,
    UCheckbox,
    UButton,
    URow,
    UCol,
    URLParameterDialog
  },
  props: {
    linkUrl: {
      type: String,
      default: ''
    },
    linkTargetWindow: {
      type: String,
      default: ''
    },
    linkParameters: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      linkChecked: false,
      localLinkUrl: '',
      localLinkTargetWindow: '',
      localLinkParameters: [],

      urlParameterDialogVisible: false,
      linkTargetOptions: []
    };
  },
  created() {
    this.linkTargetOptions = configOptions.getLinkTargetOptions(this.$t);
  },
  watch: {
    linkUrl: {
      handler(newVal) {
        this.loadLinkProperties();
      },
      immediate: true
    },
    linkTargetWindow: {
      handler(newVal) {
        this.loadLinkProperties();
      },
      immediate: true
    },
    linkParameters: {
      handler(newVal) {
        this.localLinkParameters = newVal || [];
      },
      immediate: true
    }
  },
  methods: {
    loadLinkProperties() {
      this.linkChecked = this.linkUrl != null;
      if (this.linkChecked) {
        this.localLinkUrl = this.linkUrl || '';
        this.localLinkTargetWindow = this.linkTargetWindow || '';
      } else {
        this.localLinkUrl = '';
        this.localLinkTargetWindow = '';
      }
    },

    onLinkChange() {
      this.$emit('link-change', {
        checked: this.linkChecked,
        linkUrl: this.linkChecked ? this.localLinkUrl : null,
        linkTargetWindow: this.linkChecked ? this.localLinkTargetWindow : null,
        linkParameters: this.linkChecked ? this.localLinkParameters : null
      });
    },

    onLinkUrlChange() {
      if (this.linkChecked) {
        this.$emit('link-change', {
          checked: true,
          linkUrl: this.localLinkUrl,
          linkTargetWindow: this.localLinkTargetWindow,
          linkParameters: this.localLinkParameters
        });
      }
    },

    onLinkTargetChange() {
      if (this.linkChecked) {
        this.$emit('link-change', {
          checked: true,
          linkUrl: this.localLinkUrl,
          linkTargetWindow: this.localLinkTargetWindow,
          linkParameters: this.localLinkParameters
        });
      }
    },

    onLinkParametersChange(parameters) {
      this.localLinkParameters = parameters;
      if (this.linkChecked) {
        this.$emit('link-change', {
          checked: true,
          linkUrl: this.localLinkUrl,
          linkTargetWindow: this.localLinkTargetWindow,
          linkParameters: this.localLinkParameters
        });
      }
    },

    configLinkParameter() {
      if (!this.localLinkUrl) {
        showAlert(this.$t('dialog.propCondition.linkUrl'));
        return;
      }

      if (!this.localLinkParameters) {
        this.localLinkParameters = [];
      }

      this.urlParameterDialogVisible = true;
    },

    handleUrlParameterDialogClose() {
      this.urlParameterDialogVisible = false;
    },

    handleUrlParameterSaveAfter({ paramItem, operation }) {
    }
  }
};
</script>
