/**
 * Created by Jacky.Gao on 2017-02-07.
 * Modified to use Vue component instead of jQuery
 */
import Vue from 'vue';
import RowColNumberDialogVue from '@/views/report/designer/edit-table/row-col-number-dialog/index.vue';
import i18n from '@/locales';

export default class Class {
    constructor() {
        const RowColNumberDialogConstructor = Vue.extend(RowColNumberDialogVue);
        this.dialogInstance = new RowColNumberDialogConstructor({
            i18n
        });

        this.dialogInstance.$mount();

        if (this.dialogInstance.$el) {
            document.body.appendChild(this.dialogInstance.$el);
        }
    }

    show(callback, isRow) {
        this.dialogInstance.show(callback, isRow);
    }

}
