<template>
  <div class="u-tree">
    <tree-node
      v-for="item in copyData"
      :key="item.value"
      :node="item"
      :show-checkbox="showCheckbox"
      :lazy="lazy"
      :level="1"
      :load="load"
      :nodeKey="nodeKey"
    >
    </tree-node>
    <div class="u-tree-empty" v-if="!hasData">
      {{ emptyText }}
    </div>
  </div>
</template>

<script>
import { deepCopy } from "../utils";

import Emitter from "../mixins/emitter";
import treeNode from "./tree-node.vue";

export default {
  components: {
    treeNode
  },
  name: "UTree",
  mixins: [Emitter],
  data() {
    return {
      // 子节点列表
      nodes: [],
      copyData: []
    };
  },
  props: {
    // 树的数据
    data: {
      type: Array,
      default: () => []
    },
    // 节点是否可以被选择
    showCheckbox: {
      type: Boolean,
      default: false
    },
    // 节点是否为懒加载
    lazy: {
      type: Boolean,
      default: false
    },
    // 懒加载函数
    load: {
      type: Function
    },
    // 默认展开的节点
    defaultExpandedKeys: {
      type: Array,
      default() {
        return [];
      }
    },
    // 默认选中的节点
    defaultCheckedKeys: {
      type: Array,
      default() {
        return [];
      }
    },
    // 节点的key字段名
    nodeKey: {
      type: String
    },
    // 自定义的渲染函数
    renderContent: {
      type: Function
    },
    // 节点过滤函数
    filterNodeMethod: {
      type: Function
    },
    // data为空时的显示
    emptyText: {
      type: String,
      default: "暂无数据"
    }
  },
  watch: {
    data: {
      handler(newVal) {
        if (this.lazy) {
          this.lazyLoadData();
        } else {
          this.cloneData(newVal);
        }
      },
      immediate: true
    }
  },
  computed: {
    hasData() {
      return this.copyData && this.copyData.length > 0;
    }
  },
  created() {
    this.$on("on-tree-node-add", node => {
      // 将tree的引用接入到node上
      node.tree = this;
      this.nodes.push(node);
      this.checkUpNodeState(node);
      this.$set(node.node, "visible", true);
    });

    this.$on("on-tree-node-expand", node => {});

    this.$on("on-tree-node-check", node => {});
  },
  methods: {
    /**
     * @description 对象深拷贝
     * @param {object} data
     * @returns {object} 拷贝后的对象
     */
    cloneData(data) {
      this.copyData = deepCopy(data);
    },
    /**
     * @description 检查子节点状态
     */
    checkUpNodeState(treeNode) {
      // 设置默认展开和默认选中需要用户传入nodeKey
      if (!this.nodeKey) return;
      // 检查是否为默认展开的节点
      if (this.defaultExpandedKeys && this.defaultExpandedKeys.length > 0) {
        this.defaultExpandedKeys.includes(treeNode.node[this.nodeKey]) &&
          this.$nextTick(() => {
            treeNode.handleExpand(true);
          });
      }

      // 检查是否为默认选中的节点
      if (this.defaultCheckedKeys && this.defaultCheckedKeys.length > 0) {
        if (this.defaultCheckedKeys.includes(treeNode.node[this.nodeKey])) {
          this.$nextTick(() => {
            treeNode.handleCheck(true);
          });
        }

        // this.defaultCheckedKeys.includes(node[this.nodeKey]) &&
        //   this.$set(node, "checked", true);
      }
    },
    /**
     * @description 数据懒加载
     */
    lazyLoadData() {
      this.load(
        {
          level: 0
        },
        data => {
          this.copyData = deepCopy(data);
        }
      );
    },
    /**
     * @description 获取被选中的节点
     * @param {boolean} leafOnly 是否只返回叶子节点，默认为false
     * @returns {array} 被选中的节点
     */
    getCheckedNodes(leafOnly) {
      let checkedNodes = this.nodes.reduce((total, cell) => {
        if (leafOnly) {
          cell.node.checked &&
            (!cell.node.children || cell.node.isLeaf) &&
            total.push({
              [this.nodeKey]: cell.node[this.nodeKey],
              label: cell.node.label
            });
        } else {
          cell.node.checked &&
            total.push({
              [this.nodeKey]: cell.node[this.nodeKey],
              label: cell.node.label
            });
        }
        return total;
      }, []);
      return checkedNodes;
    },
    /**
     * @description 获取被选中的节点组成的数组
     * @param {boolean} leafOnly 是否只返回叶子节点，默认为false
     * @returns {array} 被选中节点值组成的数组
     */
    getCheckedKeys(leafOnly) {
      let checkedKeys = this.nodes.reduce((total, cell) => {
        if (leafOnly) {
          cell.node.checked &&
            (!cell.node.children || cell.node.isLeaf) &&
            total.push(cell.node[this.nodeKey]);
        } else {
          cell.node.checked && total.push(cell.node[this.nodeKey]);
        }
        return total;
      }, []);

      return checkedKeys;
    },
    /**
     * @description 设置目前勾选的节点，使用此方法必须设置 node-key 属性
     * @param {array} nodes 接收勾选节点数据的数组
     */
    setCheckedNodes(nodes) {
      // 1. [] => {}
      const nodesMap = nodes.reduce((total, cell) => {
        total[cell[this.nodeKey]] = true;
        return total;
      }, {});
      // 2. 清空所有选择状态
      this.nodes.forEach(cell => {
        cell.handleCheck(false);
      });

      // 2. 循环处理
      this.nodes.forEach(cell => {
        const checked = !!nodesMap[cell.node[this.nodeKey]];
        !cell.node.checked && cell.handleCheck(checked);
      });
    },
    /**
     * @description 通过 keys 设置目前勾选的节点，使用此方法必须设置 node-key 属性
     * @param {array} keys 勾选节点的 key 的数组
     * @param {boolean} leafOnly 是否只设置叶子节点，默认为false
     */
    setCheckedKeys(keys, leafOnly) {
      // 1. [] => {}
      const keysMap = keys.reduce((total, cell) => {
        total[cell] = true;
        return total;
      }, {});

      // 2. 清空所有选择状态
      this.nodes.forEach(cell => {
        cell.handleCheck(false);
      });

      // 3. 循环处理
      this.nodes.forEach(cell => {
        let checked = !!keysMap[cell.node[this.nodeKey]];

        if (leafOnly) {
          checked =
            !!keysMap[cell.node[this.nodeKey]] &&
            (!cell.node.children || cell.node.isLeaf);
        }
        !cell.node.checked && cell.handleCheck(checked);
      });
    },
    /**
     * @description 过滤
     */
    filter(val) {
      this.filterNodeMethod &&
        this.nodes.forEach(cell => {
          this.$set(
            cell.node,
            "visible",
            this.filterNodeMethod(val, cell.node)
          );
        });
    }
  }
};
</script>
