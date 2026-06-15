<template>
  <div class="u-tree-node" v-show="node.visible">
    <div class="u-tree-node-label">
      <span
        @click="handleExpand"
        class="u-tree-node-angle"
        :class="{ 'u-tree-node-angle-expand': node.expand }"
      >
        <i class="iconfont icon-right" v-if="showAngle" /> </span
      ><checkbox
        v-if="showCheckbox"
        :value="node.checked"
        :indeterminate="node.indeterminate"
        :disabled="node.disabled"
        class="u-tree-node-checkbox"
        @change="handleCheck"
      /><span class="u-tree-node-loading" v-if="lazy && loading"
        ><i class="iconfont icon-loading"/></span
      ><span class="u-tree-node-text" @click="handleExpand">
        <node-content :node="node" />
      </span>
    </div>
    <auto-height>
      <div
        class="u-tree-node-content"
        v-if="node.children && node.children.length > 0 && rendered"
        v-show="node.expand"
      >
        <u-tree-node
          :show-checkbox="showCheckbox"
          v-for="item in node.children"
          :level="level + 1"
          :key="item.value"
          :node="item"
          :lazy="lazy"
          :load="load"
          :nodeKey="nodeKey"
        >
        </u-tree-node>
      </div>
    </auto-height>
  </div>
</template>

<script>
import { setNodeChecked } from "./utils";
import { deepCopy } from "../utils";
import autoHeight from "./auto-height.vue";
import checkbox from "../checkbox";

import Emitter from "../mixins/emitter";

export default {
  name: "UTreeNode",
  components: {
    autoHeight,
    checkbox,
    nodeContent: {
      props: {
        // 提供给用户自定义内容时的节点信息
        node: {
          required: true
        }
      },
      render(h) {
        const { tree } = this.$parent;
        // 1.有自定义的作用域插槽-执行作用域插槽
        const defaultSlot = tree.$scopedSlots.default;

        if (defaultSlot) {
          return defaultSlot({ node: this, data: this.node });
        }

        // 2.有自定义render函数时，执行自定义render
        const renderContent = tree.renderContent;
        if (renderContent) {
          return renderContent(h, { node: this, data: this.node });
        }

        // 否则直接显示label
        return h("span", this.node.label);
      }
    }
  },
  mixins: [Emitter],
  data() {
    return {
      // 是否渲染，只有第一次
      rendered: true,
      loading: false
    };
  },
  props: {
    // 节点数据
    node: {
      default() {
        return {};
      }
    },
    // 节点是否可以被选择
    showCheckbox: {
      type: Boolean,
      default: false
    },
    // 子节点是否为懒加载
    lazy: {
      type: Boolean,
      default: false
    },
    // 懒加载函数
    load: {
      type: Function
    },
    level: {
      type: Number
    },
    nodeKey: {
      type: String,
      default: "value"
    }
  },
  computed: {
    // 是否显示展开/收起按钮
    showAngle() {
      return (
        (this.lazy && !this.node.isLeaf) ||
        (this.node.children && this.node.children.length > 0)
      );
    }
  },
  watch: {
    "node.children": {
      handler(newVal) {
        if (newVal) {
          // 选中状态计算
          this.calcChecked(newVal);
          // 显示/隐藏状态计算
          this.calcVisible(newVal);
        }
      },
      deep: true
    }
  },
  created() {
    this.dispatch("UTree", "on-tree-node-add", this);
  },
  methods: {
    /**
     * @description 是否需要展开
     */
    handleExpand() {
      // 按钮不存在或者正在loading时
      if (!this.showAngle || this.loading) {
        return;
      }

      if (this.lazy && !this.node.loaded) {
        this.loading = true;
        this.load(
          {
            level: this.level,
            ...this.node
          },
          data => {
            this.loading = false;
            this.$set(this.node, "loaded", true);
            // 空数据和空数组
            if (!data || data.length === 0) {
              this.$set(this.node, "isLeaf", true);
            } else {
              // 添加children属性
              this.$set(this.node, "children", deepCopy(data));
              if (this.node.checked) {
                this.handleCheck(true);
              }
              this.$nextTick(() => {
                this.$set(this.node, "expand", !this.node.expand);
              });
              this.dispatch("UTree", "on-tree-node-expand", this);
            }
          }
        );
      } else {
        if (this.node.children && this.node.children.length > 0) {
          this.$set(this.node, "expand", !this.node.expand);
          this.dispatch("UTree", "on-tree-node-expand", this);
        }
      }
    },
    /**
     * @description 是否被选中
     */
    handleCheck(checked) {
      this.$set(this.node, "checked", checked);
      this.dispatch("UTree", "on-tree-node-check", this, checked);

      // 处理自身及以下的选择状态
      setNodeChecked(this, this.node, checked);
    },
    /**
     * @description 选择状态计算
     */
    calcChecked(newVal) {
      // 全选判断
      const checkedAll = !newVal.some(item => !item.checked);
      // 不确定态判断
      const indeterminate = !!newVal.find(item => item.checked);

      // 全选状态下
      if (checkedAll) {
        this.$set(this.node, "checked", checkedAll);
        this.$set(this.node, "indeterminate", false);
      } else {
        this.$set(this.node, "checked", checkedAll);
        this.$set(this.node, "indeterminate", indeterminate);
      }
    },
    /**
     * @description 显示状态计算
     */
    calcVisible(newVal) {
      const visible = !!newVal.find(item => item.visible);

      this.$set(this.node, "visible", visible);
    }
  }
};
</script>
<style scoped>
.u-tree-node {
  font-size: 14px
}

.u-tree-node-label {
  height: 24px;
  line-height: 24px;
  display: flex;
  justify-content: left;
  align-items: center;
  cursor: pointer;
  transition: background-color .2s
}

.u-tree-node-label:hover {
  background-color: #f5f7f9
}

.u-tree-node-angle {
  display: inline-block;
  width: 24px;
  line-height: 24px;
  height: 24px;
  text-align: center;
  transition: transform .3s
}

.u-tree-node-angle-expand {
  transform: rotate(90deg)
}

.u-tree-node-content {
  padding-left: 18px;
  overflow: hidden;
  transition: height .3s
}

.u-tree-node-checkbox {
  height: auto;
  margin-right: 0;
  vertical-align: inherit
}

.u-tree-node-loading {
  margin-right: 5px;
  font-size: 12px
}

.u-tree-node-loading i:before {
  display: inline-block;
  animation: loading 1.5s linear infinite
}

.u-tree-empty {
  font-size: 13px;
  padding: 20px;
  text-align: center
}

</style>
