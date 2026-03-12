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
            v-model="localMappingItem.value"
            :placeholder="$t('dialog.mapping.keyPlaceholder')"
          />
        </div>
      </div>
      <div class="form-group">
        <label>{{ $t('dialog.mapping.value') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="localMappingItem.label"
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
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mappingItem: {
      type: Object,
      default: () => ({
        value: '',
        label: ''
      })
    },
    operation: {
      type: String,
      default: 'add'
    }
  },
  data() {
    return {
      localMappingItem: {
        value: '',
        label: ''
      }
    };
  },
  computed: {
    dialogTitle() {
      return this.operation === 'add' ? this.$t('dialog.mapping.add') : this.$t('dialog.mapping.edit');
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.localMappingItem = {
          value: this.mappingItem.value || '',
          label: this.mappingItem.label || ''
        };
      }
    }
  },
  methods: {
    handleSave() {
      if (this.localMappingItem.value === '' || this.localMappingItem.label === '') {
        showAlert(this.$t('dialog.mapping.tip'));
        return;
      }

      this.$emit('save', {
        value: this.localMappingItem.value,
        label: this.localMappingItem.label
      });

      this.handleClose();
    },
    handleClose() {
      this.$emit('update:visible', false);

      this.localMappingItem = {
        value: '',
        label: ''
      };
    }
  }
};
</script>
<style scoped>
</style>
