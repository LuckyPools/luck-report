import navigationAdapter from './navigationAdapter'

let isLibMode = false

export function setLibMode(mode) {
    isLibMode = mode
}

export function getLibMode() {
    return isLibMode
}

export function createNavigator(component) {
    return {
        navigate(options) {
            if (isLibMode) {
                navigationAdapter.navigate(options)
                return
            }

            const { target, params, openInNewTab } = options
            const routeData = component.$router.resolve({
                name: target,
                query: params
            })

            if (openInNewTab) {
                window.open(routeData.href, '_blank')
            } else {
                window.open(routeData.href, '_self')
            }
        },

        openPreview(params, openInNewTab = true) {
            this.navigate({
                target: 'Preview',
                params,
                openInNewTab
            })
        },

        openDesigner(params, openInNewTab = false) {
            this.navigate({
                target: 'Designer',
                params,
                openInNewTab
            })
        },

        refresh() {
            if (isLibMode) {
                navigationAdapter.refresh()
            } else {
                window.location.reload()
            }
        },

        getRouteParams() {
            if (isLibMode) {
                return {}
            }
            return component.$route?.query || {}
        }
    }
}

export function getRouteParams(component) {
    if (isLibMode) {
        return {}
    }
    return component.$route?.query || {}
}
