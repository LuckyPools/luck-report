<template>
  <UDialog
      :title="$t('dialog.sqlParam.title')"
      width="500px"
      :visible="visible"
      :z-index="20000"
      @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.sqlParam.name')" prop="name">
          <u-input v-model="formData.name" :placeholder="$t('dialog.sqlParam.namePlaceholder')" />
        </u-form-item>

        <u-form-item :label="$t('dialog.sqlParam.datatype')" prop="type">
          <u-select
              v-model="formData.type"
              :clearable="true"
          >
            <u-option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.sqlParam.defaultValue')" prop="defaultValue">
          <u-input v-model="formData.defaultValue" :placeholder="$t('dialog.sqlParam.tip')" />
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
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import {showAlert} from "@/utils/comnon";

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
    visible: {
      type: Boolean,
      default: false
    },
    editData: {
      type: Object,
      default: null
    },
    parameters: {
      type: Array,
      default: () => []
    },
    editIndex: {
      type: Number,
      default: -1
    }
  },
  emits: ['update:visible', 'save'],
  data() {
    return {
      formData: {
        name: '',
        type: 'String',
        defaultValue: ''
      },
      rules: {
        name: [{
          required: true,
          message: this.$t('dialog.sqlParam.nameTip'),
          trigger: 'blur'
        }],
        type: [{
          required: true,
          message: this.$t('dialog.sqlParam.datatypeTip'),
          trigger: 'blur'
        }]
      }
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
    visible(newVal) {
      if (newVal) {
        this.resetFormData();
        this.initData();
      }
    }
  },
  methods: {

    initData(){
      this.formData.name = this.editData?.name || '';
      this.formData.type = this.editData?.type || '';
      this.formData.defaultValue = this.editData?.defaultValue || '';
    },

    /**
     * 校验表单
     * @returns {Promise<boolean>} 校验结果
     */
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    /**
     * 重置表单数据
     */
    resetFormData() {
      this.$refs.form && this.$refs.form.resetFields();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.$emit('update:visible', false);
    },

    /**
     * 保存数据
     * 先校验重名，通过后再关闭弹窗
     */
    async handleSave() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const name = this.formData.name;
      const isNameChanged = this.editIndex === -1 || this.parameters[this.editIndex]?.name !== name;
      if (isNameChanged && this.parameters.some(param => param.name === name)) {
        showAlert(this.$t('dialog.sqlParam.nameExists'));
        return;
      }

      this.$emit('save', name, this.formData.type, this.formData.defaultValue);
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
</style>
