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
      name: ''
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
        this.name = this.groupItem?.name || '';
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
    handleOk() {
      if (!this.name.trim()) {
        showAlert(this.$t('dialog.groupItem.nameTip'));
        return;
      }

      const updatedGroupItem = this.groupItem ? { ...this.groupItem, name: this.name } : null;

      this.$emit('saveAfter', {
        operation: this.operation,
        groupItem: updatedGroupItem
      });

      this.handleClose();
    },
    handleClose() {
      this.$emit('update:visible', false);
    },
    handleClosed() {
      this.name = '';
    },
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
