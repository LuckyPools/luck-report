import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';
import store from '../store'
import {authList, createVueRoutes, errorRoutes, LOGIN_PATH, staticRoutes, whiteList} from './routes';
import {getToken} from "@/utils/auth";

Vue.use(Router);

const router = new Router({
    mode: 'history',
    routes: createVueRoutes(staticRoutes.concat(errorRoutes))
})

NProgress.configure({
    easing: 'ease',
    speed: 500,
})

router.beforeEach((to, from, next) => {
    NProgress.start()
    
    if (getToken()) {
        if (authList.includes(to.path)) {
            next('/home');
            NProgress.done();
        } else {
            next();
        }
    } else if (whiteList.includes(to.path)) {
        next();
    } else {
        next({
            path: LOGIN_PATH,
            query: to.path === '/' ? {} : { from: to.path }
        });
        NProgress.done();
    }
})

router.afterEach((to) => {
    NProgress.done()
    store.dispatch('route/setCurRoute', to);
    const title = to.meta?.title;
    if (title) {
        document.title = title === 'home' ? '首页' : title;
    }
})

export function routerPushByKey(key, options) {
    const { query, params } = options || {};
    const routeLocation = { name: key };
    if (query) routeLocation.query = query;
    if (params) routeLocation.params = params;
    return router.push(routeLocation);
}

export default router
