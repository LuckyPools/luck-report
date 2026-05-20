import './publicPath'

import 'handsontable/dist/handsontable.min.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/lint/lint.css'
import '@/assets/css/designer/tree.css'
import '@/assets/css/iconfont/iconfont.css'
import '@/assets/css/common/index.css'

import LuckDesignerElement from './components/LuckDesigner'
import LuckPreviewElement from './components/LuckPreview'
import { requestAdapter } from '@/utils/request'
import navigationAdapter from './navigationAdapter'
import { setLibMode, getLibMode } from './navigator'

const install = () => {
    if (!customElements.get('luck-designer')) {
        customElements.define('luck-designer', LuckDesignerElement)
    }
    if (!customElements.get('luck-preview')) {
        customElements.define('luck-preview', LuckPreviewElement)
    }
}

const autoInstall = () => {
    if (typeof window !== 'undefined') {
        install()
    }
}

autoInstall()

export default {
    install,
    requestAdapter,
    navigationAdapter,
    setLibMode,
    getLibMode,
    LuckDesignerElement,
    LuckPreviewElement
}

export {
    install,
    requestAdapter,
    navigationAdapter,
    setLibMode,
    getLibMode,
    LuckDesignerElement,
    LuckPreviewElement
}
