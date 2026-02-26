<template>
  <UDialog
    :title="dialogTitle"
    width="500px"
    :visible="visible"
    :z-index="10000"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.mapping.key') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="mappingItem.value"
            :placeholder="$t('dialog.mapping.keyPlaceholder')"
          />
        </div>
      </div>
      <div class="form-group">
        <label>{{ $t('dialog.mapping.value') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="mappingItem.label"
            :placeholder="$t('dialog.mapping.valuePlaceholder')"
          />
        </div>
      </div>
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
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";

export default {
  name: 'MappingDialog',
  components: {
    UButton,
    UDialog,
    UInput
  },
  data() {
    return {
      visible: false,
      operation: 'add', // 'add' or 'edit'
      mappingItem: {
        value: '',
        label: ''
      },
      originalMappingItem: null
    };
  },
  computed: {
    dialogTitle() {
      return this.operation === 'add' ? this.$t('dialog.mapping.add') : this.$t('dialog.mapping.edit');
    }
  },
  methods: {
    show(mappingItem, op) {
      this.visible = true;
      this.operation = op || 'add';

      // 创建映射项的副本以避免直接修改原始对象
      this.mappingItem = {
        value: mappingItem.value || '',
        label: mappingItem.label || ''
      };

      // 保存原始映射项的引用，用于保存时更新
      this.originalMappingItem = mappingItem;
    },
    handleSave() {
      if (this.mappingItem.value === '' || this.mappingItem.label === '') {
        showAlert(this.$t('dialog.mapping.tip'));
        return;
      }

      this.originalMappingItem.value = this.mappingItem.value;
      this.originalMappingItem.label = this.mappingItem.label;

      // 触发保存后事件
      this.$emit('saveAfter');

      this.handleClose();
    },
    handleClose() {
      this.visible = false;

      // 清理数据
      setTimeout(() => {
        this.mappingItem = {
          value: '',
          label: ''
        };
        this.originalMappingItem = null;
      }, 300); // 等待动画完成
    }
  }
};
</script>
<style scoped>
</style>
