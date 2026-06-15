<template>
  <div class="u-message">
    <transition-group name="slide">
      <div
          class="u-message-cell"
          :class="{ [`u-message-cell-${item.type}`]: true }"
          v-for="item in messageList"
          :key="item.key"
          :style="{ top: `${item.top}px` }"
          :ref="item.key"
      >
        <i
            class="u-message-cell-icon iconfont"
            :class="{ [`icon-${item.type}`]: true }"
        />

        <div
            class="u-message-cell-text"
            v-if="item.useHTMLString"
            v-html="item.message"
        ></div>
        <div class="u-message-cell-text" v-else>
          {{ item.message }}
        </div>
        <i
            v-if="item.showClose"
            class="u-message-cell-close iconfont icon-close"
            @click="remove(item.key)"
        />
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'UMessage',
  data() {
    return {
      // 消息列表
      messageList: [],
      offsetTop: 20, // 当前消息的基础偏移量
    }
  },
  methods: {
    /**
     * @description 添加新消息
     * @param {object} 消息提示的参数
     */
    add(params) {
      /*
        用随机数来生成一个不重复的key
        一方面是transition-group需要key
        另一个是作为删除时的遍历依据
      */
      const key = `i-need-key-by-random-${Math.random()}`
      const { duration, message, showClose, type, useHTMLString } = params

      this.messageList.push({
        message: message,
        showClose,
        useHTMLString,
        type: type || 'info',
        top: this.offsetTop,
        key,
      })

      this.$nextTick(() => {
        this.offsetTop += this.$refs[key][0].clientHeight + 20
      })

      // 持续时间，传0则不关闭
      if (duration !== 0) {
        setTimeout(() => {
          this.remove(key)
        }, duration || 3000)
      }
    },
    /**
     * @description 移除消息
     */
    remove(key) {
      const index = this.messageList.findIndex((cell) => cell.key === key)
      const height = this.$refs[key][0].clientHeight + 20
      this.offsetTop -= height

      this.messageList.splice(index, 1)
      this.messageList.forEach((cell, i) => {
        if (i >= index) {
          cell.top -= height
        }
      })
    },
  },
}
</script>
<style scoped>

.u-message {
  z-index: 1000;
  position: absolute;
  left: 0;
  top: 0
}

.u-message-cell {
  position: fixed;
  left: calc(50% - 200px);
  top: 40px;
  box-sizing: border-box;
  width: 400px;
  padding: 15px 10px 15px 15px;
  background-color: #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center
}

.u-message-cell-icon {
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  margin-right: 10px
}

.u-message-cell-text {
  font-size: 14px;
  margin-right: 10px
}

.u-message-cell-close {
  width: 20px;
  height: 20px;
  line-height: 20px;
  margin-left: auto;
  cursor: pointer;
  color: #888
}

.u-message-cell-close:hover {
  color: #000
}

.u-message-cell-success {
  background-color: #eef8e9;
  border-color: #67c23a;
  color: #67c23a
}

.u-message-cell-warning {
  background-color: #faedda;
  border-color: #e6a23c;
  color: #e6a23c
}

.u-message-cell-error {
  background-color: #fde3e3;
  border-color: #f56c6c;
  color: #f56c6c
}
</style>
