import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import DesignerComponent from '@/views/report/designer/index.vue'
import reportStore from '@/store/modules/report'
import getters from '@/store/getters'
import zh from '@/locales/lang/zh'
import en from '@/locales/lang/en'

import 'handsontable/dist/handsontable.min.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/lint/lint.css'
import '@/assets/css/designer/tree.css'
import '@/assets/css/iconfont/iconfont.css'
import '@/assets/css/common/index.css'

Vue.use(Vuex)
Vue.use(VueI18n)

class LuckDesignerElement extends HTMLElement {
    constructor() {
        super()
        this._vm = null
        this._props = {}
    }

    static get observedAttributes() {
        return ['report-path', 'locale']
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
            
            if (name === 'report-path') {
                this._vm.internalReportPath = this._props.reportPath
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

    _mount() {
        const container = document.createElement('div')
        container.className = 'luck-designer-container'
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
            reportPath: this.getAttribute('report-path') || ''
        }

        const DesignerConstructor = Vue.extend({
            store,
            i18n,
            props: {
                reportPath: { type: String, default: '' }
            },
            data() {
                return {
                    internalReportPath: this.reportPath
                }
            },
            watch: {
                reportPath(val) {
                    this.internalReportPath = val
                }
            },
            render(h) {
                return h(DesignerComponent, {
                    props: {
                        reportPath: this.internalReportPath
                    },
                    on: {
                        navigate: (data) => this._handleNavigate(data),
                        save: (data) => this._emit('save', data),
                        error: (err) => this._emit('error', err)
                    },
                    ref: 'designerComponent'
                })
            },
            methods: {
                _handleNavigate(data) {
                    if (data.target === 'Designer' && data.params && data.params.reportPath) {
                        const newReportPath = data.params.reportPath
                        this.internalReportPath = newReportPath
                        this.$forceUpdate()
                        
                        if (this.$parent && this.$parent.setAttribute) {
                            this.$parent.setAttribute('report-path', newReportPath)
                        }
                    }
                    
                    this._emit('navigate', data)
                },
                _emit(eventName, detail) {
                    this.$el.dispatchEvent(new CustomEvent(eventName, { 
                        detail,
                        bubbles: true,
                        composed: true
                    }))
                },
                getReportData() {
                    return this.$children[0]?.getReportData?.()
                },
                saveReport() {
                    return this.$children[0]?.saveReport?.()
                },
                navigateTo(target, params, openInNewTab = true) {
                    this._handleNavigate({ target, params, openInNewTab })
                }
            }
        })

        this._vm = new DesignerConstructor({
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

    getReportData() {
        return this._vm?.getReportData?.()
    }

    saveReport() {
        return this._vm?.saveReport?.()
    }

    navigateTo(target, params, openInNewTab = true) {
        return this._vm?.navigateTo?.(target, params, openInNewTab)
    }

    setReportPath(path) {
        this.setAttribute('report-path', path)
    }

    setLocale(locale) {
        this.setAttribute('locale', locale)
    }
}

export default LuckDesignerElement
