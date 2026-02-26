<template>
  <UDialog
    :title="$t('dialog.crosstab.title')"
    width="520px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-group">
          <label>{{ $t('dialog.crosstab.crosstab') }}：</label>

          <u-input
                  v-model="crosstabValue"
                  ref="input"
                  @keyup.enter="handleOk"
                  style="width: 380px"
                  :placeholder="$t('dialog.crosstab.tip')"
          />
      </div>
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

export default {
  name: 'CrosstabDialog',
  components: {
    UButton,
    UDialog,
    UInput,
  },
  data() {
    return {
      visible: false,
      crosstabValue: ''
    };
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
    show() {
      this.visible = true;
      this.crosstabValue = '';
    },
    handleOk() {
      this.$emit('saveAfter', this.crosstabValue);
      this.handleClose();
    },
    handleClose() {
      this.visible = false;
      // 清理数据，防止下次显示时保留旧值
      setTimeout(() => {
        this.crosstabValue = '';
      }, 300); // 等待动画完成
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
.tip-text {
  font-size: 12px;
  color: #4e4e4e;
  font-weight: normal;
}
</style>
