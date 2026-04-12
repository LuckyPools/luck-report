import axios from 'axios'

const defaultRequest = axios.create({
    baseURL: '/api',
    timeout: 60000
})

let customRequestHandler = null
let externalRequestInstance = null

const requestAdapter = {
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

export default requestAdapter
