<template>
  <UDialog
    :title="title"
    width="500px"
    :visible="visible"
    :z-index="20010"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :label-width="80">
        <u-form-item :label="$t('dialog.paramItem.name')">
          <u-input
            v-model="name"
            ref="nameInput"
            style="width: 350px;"
            @keyup.enter="handleOk"
          />
        </u-form-item>

        <u-form-item :label="$t('dialog.paramItem.expr')">
          <u-input
            v-model="value"
            ref="valueInput"
            style="width: 350px;"
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
import { showAlert } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'URLParameterItemDialog',
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
    paramItem: {
      type: Object,
      default: null
    },
    operation: {
      type: String,
      default: 'add'
    }
  },
  emits: ['saveAfter', 'update:visible'],
  data() {
    return {
      name: '',
      value: '',
      localParamItem: null
    };
  },
  computed: {
    title() {
      return this.operation === 'add' ? this.$t('dialog.paramItem.add') : this.$t('dialog.paramItem.edit');
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.name = this.paramItem?.name || '';
        this.value = this.paramItem?.value || '';
        this.localParamItem = this.paramItem ? { ...this.paramItem } : null;
      }
    }
  },
  mounted() {
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    // 移除事件监听
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleOk() {
      if (this.name === '' || this.value === '') {
        showAlert(this.$t('dialog.paramItem.tip'));
        return;
      }

      // 更新本地参数项
      if (this.localParamItem) {
        this.localParamItem.name = this.name;
        this.localParamItem.value = this.value;
      } else {
        this.localParamItem = {
          name: this.name,
          value: this.value
        };
      }

      // 发出saveAfter事件
      this.$emit('saveAfter', {
        paramItem: this.localParamItem,
        operation: this.operation
      });

      this.handleClose();
    },
    handleClose() {
      this.$emit('update:visible', false);

      setTimeout(() => {
        this.name = '';
        this.value = '';
      }, 300);
    },
    // 键盘事件处理
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
