<template>
  <a-modal
    :title="isRow ? t('dialog.rowColNumber.insertRow') : t('dialog.rowColNumber.insertCol')"
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
        :label="isRow ? t('dialog.rowColNumber.rowCount') : t('dialog.rowColNumber.colCount')"
        name="num"
      >
        <a-input-number
          :placeholder="t('dialog.rowColNumber.tip')"
          v-model:value="formData.num"
          :min="1"
          style="width: 100%"
          @press-enter="handleOk"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
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
 * - Options API → vue3 Composition API（setup + ref/reactive）
 * - UDialog/UButton/UInputNumber/UForm/UFormItem 替换为 ant-design-vue 对应组件
 * - slot="footer" → #footer
 * - $refs.form.validate(callback) → a-form 的 Promise 化 validate()
 * - i18n 字段提前到 setup 顶部，避免在 data() 中访问 this.t
 */
import { defineComponent, ref, reactive, onMounted, onBeforeUnmount } from 'vue'
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
    // i18n 文案提前在 setup 中求值，避免在 reactive 规则中访问 this
    const numValidateMsg = t('dialog.rowColNumber.numValidate')

    const visible = ref(false)
    const isRow = ref(false)
    // 模板 ref
    const formRef = ref()
    // 表单数据 + 校验规则
    const formData = reactive({ num: 1 })
    const rules = {
      num: [{
        required: true,
        type: 'number',
        message: numValidateMsg,
        trigger: 'blur'
      }]
    }
    // 父级 show() 传入的回调
    let callback: ((num: number) => void) | null = null

    /**
     * 显示弹窗
     * @param cb 确认后的回调，参数为输入数字
     * @param row true=行操作；false=列操作
     */
    const show = (cb: (num: number) => void, row: boolean): void => {
      visible.value = true
      formData.num = 1
      isRow.value = !!row
      callback = cb
    }

    /**
     * 异步校验表单
     * @returns 校验通过返回 true，否则返回 false
     */
    const validateForm = async (): Promise<boolean> => {
      try {
        await (formRef.value as { validate: () => Promise<void> }).validate()
        return true
      } catch {
        return false
      }
    }

    /**
     * 确认按钮：校验通过后回调 + 关闭
     */
    const handleOk = async (): Promise<void> => {
      const valid = await validateForm()
      if (!valid) return
      const numValue = parseInt(String(formData.num))
      if (typeof callback === 'function') {
        callback(numValue)
      }
      handleClose()
    }

    /**
     * 关闭弹窗 + 清理 callback（保留 300ms 防止动画期间回调被重置）
     */
    const handleClose = (): void => {
      const ref = formRef.value as { resetFields?: () => void } | undefined
      if (ref && typeof ref.resetFields === 'function') {
        ref.resetFields()
      }
      visible.value = false
      setTimeout(() => {
        callback = null
      }, 300)
    }

    /**
     * 键盘事件：Esc 关闭
     * @param e 键盘事件
     */
    const handleKeydown = (e: KeyboardEvent): void => {
      if (visible.value && e.key === 'Escape') {
        handleClose()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      t,
      visible,
      isRow,
      formData,
      rules,
      formRef,
      show,
      handleOk,
      handleClose
    }
  }
})
</script>
