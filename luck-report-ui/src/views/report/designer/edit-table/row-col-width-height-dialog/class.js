/**
 * Created by Jacky.Gao on 2017-02-07.
 * Modified to use Vue component instead of jQuery
 */
import Vue from 'vue';
import RowColWidthHeightDialogVue from '@/views/report/designer/edit-table/row-col-width-height-dialog/index.vue';
import i18n from '../../../../../locales';

export default class Class {
    constructor() {
        // 创建Vue组件实例并注入 i18n
        const RowColWidthHeightDialogConstructor = Vue.extend(RowColWidthHeightDialogVue);
        this.dialogInstance = new RowColWidthHeightDialogConstructor({
            i18n  // 注入 i18n 实例
        });

        // 挂载实例
        this.dialogInstance.$mount();

        // 添加到DOM
        if (this.dialogInstance.$el) {
            document.body.appendChild(this.dialogInstance.$el);
        }
    }

    /**
     * 显示对话框
     * @param {Function} callback - 确认回调函数
     * @param {number} value - 初始值
     * @param {boolean} iscol - 是否为列宽设置
     */
    show(callback, value, iscol) {
        this.dialogInstance.show(callback, value, iscol);
    }

}
