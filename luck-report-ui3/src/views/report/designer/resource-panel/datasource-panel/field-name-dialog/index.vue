<template>
  <UDialog
    :title="$t('tree.addField')"
    width="500px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('tree.fieldName')" prop="fieldName">
          <u-input
            :placeholder="$t('tree.inputTip')"
            v-model="formData.fieldName"
            ref="input"
            @keyup.enter="handleOk"
          />
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
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'FieldNameDialog',
  components: {
    UButton,
    UDialog,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        fieldName: ''
      },
      rules: {
        fieldName: [{
          required: true,
          message: this.$t('tree.inputTip'),
          trigger: 'blur'
        }]
      }
    };
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    resetForm() {
      this.$refs.form && this.$refs.form.resetFields();
    },
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }
      this.$emit('save', this.formData.fieldName.trim(), this.dataset);
      this.$emit('close');
    },
    handleClose() {
      this.$emit('close');
      setTimeout(() => {
        this.resetForm();
      }, 300);
    },
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  },
};
</script>

<style scoped>

</style>
