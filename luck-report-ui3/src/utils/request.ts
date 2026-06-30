import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import {i18n} from "@/locales";
import { getRequestToken, TOKEN_HEADER } from '@/utils/token'
import { getApiBaseURL } from '@/utils/api-base'

/** 默认实例的 axios 配置 */
const defaultRequest: AxiosInstance = axios.create({
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
    config => {
        // 动态获取 baseURL，支持 lib 模式运行时覆盖
        config.baseURL = getApiBaseURL()
        const token = getRequestToken()
        if (token && config.headers) {
            config.headers[TOKEN_HEADER] = token
        }
        return config
    },
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
        // 401 错误处理：直接显示错误信息
        if (error.response?.status === 401) {
            console.warn('[LR-Token] 401, token 无效或已过期')
        }
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
 * PUT 请求封装
 * @param url 请求地址
 * @param param 请求体，可选
 * @param config axios 配置，可选
 * @returns 响应数据
 */
async function put<T = any>(url: string, param: any = {}, config: AxiosRequestConfig = {}): Promise<T> {
    const res = await defaultRequest.put(url, param, config)
    return dealAxiosResult(res)
}

/**
 * DELETE 请求封装（前端习惯简写为 del）
 * @param url 请求地址
 * @param config axios 配置，可选
 * @returns 响应数据
 */
async function del<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const res = await defaultRequest.delete(url, config)
    return dealAxiosResult(res)
}

/**
 * 处理响应结果
 * 提取响应数据：文件下载（responseType=blob）返回 res.data（Blob），其余自动解包 ResultVO。
 * 如果响应是统一的 ResultVO 格式（包含 code 和 data 字段），则自动解包到内层 data。
 * 这样业务侧可以直接拿到 `resultvo.data`，不再需要手动 `res.data.data`。
 *
 * @param res axios 响应对象
 * @returns 处理后的响应数据
 */
function dealAxiosResult<T = any>(res: AxiosResponse): Promise<T> {
    let realRes: any = res.data ? res.data : res
    if ((res.request as any)?.responseType === 'blob') {
        return Promise.resolve(res.data as unknown as T)
    }
    // 自动解包后端统一封装的 ResultVO 格式：{ code, message, data }
    // code=0 表示成功，非 0 表示业务失败，需走异常处理（携带 auxCode 供前端展示）
    if (realRes && typeof realRes === 'object' && 'code' in realRes && 'data' in realRes) {
        if (realRes.code !== 0) {
            // 后端业务失败：HTTP 200 但 code 非 0，构造错误对象并 reject
            // 字段映射：后端 message → 前端 msg；auxCode 嵌套在 data.auxCode 中
            const dataObj = (realRes.data && typeof realRes.data === 'object') ? realRes.data : {}
            const err: BizError = {
                auxCode: dataObj.auxCode,
                msg: realRes.message,
                ...realRes
            }
            return dealError(err)
        }
        realRes = realRes.data
    }
    return Promise.resolve(realRes as T)
}

export default {
    default: defaultRequest,
    ...defaultRequest,
    post,
    get,
    put,
    del
}
