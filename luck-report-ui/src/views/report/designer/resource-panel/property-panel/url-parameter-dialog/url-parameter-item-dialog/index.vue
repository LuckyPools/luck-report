<template>
  <UDialog
    :title="title"
    width="600px"
    :visible="visible"
    :z-index="20010"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.paramItem.name') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="name"
            ref="nameInput"
            style="width: 350px;"
            @keyup.enter="handleOk"
          />
        </div>
      </div>
      <div class="form-group">
        <label>{{ $t('dialog.paramItem.expr') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="value"
            ref="valueInput"
            style="width: 350px;"
            @keyup.enter="handleOk"
          />
        </div>
      </div>
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

export default {
  name: 'URLParameterItemDialog',
  components: {
    UButton,
    UDialog,
    UInput
  },
  emits: ['saveAfter'],
  data() {
    return {
      visible: false,
      name: '',
      value: '',
      operation: '',
      paramItem: null
    };
  },
  computed: {
    title() {
      return this.operation === 'add' ? this.$t('dialog.paramItem.add') : this.$t('dialog.paramItem.edit');
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
    show(paramItem, operation) {
      this.visible = true;
      this.paramItem = paramItem;
      this.name = paramItem.name || '';
      this.value = paramItem.value || '';
      this.operation = operation || 'add';
    },
    handleOk() {
      if (this.name === '' || this.value === '') {
        showAlert(this.$t('dialog.paramItem.tip'));
        return;
      }

      // 更新参数项
      if (this.paramItem) {
        this.paramItem.name = this.name;
        this.paramItem.value = this.value;
      }

      // 发出saveAfter事件
      this.$emit('saveAfter', {
        paramItem: this.paramItem,
        operation: this.operation
      });

      this.handleClose();
    },
    handleClose() {
      this.visible = false;

      setTimeout(() => {
        this.name = '';
        this.value = '';
        this.operation = '';
        this.paramItem = null;
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
