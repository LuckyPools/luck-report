<template>
  <a-modal
    :title="isRow ? $t('dialog.rowColNumber.insertRow') : $t('dialog.rowColNumber.insertCol')"
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
        :label="isRow ? $t('dialog.rowColNumber.rowCount') : $t('dialog.rowColNumber.colCount')"
        name="num"
      >
        <a-input-number
          :placeholder="$t('dialog.rowColNumber.tip')"
          v-model:value="formData.num"
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
 * RowColNumberDialog：插入行/列数量输入弹窗
 *
 * 工作流程：
 * 1. 父级（ContextMenu）通过 class.ts 创建 + 调用 show(callback, isRow)
 * 2. show 打开弹窗，回调保存到组件实例
 * 3. 用户在 a-input-number 中输入数字 → handleOk 校验后回调 → 关闭
 *
 * 调用方：
 * - src/views/report/designer/edit-table/row-col-number-dialog/class.ts（动态挂载 + 调 show）
 *
 * 迁移说明：
 * - Options API → vue3 Options API 简化版（保留 data/methods，减少 this 嵌套）
 * - UDialog/UButton/UInputNumber/UForm/UFormItem 替换为 ant-design-vue 对应组件
 * - slot="footer" → #footer
 * - $refs.form.validate(callback) → a-form 的 Promise 化 validate()
 */
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

/** show() 方法入参类型 */
export interface ShowOptions {
  callback: (num: number) => void
  isRow: boolean
}

export default defineComponent({
  name: 'RowColNumberDialog',
  setup() {
    const { t } = useI18n()
    return {
      t
    }
  },
  data() {
    return {
      visible: false,
      formData: { num: 1 },
      rules: {
        num: [{
          required: true,
          type: 'number',
          message: this.t('dialog.rowColNumber.numValidate'),
          trigger: 'blur'
        }]
      },
      isRow: false,
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
     * @param callback 确认后的回调，参数为输入数字
     * @param isRow true=行操作；false=列操作
     */
    show(callback: (num: number) => void, isRow: boolean): void {
      this.visible = true
      this.formData.num = 1
      this.isRow = !!isRow
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
      const numValue = parseInt(String(this.formData.num))
      if (typeof this.callback === 'function') {
        this.callback(numValue)
      }
      this.handleClose()
    },

    /**
     * 关闭弹窗 + 清理 callback（保留 300ms 防止动画期间回调被重置）
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
     * @param e 键盘事件
     */
    handleKeydown(e: KeyboardEvent): void {
      if (this.visible && e.key === 'Escape') {
        this.handleClose()
      }
    }
  }
})
</script>
