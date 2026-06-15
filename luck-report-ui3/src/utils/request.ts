import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import {t, i18n} from "@/locales";

/** 默认实例的 axios 配置 */
const defaultRequest: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 60000
})

/** 后端业务错误对象 */
interface BizError {
    auxCode?: string
    msg?: string
    [key: string]: any
}

/**
 * 默认异常处理函数
 * 处理请求异常，支持异常编码显示和复制功能
 *
 * @param error 错误对象，包含 response、auxCode、msg 等信息
 * @returns 返回 rejected Promise
 */
function dealError(error: any): Promise<never> {
    console.log(error)
    if (error && error.auxCode && error.msg) {
        const clickToCopyText = i18n.global.t('preview.error.clickToCopy')
        const errorCodeText = i18n.global.t('preview.error.errorCode')
        const auxCodeHtml = `<span class="aux-code">${error.auxCode}</span><i class="iconfont icon-copy" style="cursor: pointer; margin-left: 4px; color: #409eff;" title="${clickToCopyText}" onclick="navigator.clipboard.writeText('${error.auxCode}').then(() => { this.style.color = '#67c23a'; setTimeout(() => { this.style.color = '#409eff'; }, 1000); })"></i>`
        error.msg = error.msg + "<br/>" + errorCodeText + "：" + auxCodeHtml
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
            throw new Error(i18n.global.t('preview.error.requestError'))
        }
        return response
    },
    (error: AxiosError) => {
        if (error.response && error.response.data) {
            const errorData: BizError = error.response.data as BizError
            return dealError(errorData)
        }
        return dealError(error)
    }
)

/**
 * POST 请求封装
 * @param url 请求地址
 * @param param 请求体，可选
 * @param config axios 配置，可选
 * @returns 响应数据
 */
async function post<T = any>(url: string, param: any = {}, config: AxiosRequestConfig = {}): Promise<T> {
    const res = await defaultRequest.post(url, param, config)
    return dealAxiosResult(res)
}

/**
 * GET 请求封装
 * @param url 请求地址
 * @param config axios 配置，可选
 * @returns 响应数据
 */
async function get<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const res = await defaultRequest.get(url, config)
    return dealAxiosResult(res)
}

/**
 * 处理响应结果
 * 提取响应数据，文件下载类型直接返回整个 response 对象
 *
 * @param res axios 响应对象
 * @returns 处理后的响应数据
 */
function dealAxiosResult<T = any>(res: AxiosResponse): Promise<T> {
    let realRes: any = res.data ? res.data : res
    if ((res.request as any)?.responseType === 'blob') {
        return Promise.resolve(res as unknown as T)
    }
    return Promise.resolve(realRes as T)
}

export default {
    default: defaultRequest,
    ...defaultRequest,
    post,
    get
}
