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
    visible: {
      type: Boolean,
      default: false
    },
    conditionItem: {
      type: Object,
      default: null
    },
    operation: {
      type: String,
      default: 'add'
    },
    propertyConditions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      name: '',
      localConditionItem: null
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
  watch: {
    visible(newVal) {
      if (newVal && this.conditionItem) {
        this.name = this.conditionItem.name || '';
        this.localConditionItem = { ...this.conditionItem };
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

      this.localConditionItem.name = this.name;

      this.$emit('saveAfter', {
        item: this.localConditionItem,
        operation: this.operation
      });

      this.handleClose();
    },
    handleClose() {
      this.$emit('close');
    },
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

