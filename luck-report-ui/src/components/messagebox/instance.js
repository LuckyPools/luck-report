import MessageBoxTemplate from './index.vue'
import Vue from 'vue'

import { isVNode } from '../utils'

const MessageBox = function(params) {
  const Instance = new Vue({
    render(h) {
      return h(MessageBoxTemplate, {
        params,
      })
    },
  })
  // 创建后需要挂载
  const component = Instance.$mount()
  // 全局通知函数，我们挂载到body元素上
  document.body.appendChild(component.$el)

  // 拿到该组件实例
  const message = component.$children[0]

  return {
    alert(params) {
      if (isVNode(params.message)) {
        message.$slots.default = params.message
        params.message = undefined
      } else {
        message.$slots.default = undefined
      }

      message.alert(params)
    },
    confirm(params) {
      if (isVNode(params.message)) {
        message.$slots.default = params.message
        params.message = undefined
      } else {
        message.$slots.default = undefined
      }
      message.alert(params)
    },
    prompt(params) {
      if (isVNode(params.message)) {
        message.$slots.default = params.message
        params.message = undefined
      } else {
        message.$slots.default = undefined
      }
      message.alert(params)
    },
  }
}

// messagebox单例
let msgboxInstance

/**
 * @description alert方法
 * @param {string} message
 * @param {string} title
 * @param {pbject} options
 */
MessageBox.alert = function(message, title, options) {
  const params = { type: 'alert', message, title, ...options }

  // 如果单例不存在，先初始化单例
  msgboxInstance = msgboxInstance || new MessageBox(params)

  return new Promise((resolve, reject) => {
    msgboxInstance.alert({
      ...params,
      resolve,
      reject,
    })
  })
}

/**
 * @description confirm
 * @param {string} message
 * @param {string} title
 * @param {pbject} options
 */
MessageBox.confirm = function(message, title, options) {
  const params = { type: 'confirm', message, title, ...options }

  // 如果单例不存在，先初始化单例
  msgboxInstance = msgboxInstance || new MessageBox(params)

  return new Promise((resolve, reject) => {
    msgboxInstance.confirm({
      ...params,
      resolve,
      reject,
    })
  })
}

MessageBox.prompt = function(message, title, options) {
  const params = { type: 'prompt', message, title, ...options }

  // 如果单例不存在，先初始化单例
  msgboxInstance = msgboxInstance || new MessageBox(params)

  return new Promise((resolve, reject) => {
    msgboxInstance.prompt({
      ...params,
      resolve,
      reject,
    })
  })
}

export default MessageBox
