<template>
  <UDialog
    :title="title"
    width="500px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <u-form-item :label="$t('dialog.conditionGroup.groupName')" prop="name">
          <u-input
              :placeholder="$t('dialog.conditionGroup.nameTip')"
              v-model="formData.name"
              ref="input"
              @keyup.enter="handleOk"
              @click.stop
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
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'PropertyConditionGroupDialog',
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
    conditionGroup: {
      type: Object,
      default: null
    },
    operation: {
      type: String,
      default: 'add'
    },
    conditionGroups: {
      type: Array,
      default: () => []
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
          message: this.$t('dialog.conditionGroup.nameTip'),
          trigger: 'blur'
        }]
      }
    };
  },
  computed: {
    title() {
      if (this.operation === 'add') {
        return this.$t('dialog.conditionGroup.add');
      } else if (this.operation === 'edit') {
        return this.$t('dialog.conditionGroup.edit');
      }
      return this.$t('dialog.conditionGroup.title');
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
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
      if (this.conditionGroup){
        this.formData.name = this.conditionGroup.name || '';
      }
    },

    resetForm() {
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
     * 确认保存
     */
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) {
        return;
      }

      const isDuplicate = this.conditionGroups.some(item => {
        if (this.operation === 'edit' && item === this.conditionGroup) {
          return false;
        }
        return item.name === this.formData.name;
      });

      if (isDuplicate) {
        showAlert(this.$t('dialog.conditionGroup.nameExists'));
        return;
      }

      const group = { ...this.conditionGroup, name: this.formData.name };

      this.$emit('saveAfter', {
        group: group,
        operation: this.operation
      });

      this.handleClose();
    },

    /**
     * 关闭弹窗
     */
    handleClose() {
      this.$emit('close');
    },

    /**
     * 键盘事件处理
     * @param {KeyboardEvent} e 键盘事件对象
     */
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    },
  }
};
</script>

<style scoped>
</style>
