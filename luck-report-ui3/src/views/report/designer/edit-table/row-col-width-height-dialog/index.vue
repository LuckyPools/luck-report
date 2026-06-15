<template>
  <a-modal
    :title="isCol ? t('dialog.rowColWidthHeight.colWidth') : t('dialog.rowColWidthHeight.rowHeight')"
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
        :label="isCol ? t('dialog.rowColWidthHeight.colWidth') : t('dialog.rowColWidthHeight.rowHeight')"
        name="value"
      >
        <a-input-number
          :placeholder="t('dialog.rowColWidthHeight.tip')"
          v-model:value="formData.value"
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
 * - Options API → vue3 Composition API
 * - UDialog/UButton/UInputNumber/UForm/UFormItem → ant-design-vue 对应组件
 * - slot="footer" → #footer
 * - i18n 字段提前到 setup 顶部，避免在 data() 中访问 this.t
 */
import { defineComponent, ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'RowColWidthHeightDialog',
  setup() {
    const { t } = useI18n()
    // i18n 文案提前在 setup 中求值，避免在 reactive 规则中访问 this
    const numValidateMsg = t('dialog.rowColWidthHeight.numValidate')

    const visible = ref(false)
    const isCol = ref(false)
    // 模板 ref
    const formRef = ref()
    // 表单数据 + 校验规则
    const formData = reactive<{ value: number | string }>({ value: '' })
    const rules = {
      value: [{
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
     * @param cb 确认后的回调
     * @param value 初始值（当前单元格的高度/宽度）
     * @param col true=列宽；false=行高
     */
    const show = (cb: (num: number) => void, value: number | string, col: boolean): void => {
      visible.value = true
      formData.value = value || ''
      isCol.value = !!col
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
      const numValue = parseInt(String(formData.value))
      if (typeof callback === 'function') {
        callback(numValue)
      }
      handleClose()
    }

    /**
     * 关闭弹窗 + 清理 callback
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
      isCol,
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
