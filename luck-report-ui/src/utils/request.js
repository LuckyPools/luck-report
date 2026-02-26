import axios from 'axios'

// 新建axios实例
const request = axios.create({
    baseURL: '/api',
    timeout: 60000
})

// 添加请求拦截器
request.interceptors.request.use(config => {
    return config
}, error => {
    return dealError(error)
})

// 添加响应拦截器
request.interceptors.response.use(response => {
    if (response.status !== 200) {
        // eslint-disable-next-line
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

// 异常处理
function dealError(error){
    console.log(error);
    return Promise.reject(error);
}

// 处理响应结果
function dealAxiosResult(res) {
    let realRes = res.data ? res.data : res;
    // 文件下载，直接返回整个response对象
    if (res.request?.responseType === 'blob') {
        return Promise.resolve(res);
    }
    return Promise.resolve(realRes);
}

/**
 * 项目自定义全局post方法
 * 统一处理接口请求异常
 *
 * @param url
 * @param param
 * @param config
 * @returns {Promise<unknown>}
 */
async function post(url, param = {}, config = {}) {
    let res = await request.post(url, param, config);
    return dealAxiosResult(res)
}

/**
 * 项目自定义全局get方法
 * 统一处理接口请求异常
 *
 * @param url
 * @param config
 * @returns {Promise<unknown>}
 */
async function get(url, config = {}) {
    let res = await request.get(url, config);
    return dealAxiosResult(res);
}

export default {
    default: request,
    ...request,
    post,
    get
};
