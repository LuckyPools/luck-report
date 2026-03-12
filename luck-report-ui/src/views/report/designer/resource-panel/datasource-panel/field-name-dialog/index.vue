<template>
  <UDialog
    :title="$t('tree.addField')"
    width="400px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form :label-width="100">
        <u-form-item :label="$t('tree.fieldName')">
          <u-input
            :placeholder="$t('tree.inputTip')"
            v-model="fieldName"
            ref="input"
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
  name: 'FieldNameDialog',
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
    dataset: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      fieldName: ''
    };
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.fieldName = '';
      }
    }
  },
  methods: {
    handleOk() {
      const fieldNameValue = this.fieldName.trim();
      if (!fieldNameValue) {
        showAlert(this.$t('tree.inputTip'));
        return;
      }
      this.$emit('save', fieldNameValue, this.dataset);
      this.$emit('close');
    },
    handleClose() {
      this.$emit('close');
      setTimeout(() => {
        this.fieldName = '';
      }, 300);
    },
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  },
};
</script>

<style scoped>

</style>
