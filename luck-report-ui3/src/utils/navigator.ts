/**
 * 导航器工具
 *
 * 工作流程：
 * 1. createNavigator(component) - 基于当前 Vue 组件实例返回一个导航器对象
 * 2. 调用方通过 navigator.openPreview / openDesigner / refresh 等方法触发跳转
 * 3. 内部统一通过 Vue Router 的 resolve 生成目标链接，再用 window.open 打开
 *
 * 调用方：designer 内部多个工具栏按钮组件
 */
import type { Router, RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

/** 具备 Vue Router 实例的组件抽象类型 */
interface RouterComponent {
    $router: Router
    $route: RouteLocationNormalizedLoaded
}

/** 通用跳转参数 */
interface NavigateOptions {
    /** 目标路由 name */
    target: string
    /** 附加到 url query 的参数 */
    params?: Record<string, any>
    /** 是否在新标签页打开 */
    openInNewTab?: boolean
}

/** createNavigator 返回的导航器对象 */
interface Navigator {
    navigate(options: NavigateOptions): void
    openPreview(params?: Record<string, any>, openInNewTab?: boolean): void
    openDesigner(params?: Record<string, any>, openInNewTab?: boolean): void
    refresh(): void
    getRouteParams(): Record<string, any>
}

/**
 * 创建导航器实例
 * @param component Vue 组件实例，需具备 $router 和 $route
 * @returns 导航器对象
 */
export function createNavigator(component: RouterComponent): Navigator {
    return {
        /**
         * 通用跳转
         * @param options 跳转参数
         */
        navigate(options: NavigateOptions): void {
            const { target, params, openInNewTab } = options
            const routeData = component.$router.resolve({
                name: target,
                query: params
            } as RouteLocationRaw)

            if (openInNewTab) {
                window.open(routeData.href, '_blank')
            } else {
                window.open(routeData.href, '_self')
            }
        },

        /**
         * 打开预览页
         * @param params 预览参数
         * @param openInNewTab 是否新标签页打开，默认 true
         */
        openPreview(params: Record<string, any> = {}, openInNewTab: boolean = true): void {
            this.navigate({
                target: 'Preview',
                params,
                openInNewTab
            })
        },

        /**
         * 打开设计器
         * @param params 设计器参数
         * @param openInNewTab 是否新标签页打开，默认 false
         */
        openDesigner(params: Record<string, any> = {}, openInNewTab: boolean = false): void {
            this.navigate({
                target: 'Designer',
                params,
                openInNewTab
            })
        },

        /**
         * 刷新当前页
         */
        refresh(): void {
            window.location.reload()
        },

        /**
         * 获取当前路由 query 参数
         * @returns 当前路由 query
         */
        getRouteParams(): Record<string, any> {
            return (component.$route?.query || {}) as Record<string, any>
        }
    }
}

/**
 * 获取当前路由 query 参数
 * @param component Vue 组件实例
 * @returns 当前路由 query
 */
export function getRouteParams(component: RouterComponent): Record<string, any> {
    return (component.$route?.query || {}) as Record<string, any>
}
