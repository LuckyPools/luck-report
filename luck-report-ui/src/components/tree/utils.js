/**
 * @description 设置树节点的选中状态
 * @param {*} vm vue组件实例
 * @param {*} node 节点数据
 * @param {*} checked 属性值
 */
export function setNodeChecked(vm, node, checked) {
  if (!node.disabled) {
    vm.$set(node, "checked", checked);
    vm.$set(node, "indeterminate", false);
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach(cell => {
      setNodeChecked(vm, cell, checked);
    });
  }
}
