import Vue from 'vue'
import Loading from './index.vue'

const Mask = Vue.extend(Loading)

const LoadingDirective = {
  /**
   * @description 只调用一次，指令第一次绑定到元素时调用。在这里可以进行一次性的初始化设置
   * @param {*} el 指令所绑定的元素，可以用来直接操作 DOM。
   * @param {*} binding 里面包含事件信息
   * @param {*} vnode Vue 编译生成的虚拟节点
   * @param {*} oldNode 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用
   */
  bind: (el, binding, vnode, oldNode) => {
    // 创建loading实例，将实例挂到el上
    el.mask = new Mask({
      el: document.createElement('DIV'),
    })
  },
  /**
   * @description 被绑定元素插入父节点时调用
   * @param {*} el 指令所绑定的元素，可以用来直接操作 DOM。
   * @param {*} binding 里面包含事件信息
   * @param {*} vnode Vue 编译生成的虚拟节点
   * @param {*} oldNode 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用
   */
  inserted: (el, binding, vnode, oldNode) => {
    // 第一步：判断被绑定的元素position属性是否为static，若是，则改变为relative
    const position = getComputedStyle(el, null).getPropertyValue('position')
    if (!position || position === 'static') {
      el.style.position = 'relative'
    }

    // 自定义text和背景色
    el.mask.text = el.getAttribute('os-loading-text')
    el.mask.bgColor = el.getAttribute('os-loading-background')
    el.mask.fullscreen = binding.modifiers.fullscreen

    el.parentDom = binding.modifiers.fullscreen ? document.body : el

    // 第二步：判断binding.value是否为true，若是则显示loading
    if (binding.value) {
      el.parentDom.classList.add('u-loading-parent')
      el.parentDom.appendChild(el.mask.$el)
    }
  },
  /**
   * @description 所在组件的 VNode 更新时调用
   * @param {*} el 指令所绑定的元素，可以用来直接操作 DOM。
   * @param {*} binding 里面包含事件信息
   * @param {*} vnode Vue 编译生成的虚拟节点
   * @param {*} oldNode 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用
   */
  update: (el, binding, vnode, oldNode) => {
    el.mask.text = el.getAttribute('os-loading-text')
    el.mask.bgColor = el.getAttribute('os-loading-background')

    // VNode更新时，根据参数值控制mask的显示隐藏
    if (binding.value) {
      el.parentDom.appendChild(el.mask.$el)
      el.parentDom.classList.add('u-loading-parent')
    } else {
      el.parentDom.classList.remove('u-loading-parent')
      el.mask.$el.remove()
    }
  },
  /**
   * @description 只调用一次，指令与元素解绑时调用
   * @param {*} el 指令所绑定的元素，可以用来直接操作 DOM。
   * @param {*} binding 里面包含事件信息
   * @param {*} vnode Vue 编译生成的虚拟节点
   * @param {*} oldNode 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用
   */
  unbind: (el, binding, vnode, oldNode) => {
    // 记得在指令移除时，删除相关实例
    el.mask.$el.remove()
    el.mask.$destroy()
  },
}

// 服务形式的loading
const showLoading = (options) => {
  const mask = new Mask({
    el: document.createElement('div'),
    data: {
      ...options,
      fullscreen: true
    },
  })
  document.body.classList.add('u-loading-parent')
  document.body.appendChild(mask.$el)

  // 提供关闭方法
  return {
    close: () => {
      document.body.classList.remove('u-loading-parent')
      mask.$el.remove()
      mask.$destroy()
    },
  }
}

export { LoadingDirective }

export default showLoading
