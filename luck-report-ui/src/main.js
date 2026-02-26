import Vue from 'vue'
import App from './App.vue'
import router from "./router";
import store from './store';
import i18n from './locales';
import '@/assets/css/iconfont/iconfont.css'
import './assets/css/common/index.css'

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
});

