<script>
import draggable from 'vuedraggable'
import render from '../utils/render'
import URow from '@/components/row/index.vue'
import UCol from '@/components/col/index.vue'
import UFormItem from '@/components/form-item/index.vue'

const components = {
  itemBtns(h, element, index, parent) {
    const { copyItem, deleteItem } = this.$listeners
    return [
      <span class="drawing-item-copy" title={this.$t('searchForm.copy')} onClick={event => {
        copyItem(element, parent); event.stopPropagation()
      }}>
        <i class="iconfont icon-share" />
      </span>,
      <span class="drawing-item-delete" title={this.$t('searchForm.delete')} onClick={event => {
        deleteItem(index, parent); event.stopPropagation()
      }}>
        <i class="iconfont icon-delete" />
      </span>
    ]
  }
}
const layouts = {
  colFormItem(h, element, index, parent) {
    const { activeItem } = this.$listeners
    let className = this.activeId === element.formId ? 'drawing-item active-from-item' : 'drawing-item'
    if (this.formConf.unFocusedComponentBorder) className += ' unfocus-bordered';
    return (
      <u-col span={element.span} class={className}
        nativeOnClick={event => { activeItem(element); event.stopPropagation() }}>
        <u-form-item label-width={element.labelWidth ? Number(element.labelWidth) : null}
          label={element.label} required={element.required}>
          <render key={element.renderKey} conf={element} onInput={ event => {
            const value = Array.isArray(event) ? event.join(',') : event
            this.$set(element, 'defaultValue', value)
          }} />
        </u-form-item>
        {components.itemBtns.apply(this, arguments)}
      </u-col>
    )
  },
  rowFormItem(h, element, index, parent) {
    const { activeItem } = this.$listeners
    const className = this.activeId === element.formId ? 'drawing-row-item active-from-item' : 'drawing-row-item'
    let child = renderChildren.apply(this, arguments)
    if (element.type === 'flex') {
      child = <u-row type={element.type} justify={element.justify} align={element.align}>
              {child}
            </u-row>
    }
    return (
      <u-col span={element.span}>
        <u-row gutter={element.gutter} class={className}
          nativeOnClick={event => { activeItem(element); event.stopPropagation() }}>
          <span class="component-name">{element.componentName}</span>
          <draggable list={element.children} animation={340} group="componentsGroup" class="drag-wrapper">
            {child}
          </draggable>
          {components.itemBtns.apply(this, arguments)}
        </u-row>
      </u-col>
    )
  }
}

function renderChildren(h, element, index, parent) {
  if (!Array.isArray(element.children)) return null
  return element.children.map((el, i) => {
    const layout = layouts[el.layout]
    if (layout) {
      return layout.call(this, h, el, i, element.children)
    }
    return layoutIsNotFound()
  })
}

function layoutIsNotFound() {
  throw new Error(this.$t('searchForm.layoutNotFound', { layout: this.element.layout }))
}

export default {
  components: {
    render,
    draggable,
    URow,
    UCol,
    UFormItem
  },
  props: [
    'element',
    'index',
    'drawingList',
    'activeId',
    'formConf'
  ],
  render(h) {
    const layout = layouts[this.element.layout]

    if (layout) {
      return layout.call(this, h, this.element, this.index, this.drawingList)
    }
    return layoutIsNotFound()
  }
}
</script>
