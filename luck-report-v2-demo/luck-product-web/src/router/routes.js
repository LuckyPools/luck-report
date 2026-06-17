import BaseLayout from "@/layouts/base-layout/index.vue";
import BlankLayout from "@/layouts/blank-layout/index.vue";

export const LOGIN_PATH = '/login';
export const HOME_PATH = '/home';

export const layouts = {
    base: BaseLayout,
    blank: BlankLayout
};

export const views = {
    login: () => import("@/views/login/index.vue"),
    home: () => import("@/views/home/index.vue"),
    'report-designer': () => import("@/views/report/designer.vue"),
    'report-preview': () => import("@/views/report/preview.vue"),
    'report-manage': () => import("@/views/report/manage.vue"),
    404: () => import("@/views/error/404.vue"),
    500: () => import("@/views/error/500.vue")
}

export const staticRoutes = [
    {
        name: 'home',
        path: '/home',
        component: 'layout.base$view.home',
        meta: {
            title: 'home',
            i18nKey: 'route.home',
            grade: 1
        }
    },
    {
        name: 'report-manage',
        path: '/report/manage',
        component: 'layout.base$view.report-manage',
        meta: {
            title: 'report-manage',
            i18nKey: 'route.report-manage',
            grade: 1
        }
    },
    {
        name: 'report-designer',
        path: '/report/designer',
        component: 'layout.base$view.report-designer',
        meta: {
            title: 'report-designer',
            i18nKey: 'route.report-designer',
            grade: 1
        }
    },
    {
        name: 'report-preview',
        path: '/report/preview',
        component: 'layout.base$view.report-preview',
        meta: {
            title: 'report-preview',
            i18nKey: 'route.report-preview',
            grade: 1
        }
    },
    {
        name: 'login',
        path: '/login',
        component: 'layout.blank$view.login',
        meta: {
            title: 'login',
            i18nKey: 'route.login',
            constant: true,
            grade: 1,
            hide: true
        }
    },
    {
        name: 'ServiceError',
        path: '/500',
        component: 'layout.blank$view.500',
        meta: {
            title: '500',
            i18nKey: 'route.500',
            constant: true,
            grade: 1,
            hide: true
        }
    },
    {
        path: '/',
        redirect: HOME_PATH,
        meta: {
            hide: true,
            grade: 1
        }
    }
];

export const errorRoutes = [
    {
        name: 'NotFound',
        path: '*',
        component: 'layout.blank$view.404',
        meta: {
            title: '404',
            i18nKey: 'route.404',
            constant: true,
            grade: 1,
            hide: true
        }
    }
]

export const authList = [LOGIN_PATH]

export const whiteList = ['/404', '/500'].concat(authList);

export function transformElegantRoutesToVueRoutes(routes, layouts, views) {
    return routes.flatMap(route => transformElegantRouteToVueRoute(route, layouts, views));
}

export function transformElegantRouteToVueRoute(route, layouts, views) {
    const LAYOUT_PREFIX = 'layout.';
    const VIEW_PREFIX = 'view.';
    const ROUTE_DEGREE_SPLITTER = '_';
    const FIRST_LEVEL_ROUTE_COMPONENT_SPLIT = '$';

    function isLayout(component) {
        return component.startsWith(LAYOUT_PREFIX);
    }

    function getLayoutName(component) {
        const layout = component.replace(LAYOUT_PREFIX, '');
        if (!layouts[layout]) {
            throw new Error(`Layout component "${layout}" not found`);
        }
        return layout;
    }

    function isView(component) {
        return component.startsWith(VIEW_PREFIX);
    }

    function getViewName(component) {
        const view = component.replace(VIEW_PREFIX, '');
        if (!views[view]) {
            throw new Error(`View component "${view}" not found`);
        }
        return view;
    }

    function isFirstLevelRoute(item) {
        return item.meta.grade === 1;
    }

    function isSingleLevelRoute(item) {
        return isFirstLevelRoute(item) && !item.children?.length;
    }

    function getSingleLevelRouteComponent(component) {
        const [layout, view] = component.split(FIRST_LEVEL_ROUTE_COMPONENT_SPLIT);
        return {
            layout: getLayoutName(layout),
            view: getViewName(view)
        };
    }

    const vueRoutes = [];

    if (route.path.includes(':') && !route.props) {
        route.props = true;
    }

    const {name, path, component, children, ...rest} = route;

    const vueRoute = {name, path, ...rest};
    try {
        if (component) {
            if (isSingleLevelRoute(route)) {
                const {layout, view} = getSingleLevelRouteComponent(component);

                const singleLevelRoute = {
                    path,
                    component: layouts[layout],
                    children: [
                        {
                            name,
                            path: path,
                            component: views[view],
                            ...rest
                        }
                    ]
                };

                return [singleLevelRoute];
            }

            if (isLayout(component)) {
                const layoutName = getLayoutName(component);
                vueRoute.component = layouts[layoutName];
            }

            if (isView(component)) {
                const viewName = getViewName(component);
                vueRoute.component = views[viewName];
            }
        }
    } catch (error) {
        console.error(`Error transforming route "${route.name}": ${error.toString()}`);
        return [];
    }

    if (children?.length && !vueRoute.redirect) {
        vueRoute.redirect = {
            name: children[0].name
        };
    }

    if (children?.length) {
        const childRoutes = children.flatMap(child => transformElegantRouteToVueRoute(child, layouts, views));

        if (isFirstLevelRoute(route)) {
            vueRoute.children = childRoutes;
        } else {
            vueRoutes.push(...childRoutes);
        }
    }

    vueRoutes.unshift(vueRoute);
    return vueRoutes;
}

export function createVueRoutes(routes) {
    return transformElegantRoutesToVueRoutes(routes, layouts, views);
}

const routeMap = {
    "root": "/",
    "404": "/404",
    "500": "/500",
    "home": "/home",
    "report-manage": "/report/manage",
    "report-designer": "/report/designer",
    "report-preview": "/report/preview"
};

export function getRoutePath(name) {
    return routeMap[name];
}
