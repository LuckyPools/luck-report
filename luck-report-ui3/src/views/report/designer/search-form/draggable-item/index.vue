<script setup lang="ts">
/**
 * 画布上的拖拽项
 *
 * 改造要点：
 * 1. vuedraggable → vue-draggable-plus 的 VueDraggable
 * 2. u-row / u-col / u-form-item → a-row / a-col / a-form-item
 * 3. $listeners 改为 emit 显式
 * 4. $set 改为直接赋值
 * 5. nativeOnClick → onClick.stop
 */
import { h, type VNode } from 'vue'
import { FormItem, Row, Col } from 'ant-design-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import RenderField from '../utils/render'
import type { FormField, FormConf } from '../utils/types'

const props = defineProps<{
  element: FormField
  index: number
  drawingList: FormField[]
  activeId: number
  formConf: FormConf
}>()

const emit = defineEmits<{
  (e: 'active-item', el: FormField): void
  (e: 'copy-item', el: FormField, parent?: FormField[]): void
  (e: 'delete-item', index: number, parent: FormField[]): void
}>()

const { t } = useI18n()

function itemBtns(el: FormField, index: number, parent: FormField[]): VNode[] {
  return [
    h(
      'span',
      {
        class: 'drawing-item-copy',
        title: t('searchForm.copy') as string,
        onClick: (e: MouseEvent) => {
          emit('copy-item', el, parent)
          e.stopPropagation()
        }
      },
      [h('i', { class: 'iconfont icon-share' })]
    ),
    h(
      'span',
      {
        class: 'drawing-item-delete',
        title: t('searchForm.delete') as string,
        onClick: (e: MouseEvent) => {
          // 使用本层级在 parent 中的下标，而非 props.index（顶层下标）
          emit('delete-item', index, parent)
          e.stopPropagation()
        }
      },
      [h('i', { class: 'iconfont icon-delete' })]
    )
  ]
}

function renderChildren(el: FormField): VNode[] {
  if (!Array.isArray(el.children)) return []
  return el.children.map((child, i) => renderItem(child, i, el.children!))
}

function renderItem(el: FormField, index: number, parent: FormField[]): VNode {
  if (el.layout === 'colFormItem') {
    const className =
      props.activeId === el.formId ? 'drawing-item active-from-item' : 'drawing-item'
    const finalClass = props.formConf.unFocusedComponentBorder
      ? className + ' unfocus-bordered'
      : className
    return h(
      Col,
      {
        span: el.span,
        class: finalClass,
        onClick: (e: MouseEvent) => {
          emit('active-item', el)
          e.stopPropagation()
        }
      },
      () => [
        h(
          FormItem,
          {
            labelWidth: el.labelWidth ? Number(el.labelWidth) : null,
            label: el.label,
            required: el.required
          },
          () => [
            h(RenderField, {
              key: el.__key,
              conf: el,
              modelValue: el.defaultValue,
              'onUpdate:modelValue': (val: unknown) => {
                el.defaultValue = val
              }
            })
          ]
        ),
        ...itemBtns(el, index, parent)
      ]
    )
  }

  // rowFormItem
  const className2 =
    props.activeId === el.formId ? 'drawing-row-item active-from-item' : 'drawing-row-item'
  const child = renderChildren(el)
  return h(
    Col,
    { span: el.span },
    () => [
      h(
        Row,
        {
          gutter: el.gutter,
          class: className2,
          onClick: (e: MouseEvent) => {
            emit('active-item', el)
            e.stopPropagation()
          }
        },
        () => [
          h('span', { class: 'component-name' }, el.componentName),
          h(
            VueDraggable,
            {
              modelValue: el.children,
              'onUpdate:modelValue': (val: FormField[]) => {
                el.children = val
              },
              animation: 340,
              group: 'componentsGroup',
              class: 'drag-wrapper'
            },
            () => child
          ),
          ...itemBtns(el, index, parent)
        ]
      )
    ]
  )
}
</script>

<template>
  <component
    :is="
      element.layout === 'rowFormItem' && element.type === 'flex'
        ? h(
            Row,
            { type: element.type, justify: element.justify, align: element.align },
            () => [renderItem(element, index, drawingList)]
          )
        : renderItem(element, index, drawingList)
    "
  />
</template>
