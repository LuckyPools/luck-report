<template>
  <UDialog
    :title="dialogTitle"
    width="400px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
    @closed="handleClosed"
  >
    <div class="dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.groupItem.name') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="name"
            ref="nameInput"
            @keyup.enter="handleOk"
            style="width:240px;"
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
  name: 'GroupItemDialog',
  components: {
    UButton,
    UDialog,
    UInput
  },
  data() {
    return {
      visible: false,
      name: '',
      operation: 'add', // 'add' or 'edit'
      groupItem: null
    };
  },
  computed: {
    dialogTitle() {
      return this.operation === 'add'
        ? this.$t('dialog.groupItem.addItem')
        : this.$t('dialog.groupItem.editItem');
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
    show(groupItem, op) {
      this.groupItem = groupItem;
      this.operation = op || 'add';
      this.name = groupItem.name || '';
      this.visible = true;
    },
    handleOk() {
      if (!this.name.trim()) {
        showAlert(this.$t('dialog.groupItem.nameTip'));
        return;
      }

      if (this.groupItem) {
        this.groupItem.name = this.name;
      }

      // 触发 saveAfter 事件，传递操作类型和分组项数据
      this.$emit('saveAfter', {
        operation: this.operation,
        groupItem: this.groupItem
      });

      this.handleClose();
    },
    handleClose() {
      this.visible = false;
    },
    handleClosed() {
      this.name = '';
      this.groupItem = null;
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
