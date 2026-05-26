<template>
  <UDialog
    :title="$t('dialog.crosstab.title')"
    width="520px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <u-form ref="form" :label-width="60">
        <u-form-item :label="$t('dialog.crosstab.crosstab')">
          <u-input
            v-model="crosstabValue"
            ref="input"
            style="width: 300px"
            :placeholder="$t('dialog.crosstab.tip')"
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
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'CrosstabDialog',
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
    }
  },
  data() {
    return {
      crosstabValue: ''
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.crosstabValue = '';
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
      this.$emit('saveAfter', this.crosstabValue);
      this.handleClose();
    },
    handleClose() {
      this.$emit('close');
      this.crosstabValue = '';
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
