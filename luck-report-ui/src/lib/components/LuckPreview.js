import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import PreviewComponent from '@/views/report/preview/index.vue'
import reportStore from '@/store/modules/report'
import getters from '@/store/getters'
import zh from '@/locales/lang/zh'
import en from '@/locales/lang/en'

import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { updateUrlParams } from '@/utils/url'

Chart.register(...registerables, ChartDataLabels)
import '@/assets/css/iconfont/iconfont.css'
import '@/assets/css/common/index.css'

Vue.use(Vuex)
Vue.use(VueI18n)

class LuckPreviewElement extends HTMLElement {
    constructor() {
        super()
        this._vm = null
    }

    static get observedAttributes() {
        return ['report-path', 'params', 'locale', 'mode', 'page-index', 'tools-info']
    }

    connectedCallback() {
        this._mount()
    }

    disconnectedCallback() {
        if (this._vm) {
            this._vm.$destroy()
            this._vm = null
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'locale') {
                if (this._vm) {
                    this._vm.$i18n.locale = newValue || 'zh'
                }
                return
            }
            this._syncUrlFromAttributes()
            this._refreshPreview(true)
        }
    }

    _refreshPreview(reload = false) {
        if (this._vm) {
            const preview = this._vm.$children[0]
            if (preview) {
                preview.parseParamsFromUrl()
                if (reload) {
                    preview.initReport()
                }
            }
        }
    }

    set reportPath(val) {
        updateUrlParams({ reportPath: val })
        this._refreshPreview(true)
    }

    get reportPath() {
        return this.getAttribute('report-path')
    }

    set params(val) {
        if (val && typeof val === 'object') {
            updateUrlParams(val)
        }
        this._refreshPreview(true)
    }

    get params() {
        try {
            return JSON.parse(this.getAttribute('params') || '{}')
        } catch {
            return {}
        }
    }

    set mode(val) {
        updateUrlParams({ mode: val })
        this._refreshPreview(false)
    }

    get mode() {
        return this.getAttribute('mode')
    }

    set pageIndex(val) {
        updateUrlParams({ _i: val })
        this._refreshPreview(false)
    }

    get pageIndex() {
        return this.getAttribute('page-index')
    }

    set toolsInfo(val) {
        updateUrlParams({ _t: val })
        this._refreshPreview(false)
    }

    get toolsInfo() {
        return this.getAttribute('tools-info')
    }

    _mount() {
        this._syncUrlFromAttributes()

        const container = document.createElement('div')
        container.className = 'luck-preview-container'
        container.style.width = '100%'
        container.style.height = '100%'
        this.appendChild(container)

        const store = new Vuex.Store({
            modules: { report: reportStore },
            getters
        })

        const i18n = new VueI18n({
            locale: this.getAttribute('locale') || 'zh',
            messages: { zh, en }
        })

        const PreviewConstructor = Vue.extend({
            store,
            i18n,
            render(h) {
                return h(PreviewComponent, {
                    on: {
                        ready: (data) => this._emit('ready', data),
                        error: (err) => this._emit('error', err)
                    }
                })
            },
            methods: {
                _emit(eventName, detail) {
                    this.$el.dispatchEvent(new CustomEvent(eventName, {
                        detail,
                        bubbles: true,
                        composed: true
                    }))
                },
                refresh() {
                    return this.$children[0]?.refresh?.()
                },
                handlePageChange(pageIndex) {
                    return this.$children[0]?.handlePageChange?.(pageIndex)
                }
            }
        })

        this._vm = new PreviewConstructor()
        this._vm.$mount(container)
    }

    _syncUrlFromAttributes() {
        const params = {}

        const paramsStr = this.getAttribute('params')
        if (paramsStr) {
            try {
                const extraParams = JSON.parse(paramsStr)
                Object.keys(extraParams).forEach(key => {
                    params[key] = extraParams[key]
                })
            } catch {}
        }

        const reportPath = this.getAttribute('report-path')
        const mode = this.getAttribute('mode')
        const pageIndex = this.getAttribute('page-index')
        const toolsInfo = this.getAttribute('tools-info')

        if (reportPath != null) params.reportPath = reportPath || null
        if (mode != null) params.mode = mode || null
        if (pageIndex != null) params._i = pageIndex || null
        if (toolsInfo != null) params._t = toolsInfo || null

        updateUrlParams(params)
    }

    refresh() {
        return this._vm?.refresh?.()
    }

    handlePageChange(pageIndex) {
        return this._vm?.handlePageChange?.(pageIndex)
    }

    setReportPath(path) {
        this.setAttribute('report-path', path)
    }

    setParams(params) {
        this.setAttribute('params', JSON.stringify(params))
    }

    setLocale(locale) {
        this.setAttribute('locale', locale)
    }
}

export default LuckPreviewElement
