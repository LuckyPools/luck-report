import axios from 'axios'
import { getLibMode } from '@/lib/navigator'
import requestAdapter from '@/lib/requestAdapter'

const request = axios.create({
    baseURL: '/api',
    timeout: 60000
})

request.interceptors.request.use(config => {
    return config
}, error => {
    return dealError(error)
})

request.interceptors.response.use(response => {
    if (response.status !== 200) {
        dealError({response: response}).then(r => {})
        throw new Error("请求异常");
    }
    return response
}, error => {
    if (error.response && error.response.data) {
        const errorData = error.response.data;
        return dealError(errorData)
    }
    return dealError(error)
})

function dealError(error){
    console.log(error);
    if (error && error.auxCode && error.msg) {
        error.msg = error.msg + "，异常编码为：" + error.auxCode;
    }
    return Promise.reject(error);
}

function dealAxiosResult(res) {
    let realRes = res.data ? res.data : res;
    if (res.request?.responseType === 'blob') {
        return Promise.resolve(res);
    }
    return Promise.resolve(realRes);
}

async function post(url, param = {}, config = {}) {
    const libMode = getLibMode();
    if (libMode) {
        const res = await requestAdapter.post(url, param, config);
        return dealAxiosResult(res);
    }
    let res = await request.post(url, param, config);
    return dealAxiosResult(res)
}

async function get(url, config = {}) {
    if (getLibMode()) {
        const res = await requestAdapter.get(url, config);
        return dealAxiosResult(res);
    }
    let res = await request.get(url, config);
    return dealAxiosResult(res);
}

export default {
    default: request,
    ...request,
    post,
    get
};
