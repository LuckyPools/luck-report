/**
 * Created by Jacky.Gao on 2017-06-22.
 * Vue组件化重构版本
 */
import Vue from 'vue';
import ChartWidgetVue from '@/views/report/designer/edit-table/chart-widget/index.vue';

export default class ChartWidget {
    constructor(container, cellDef) {
        this.container = container;
        this.cellDef = cellDef;
        this.vueInstance = null;
    }

    renderChart(container, context, rowIndex, colIndex) {
        if (container) {
            this.container = container;
        }

        // 确保容器元素存在
        if (!this.container) {
            console.error('Container element not provided for Class');
            return;
        }

        // 清除容器内容
        this.container.innerHTML = '';

        // 创建一个临时的挂载点
        const mountPoint = document.createElement('div');
        this.container.appendChild(mountPoint);

        // 创建Vue实例并挂载到容器
        this.vueInstance = new Vue({
            render: h => h(ChartWidgetVue, {
                props: {
                    cellDef: this.cellDef,
                    context: context,
                    rowIndex: rowIndex,
                    colIndex: colIndex
                }
            })
        }).$mount(mountPoint);
    }

    // 提供销毁方法，避免内存泄漏
    destroy() {
        if (this.vueInstance) {
            this.vueInstance.$destroy();
            this.vueInstance = null;
        }
    }
};

// 为了保持向后兼容性，提供全局的chartColors对象
window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};
