import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import PreviewComponent from '@/views/report/preview/index.vue'
import reportStore from '@/store/modules/report'
import getters from '@/store/getters'
import zh from '@/locales/lang/zh'
import en from '@/locales/lang/en'

import 'chart.js/dist/Chart.bundle.min.js'
import 'chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js'
import '@/assets/css/iconfont/iconfont.css'
import '@/assets/css/common/index.css'

Vue.use(Vuex)
Vue.use(VueI18n)

class LuckPreviewElement extends HTMLElement {
    constructor() {
        super()
        this._vm = null
        this._props = {}
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
        if (oldValue !== newValue && this._vm) {
            const propName = this._camelize(name)
            this._props[propName] = this._parseValue(newValue)
            if (this._vm.$children[0]) {
                this._vm.$children[0][propName] = this._props[propName]
            }
        }
    }

    set reportPath(val) {
        this._props.reportPath = val
        if (this._vm) {
            this._vm.internalReportPath = val
        }
    }

    get reportPath() {
        return this._props.reportPath
    }

    set params(val) {
        this._props.params = val
        if (this._vm) {
            this._vm.internalParams = val
        }
    }

    get params() {
        return this._props.params
    }

    set mode(val) {
        this._props.mode = val
        if (this._vm) {
            this._vm.internalMode = val
        }
    }

    get mode() {
        return this._props.mode
    }

    set pageIndex(val) {
        this._props.pageIndex = val
        if (this._vm) {
            this._vm.internalPageIndex = val
        }
    }

    get pageIndex() {
        return this._props.pageIndex
    }

    set toolsInfo(val) {
        this._props.toolsInfo = val
        if (this._vm) {
            this._vm.internalToolsInfo = val
        }
    }

    get toolsInfo() {
        return this._props.toolsInfo
    }

    _mount() {
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

        this._props = {
            reportPath: this.getAttribute('report-path') || '',
            params: this._parseValue(this.getAttribute('params')) || {},
            mode: this.getAttribute('mode') || '',
            pageIndex: this._parseValue(this.getAttribute('page-index')) || null,
            toolsInfo: this._parseValue(this.getAttribute('tools-info')) || null
        }

        const PreviewConstructor = Vue.extend({
            store,
            i18n,
            props: {
                reportPath: { type: String, default: '' },
                params: { type: Object, default: () => ({}) },
                mode: { type: String, default: '' },
                pageIndex: { type: [Number, String], default: null },
                toolsInfo: { type: [Number, String], default: null }
            },
            data() {
                return {
                    internalReportPath: this.reportPath,
                    internalParams: this.params,
                    internalMode: this.mode,
                    internalPageIndex: this.pageIndex,
                    internalToolsInfo: this.toolsInfo
                }
            },
            watch: {
                reportPath(val) {
                    this.internalReportPath = val
                },
                params: {
                    handler(val) {
                        this.internalParams = val
                    },
                    deep: true
                },
                mode(val) {
                    this.internalMode = val
                },
                pageIndex(val) {
                    this.internalPageIndex = val
                },
                toolsInfo(val) {
                    this.internalToolsInfo = val
                }
            },
            render(h) {
                return h(PreviewComponent, {
                    props: {
                        reportPath: this.internalReportPath,
                        params: this.internalParams,
                        mode: this.internalMode,
                        pageIndex: this.internalPageIndex,
                        toolsInfo: this.internalToolsInfo
                    },
                    on: {
                        navigate: (data) => this._handleNavigate(data),
                        ready: (data) => this._emit('ready', data),
                        error: (err) => this._emit('error', err)
                    }
                })
            },
            methods: {
                _handleNavigate(data) {
                    this._emit('navigate', data)
                },
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
                print() {
                    return this.$children[0]?.print?.()
                },
                exportPDF() {
                    return this.$children[0]?.exportPdf?.()
                },
                exportWord() {
                    return this.$children[0]?.exportWord?.()
                },
                exportExcel() {
                    return this.$children[0]?.exportExcel?.()
                },
                goToPage(pageIndex) {
                    return this.$children[0]?.goToPage?.(pageIndex)
                }
            }
        })

        this._vm = new PreviewConstructor({
            propsData: this._props
        })
        this._vm.$mount(container)
    }

    _camelize(str) {
        return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
    }

    _parseValue(value) {
        if (value === null || value === undefined) return value
        if (value === 'true') return true
        if (value === 'false') return false
        try {
            return JSON.parse(value)
        } catch {
            return value
        }
    }

    refresh() {
        return this._vm?.refresh?.()
    }

    print() {
        return this._vm?.print?.()
    }

    exportPDF() {
        return this._vm?.exportPDF?.()
    }

    exportWord() {
        return this._vm?.exportWord?.()
    }

    exportExcel() {
        return this._vm?.exportExcel?.()
    }

    goToPage(pageIndex) {
        return this._vm?.goToPage?.(pageIndex)
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
