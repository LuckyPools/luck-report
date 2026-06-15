<template>
  <UDialog
    :title="dialogTitle"
    width="500px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.groupItem.name')" prop="name">
          <u-input
            v-model="formData.name"
            ref="nameInput"
            @keyup.enter="handleOk"
            style="width:240px;"
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
  name: 'GroupItemDialog',
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
    groupItem: {
      type: Object,
      default: null
    },
    operation: {
      type: String,
      default: 'add'
    }
  },
  data() {
    return {
      formData: {
        name: ''
      },
      rules: {
        name: [{
          required: true,
          message: this.$t('dialog.groupItem.nameTip'),
          trigger: 'blur'
        }]
      }
    };
  },
  computed: {
    dialogTitle() {
      return this.operation === 'add'
        ? this.$t('dialog.groupItem.addItem')
        : this.$t('dialog.groupItem.editItem');
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
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {

    initData(){
      this.formData.name = this.groupItem?.name || '';
    },

    /**
     * 重置表单数据
     */
    resetFormData() {
      this.$refs.form && this.$refs.form.resetFields();
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
     * 确认操作
     */
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const updatedGroupItem = this.groupItem ? { ...this.groupItem, name: this.formData.name } : null;

      this.$emit('saveAfter', {
        operation: this.operation,
        groupItem: updatedGroupItem
      });

      this.handleClose();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.$emit('update:visible', false);
    },

    /**
     * 键盘事件处理
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  }
};
</script>
<style scoped>
</style>
