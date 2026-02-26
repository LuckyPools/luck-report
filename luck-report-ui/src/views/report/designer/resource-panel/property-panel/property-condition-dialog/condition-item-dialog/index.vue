<template>
  <UDialog
    :title="title"
    width="500px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.conditionItem.itemName') }}：</label>
        <div class="u-inline">
          <u-input
              :placeholder="$t('dialog.conditionItem.nameTip')"
              v-model="name"
              ref="input"
              @keyup.enter="handleOk"
              @click.stop
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
  name: 'PropertyConditionItemDialog',
  components: {
    UButton,
    UDialog,
    UInput
  },
  props: {
    propertyConditions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      visible: false,
      name: '',
      conditionItem: null,
      operation: 'add' // 'add' or 'edit'
    };
  },
  computed: {
    title() {
      if (this.operation === 'add') {
        return this.$t('dialog.conditionItem.add');
      } else if (this.operation === 'edit') {
        return this.$t('dialog.conditionItem.edit');
      }
      return this.$t('dialog.conditionItem.title');
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
    show(conditionItem, operation) {
      this.visible = true;
      this.conditionItem = conditionItem;
      this.name = conditionItem.name || '';
      this.operation = operation || 'add';
      let that = this;
      // 确保DOM更新后聚焦输入框
      this.$nextTick(() => {
        if (that.$refs.input && that.$refs.input.focus) {
            that.$refs.input.focus();
            that.$refs.input.select();
        }
      });
    },
    handleOk() {
      if (!this.name.trim()) {
        showAlert(this.$t('dialog.conditionItem.nameTip'));
        return;
      }

      const isDuplicate = this.propertyConditions.some(item => {
        if (this.operation === 'edit' && item === this.conditionItem) {
          return false;
        }
        return item.name === this.name;
      });

      if (isDuplicate) {
        showAlert(this.$t('dialog.conditionItem.nameExists'));
        return;
      }

      // 更新条件项名称
      this.conditionItem.name = this.name;

      // 触发保存后事件
      this.$emit('saveAfter', {
        item: this.conditionItem,
        operation: this.operation
      });

      this.handleClose();
    },
    handleClose() {
      this.visible = false;

      setTimeout(() => {
        this.name = '';
        this.conditionItem = null;
        this.operation = 'add';
      }, 300);
    },
    // 键盘事件处理
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

