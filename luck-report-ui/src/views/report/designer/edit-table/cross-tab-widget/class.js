/**
 * Created by Jacky.Gao on 2017-03-15.
 * Modified to use Vue component and remove jQuery dependency
 */
import Vue from 'vue';
import CrossTabWidgetVue from './index.vue';
import TableManager from '../manager.js';

export default class CrossTabWidget {

    constructor(context, rowIndex, colIndex, value) {
        this.context = context;
        this.hot = TableManager.get();
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.value = value;

        // Vue 实例相关属性
        this.vueInstance = null;
        this.container = null;

        this.refreshCell();
    }

    refreshCell() {
        // 销毁已存在的 Vue 实例
        if (this.vueInstance) {
            this.vueInstance.$destroy();
            this.vueInstance = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }

        // 获取单元格元素
        const td = this.hot.getCell(this.rowIndex, this.colIndex);

        // 清空单元格内容
        while (td.firstChild) {
            td.removeChild(td.firstChild);
        }

        // 创建容器元素
        this.container = document.createElement('div');
        td.appendChild(this.container);

        // 创建新的Vue实例
        this.vueInstance = new Vue({
            el: this.container,
            render: h => h(CrossTabWidgetVue, {
                props: {
                    context: this.context,
                    rowIndex: this.rowIndex,
                    colIndex: this.colIndex,
                    value: this.value
                }
            })
        });
    }


    doDraw() {
        if (this.vueInstance) {
            const component = this.vueInstance.$children[0];
            if (component) {
                // 使用组件内部的宽高值，而不是外部的
                component.doDraw();
            }
        }
    }

    // 清理方法，避免内存泄漏
    destroy() {
        if (this.vueInstance) {
            this.vueInstance.$destroy();
            this.vueInstance = null;
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}
