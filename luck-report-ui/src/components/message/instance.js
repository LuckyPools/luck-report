import Message from './index.vue'
import Vue from 'vue'

/**
 * @description 消息通知的实例创建函数
 * @param {object} params 创建实例时的参数
 */
Message.newInstance = (params = {}) => {
  // 组件实例创建
  const Instance = new Vue({
    render(h) {
      return h(Message, {
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
    add(_message) {
      message.add(_message)
    },
  }
}

//
let messageInstance
/**
 * @description 导出使用方法
 */
const showMessage = (_message) => {
  // 单例模式核心代码，判断单例是否存在，若不存在则创建
  messageInstance = messageInstance || Message.newInstance()
  messageInstance.add(_message)
}

/**
 * @description 4种增强型的消息使用方式
 */
['info', 'success', 'warning', 'error'].forEach((key) => {
  showMessage[key] = (string) => {
    messageInstance = messageInstance || Message.newInstance()
    messageInstance.add({
      message: string,
      type: key,
    })
  }
})

export default showMessage
