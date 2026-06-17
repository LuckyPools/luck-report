import axios from 'axios'
import {getToken} from "@/utils/auth";
import { message as Message , Modal} from 'ant-design-vue';

// 新建axios实例
const request = axios.create({
    baseURL: '/api',
    timeout: 60000
})

// 添加请求拦截器
request.interceptors.request.use(config => {
    let token = getToken();
    if (token) {
        config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
}, error => {
    return dealError(error)
})

// 添加响应拦截器
request.interceptors.response.use(response => {
    if (response.status !== 200) {
        dealError({response: response}).then(r => {})
        throw new Error("请求异常");
    }
    return response
}, error => {
    return dealError(error)
})

// 异常处理
function dealError(error){
    console.log(error.response);
    const { code, message, auxErrorCode } = error.response.data
    let msg = code + "：" +message;
    if (code === 400) { // 未授权
        Message.error(msg);
    } else if (code === 403) { // 没有权限
        Message.error(msg);
    } else if (code === 404) { // 资源不存在
        Message.error(msg);
    } else if (code >= 500) { // 服务端异常
        if (auxErrorCode) {
            msg =
                '请把以下错误编码发送给系统管理员以便快速帮您处理，错误编码：<span class="a-error-code">' +
                auxErrorCode +
                '</span>';
        }
        Modal.error({
            content: (h) => {
                return h('div', {
                    domProps: {
                        // 这里是要渲染的数据
                        innerHTML: msg,
                    }
                })
            },
        });
    }
    return Promise.reject(error);
}

// 处理响应结果
function dealAxiosResult(res) {
    let realRes = res.data ? res.data : res;
    // 文件下载，直接返回整个response对象
    if (res.request?.responseType === 'blob') {
        return Promise.resolve(res);
    }
    let { code } = res.data
    if (code !== 200) {
        dealError({response: res}).then(r => {})
        throw new Error("请求异常");
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
