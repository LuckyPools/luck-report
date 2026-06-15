<template>
  <a-modal
    :title="isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight')"
    :open="visible"
    :width="400"
    :destroy-on-close="true"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 14 }"
      style="margin-top: 16px"
    >
      <a-form-item
        :label="isCol ? $t('dialog.rowColWidthHeight.colWidth') : $t('dialog.rowColWidthHeight.rowHeight')"
        name="value"
      >
        <a-input-number
          :placeholder="$t('dialog.rowColWidthHeight.tip')"
          v-model:value="formData.value"
          :min="1"
          style="width: 100%"
          @press-enter="handleOk"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ $t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script lang="ts">
/**
 * RowColWidthHeightDialog：行高/列宽输入弹窗
 *
 * 工作流程：
 * 1. 父级（ContextMenu）通过 class.ts 创建 + 调用 show(callback, value, isCol)
 * 2. show 打开弹窗并预填当前选中区域的高度/宽度
 * 3. 用户在 a-input-number 中输入新值 → handleOk 校验后回调 → 关闭
 *
 * 调用方：
 * - src/views/report/designer/edit-table/row-col-width-height-dialog/class.ts（动态挂载）
 *
 * 迁移说明：
 * - Options API → vue3 Options API 简化版
 * - UDialog/UButton/UInputNumber/UForm/UFormItem → ant-design-vue 对应组件
 * - slot="footer" → #footer
 */
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'RowColWidthHeightDialog',
  setup() {
    const { t } = useI18n()
    return { t }
  },
  data() {
    return {
      visible: false,
      formData: { value: '' as number | string },
      rules: {
        value: [{
          required: true,
          type: 'number',
          message: this.t('dialog.rowColWidthHeight.numValidate'),
          trigger: 'blur'
        }]
      },
      isCol: false,
      callback: null as ((num: number) => void) | null
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    /**
     * 显示弹窗
     * @param callback 确认后的回调
     * @param value 初始值（当前单元格的高度/宽度）
     * @param isCol true=列宽；false=行高
     */
    show(callback: (num: number) => void, value: number | string, isCol: boolean): void {
      this.visible = true
      this.formData.value = value || ''
      this.isCol = !!isCol
      this.callback = callback
    },

    /**
     * 异步校验表单
     * @returns 校验通过返回 true，否则返回 false
     */
    async validateForm(): Promise<boolean> {
      try {
        await (this.$refs.formRef as { validate: () => Promise<void> }).validate()
        return true
      } catch {
        return false
      }
    },

    /**
     * 确认按钮：校验通过后回调 + 关闭
     */
    async handleOk(): Promise<void> {
      const valid = await this.validateForm()
      if (!valid) return
      const numValue = parseInt(String(this.formData.value))
      if (typeof this.callback === 'function') {
        this.callback(numValue)
      }
      this.handleClose()
    },

    /**
     * 关闭弹窗 + 清理 callback
     */
    handleClose(): void {
      const formRef = this.$refs.formRef as { resetFields?: () => void } | undefined
      if (formRef && typeof formRef.resetFields === 'function') {
        formRef.resetFields()
      }
      this.visible = false
      setTimeout(() => {
        this.callback = null
      }, 300)
    },

    /**
     * 键盘事件：Esc 关闭
     */
    handleKeydown(e: KeyboardEvent): void {
      if (this.visible && e.key === 'Escape') {
        this.handleClose()
      }
    }
  }
})
</script>
