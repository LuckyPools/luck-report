<template>
  <UDialog
      :title="$t('dialog.sqlParam.title')"
      width="500px"
      :visible="visible"
      :z-index="20000"
      @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :label-width="100">
        <u-form-item :label="$t('dialog.sqlParam.name')">
          <u-input v-model="name" :placeholder="$t('dialog.sqlParam.namePlaceholder')" />
        </u-form-item>

        <u-form-item :label="$t('dialog.sqlParam.datatype')">
          <u-select
              :value="type"
              :clearable="true"
              @change="handleTypeChange"
          >
            <u-option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.sqlParam.defaultValue')">
          <u-input v-model="defaultValue" :placeholder="$t('dialog.sqlParam.tip')" />
        </u-form-item>
      </u-form>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleSave">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'ParameterDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    editData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      visible: false,
      name: '',
      type: '',
      defaultValue: ''
    };
  },
  computed: {
    typeOptions() {
      return [
        { value: 'String', label: 'String' },
        { value: 'Integer', label: 'Integer' },
        { value: 'Float', label: 'Float' },
        { value: 'Boolean', label: 'Boolean' },
        { value: 'Date', label: 'Date' },
        { value: 'List', label: 'List' }
      ];
    }
  },
  watch: {
    editData: {
      handler(newData) {
        if (newData) {
          this.name = newData.name || '';
          this.type = newData.type || '';
          this.defaultValue = newData.defaultValue || '';
        } else {
          this.name = '';
          this.type = 'String';
          this.defaultValue = '';
        }
      },
      immediate: true
    }
  },
  methods: {
    show(){
      this.visible = true;
    },
    handleClose() {
      this.visible = false;
    },
    handleTypeChange(value) {
      this.type = value;
    },
    handleSave() {
      if (!this.name) {
        showAlert(this.$t('dialog.sqlParam.nameTip'));
        return;
      }
      if (!this.type) {
        showAlert(this.$t('dialog.sqlParam.datatypeTip'));
        return;
      }
      this.$emit('save', this.name, this.type, this.defaultValue);
      this.handleClose();
    }
  }
};
</script>

<style scoped>
</style>
