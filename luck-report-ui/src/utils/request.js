import axios from 'axios'
import {getLibMode} from "@/lib/navigator";

const defaultRequest = axios.create({
    baseURL: '/api',
    timeout: 60000
})

let customRequestHandler = null
let externalRequestInstance = null

/**
 * 默认异常处理函数
 * 处理请求异常，支持异常编码显示和复制功能
 *
 * @param error 错误对象，包含 response、auxCode、msg 等信息
 * @returns {Promise<never>} 返回 rejected Promise
 */
function dealError(error) {
    console.log(error)
    if (error && error.auxCode && error.msg) {
        const auxCodeHtml = `<span class="aux-code">${error.auxCode}</span><i class="iconfont icon-copy" style="cursor: pointer; margin-left: 4px; color: #409eff;" title="点击复制" onclick="navigator.clipboard.writeText('${error.auxCode}').then(() => { this.style.color = '#67c23a'; setTimeout(() => { this.style.color = '#409eff'; }, 1000); })"></i>`
        error.msg = error.msg + "<br/>异常编码：" + auxCodeHtml
    }
    return Promise.reject(error)
}

defaultRequest.interceptors.request.use(
    config => config,
    error => dealError(error)
)

defaultRequest.interceptors.response.use(
    response => {
        if (response.status !== 200) {
            dealError({ response: response })
            throw new Error("请求异常")
        }
        return response
    },
    error => {
        if (error.response && error.response.data) {
            const errorData = error.response.data
            return dealError(errorData)
        }
        return dealError(error)
    }
)

export const requestAdapter = {
    setRequest(request) {
        externalRequestInstance = request
    },

    setRequestHandler(handler) {
        customRequestHandler = handler
    },

    setBaseURL(url) {
        defaultRequest.defaults.baseURL = url
    },

    setDefaultHeaders(headers) {
        Object.assign(defaultRequest.defaults.headers.common, headers)
    },

    addRequestInterceptor(onFulfilled, onRejected) {
        return defaultRequest.interceptors.request.use(onFulfilled, onRejected)
    },

    addResponseInterceptor(onFulfilled, onRejected) {
        return defaultRequest.interceptors.response.use(onFulfilled, onRejected)
    },

    async request(config) {
        if (externalRequestInstance) {
            return externalRequestInstance(config)
        }

        if (customRequestHandler) {
            return customRequestHandler(config)
        }

        return defaultRequest(config)
    },

    async post(url, data, config) {
        return this.request({ method: 'POST', url, data, ...config })
    },

    async get(url, config) {
        return this.request({ method: 'GET', url, ...config })
    }
}

async function post(url, param = {}, config = {}) {
    const libMode = getLibMode();
    if (libMode) {
        const res = await requestAdapter.post(url, param, config);
        return dealAxiosResult(res);
    }
    let res = await defaultRequest.post(url, param, config);
    return dealAxiosResult(res)
}

async function get(url, config = {}) {
    if (getLibMode()) {
        const res = await requestAdapter.get(url, config);
        return dealAxiosResult(res);
    }
    let res = await defaultRequest.get(url, config);
    return dealAxiosResult(res);
}

/**
 * 处理响应结果
 * 提取响应数据，文件下载类型直接返回整个response对象
 *
 * @param res axios响应对象
 * @returns {Promise<unknown>} 返回处理后的响应数据
 */
function dealAxiosResult(res) {
    let realRes = res.data ? res.data : res
    if (res.request?.responseType === 'blob') {
        return Promise.resolve(res)
    }
    return Promise.resolve(realRes)
}

export default {
    default: defaultRequest,
    ...defaultRequest,
    post,
    get
};
