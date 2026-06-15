<template>
  <a-modal
    :title="t('dialog.crosstab.title')"
    width="520px"
    :open="visible"
    @cancel="handleClose"
    @ok="handleOk"
  >
    <div class="dialog-content">
      <a-form ref="form" :label-col="{ style: { width: '60px' } }">
        <a-form-item :label="t('dialog.crosstab.crosstab')">
          <a-input
            v-model:value="crosstabValue"
            ref="input"
            style="width: 300px"
            :placeholder="t('dialog.crosstab.tip')"
            @keyup.enter="handleOk"
          />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  name: 'CrosstabDialog',
  setup() {
    return { t: useI18n().t };
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
  beforeUnmount() {
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
