let customNavigationHandler = null
let vueRouterInstance = null
let routeMapping = null
let customActions = null

const defaultRouteMapping = {
    Preview: 'ReportPreview',
    Designer: 'ReportDesigner'
}

const navigationAdapter = {
    setNavigationHandler(handler) {
        customNavigationHandler = handler
    },

    setVueRouter(router) {
        vueRouterInstance = router
    },

    setRouteMapping(mapping, options = {}) {
        routeMapping = { ...defaultRouteMapping, ...mapping }
        customActions = options.actions || {}
    },

    getRouteMapping() {
        return routeMapping || defaultRouteMapping
    },

    resolveRouteName(target) {
        const mapping = this.getRouteMapping()
        return mapping[target] || target
    },

    navigate(options) {
        if (customNavigationHandler) {
            return customNavigationHandler(options)
        }

        const { target, params, openInNewTab, action } = options

        if (action) {
            if (customActions && customActions[action]) {
                return customActions[action](options)
            }
            if (action === 'refresh') {
                window.location.reload()
                return
            }
            console.warn(`[LuckReport] Unknown action: ${action}`)
            return
        }

        if (!vueRouterInstance) {
            console.warn('[LuckReport] No Vue Router configured. Call setVueRouter(router) first.')
            return
        }

        const routeName = this.resolveRouteName(target)
        if (!routeName) {
            console.warn(`[LuckReport] No route mapping for target: ${target}`)
            return
        }

        const routeData = vueRouterInstance.resolve({
            name: routeName,
            query: params
        })
        window.open(routeData.href, openInNewTab ? '_blank' : '_self')
    },

    openPreview(params, openInNewTab = true) {
        return this.navigate({
            target: 'Preview',
            params,
            openInNewTab
        })
    },

    openDesigner(params, openInNewTab = false) {
        return this.navigate({
            target: 'Designer',
            params,
            openInNewTab
        })
    },

    refresh() {
        return this.navigate({ action: 'refresh' })
    }
}

export default navigationAdapter
