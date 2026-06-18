<script lang="ts">
/**
 * 画布上的拖拽项
 *
 * 改造要点：
 * 1. vuedraggable → vue-draggable-plus 的 VueDraggable
 * 2. u-row / u-col / u-form-item → a-row / a-col / a-form-item
 * 3. $listeners 改为 emit 显式
 * 4. $set 改为直接赋值
 * 5. nativeOnClick → onClick.stop
 * 6. setup 返回 render function（而不是 <component :is="h(...)" /> 模板），
 *    让 vue-draggable-plus 能稳定追踪到根 DOM，避免"拖入时永远落到第一行"
 *    以及"拖不进栅格 rowFormItem"的问题。
 *
 * 注意：必须用普通 <script> + defineComponent 形式，<script setup> 不支持顶层 return。
 */
import { defineComponent, h, type VNode } from 'vue'
import { FormItem, Row, Col } from 'ant-design-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import RenderField from '../utils/render'
import type { FormField, FormConf } from '../utils/types'

export default defineComponent({
  name: 'DraggableItem',
  props: {
    element: { type: Object as () => FormField, required: true },
    index: { type: Number, required: true },
    drawingList: { type: Array as () => FormField[], required: true },
    activeId: { type: Number, required: true },
    formConf: { type: Object as () => FormConf, required: true }
  },
  emits: {
    'active-item': (_el: FormField) => true,
    'copy-item': (_el: FormField, _parent?: FormField[]) => true,
    'delete-item': (_index: number, _parent: FormField[]) => true
  },
  setup(props, { emit }) {
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
        // ant-design-vue a-form-item 用 label-col 控制标签宽度，不识别 label-width 数值
        // 字段级 labelWidth 覆盖表单级 labelWidth；为空时不传 labelCol，让 a-form-item 从父级 a-form 继承
        const fieldLabelWidth = el.labelWidth !== undefined && el.labelWidth !== null
          ? Number(el.labelWidth)
          : null
        const formItemProps: Record<string, unknown> = {
          label: el.label,
          required: el.required
        }
        if (fieldLabelWidth !== null) {
          formItemProps.labelCol = { style: { width: `${fieldLabelWidth}px` } }
        }
        return h(
          Col,
          {
            span: el.span,
            class: finalClass,
            onClick: (e: MouseEvent) => {
              // #region debug-point switch-radio-unselectable
              if (el.tag === 'a-switch' || el.tag === 'a-radio-group') {
                // eslint-disable-next-line no-console
                console.log('[draggable-item][col onClick]', {
                  tag: el.tag,
                  target: (e.target as HTMLElement)?.tagName,
                  targetClass: (e.target as HTMLElement)?.className,
                  defaultValue: el.defaultValue
                })
              }
              // #endregion debug-point switch-radio-unselectable
              emit('active-item', el)
              e.stopPropagation()
            }
          },
          () => [
            h(
              FormItem,
              formItemProps,
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
                  modelValue: el.children ?? [],
                  'onUpdate:modelValue': (val: FormField[]) => {
                    console.log('[draggable-item][row onUpdate:modelValue] 触发', {
                      rowFormId: el.formId,
                      rowComponentName: el.componentName,
                      beforeLen: el.children?.length ?? 0,
                      beforeChildren: el.children?.map((c: FormField) => ({ formId: c.formId, tag: c.tag, label: c.label })),
                      afterLen: val.length,
                      afterChildren: val.map((c: FormField) => ({ formId: c.formId, tag: c.tag, label: c.label }))
                    })
                    if (!el.children) {
                      el.children = val
                    } else {
                      el.children.splice(0, el.children.length, ...val)
                    }
                    console.log('[draggable-item][row onUpdate:modelValue] 更新后', {
                      rowFormId: el.formId,
                      childrenLen: el.children?.length,
                      children: el.children?.map((c: FormField) => ({ formId: c.formId, tag: c.tag, label: c.label }))
                    })
                  },
                  animation: 340,
                  group: 'componentsGroup',
                  class: 'drag-wrapper',
                  draggable: '>*'
                },
                () => child
              ),
              ...itemBtns(el, index, parent)
            ]
          )
        ]
      )
    }

    // setup 返回 render function，让 vue-draggable-plus 拿到稳定的根 VNode
    return () => {
      if (props.element.layout === 'rowFormItem' && props.element.type === 'flex') {
        return h(
          Row,
          { type: props.element.type, justify: props.element.justify, align: props.element.align },
          () => [renderItem(props.element, props.index, props.drawingList)]
        )
      }
      return renderItem(props.element, props.index, props.drawingList)
    }
  }
})
</script>
