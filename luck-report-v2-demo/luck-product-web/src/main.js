import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './locales';
import cache from "./utils/cache";
import Antd from 'ant-design-vue';
import "ant-design-vue/dist/antd.less"
import '@/assets/styles/css/index.css';
import '@/assets/icons/index'
import 'uno.css';

Vue.use(Antd);
Vue.prototype.$cache = cache;

new Vue({
    el: '#app',
    router,
    store,
    i18n,
    render: h => h(App)
});
