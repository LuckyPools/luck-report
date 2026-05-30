import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useI18n } from 'vue-i18n'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX || '/api',
  timeout: 60000
})

/**
 * 默认异常处理函数
 * 处理请求异常，支持异常编码显示和复制功能
 *
 * @param error 错误对象，包含 response、auxCode、msg 等信息
 * @returns {Promise<never>} 返回 rejected Promise
 */
function dealError(error: any): Promise<never> {
  console.log(error)
  if (error && error.auxCode && error.msg) {
    try {
      const { t } = useI18n()
      const clickToCopyText = t('preview.error.clickToCopy')
      const errorCodeText = t('preview.error.errorCode')
      const auxCodeHtml = `<span class="aux-code">${error.auxCode}</span><i class="iconfont icon-copy" style="cursor: pointer; margin-left: 4px; color: #409eff;" title="${clickToCopyText}" onclick="navigator.clipboard.writeText('${error.auxCode}').then(() => { this.style.color = '#67c23a'; setTimeout(() => { this.style.color = '#409eff'; }, 1000); })"></i>`
      error.msg = error.msg + "<br/>" + errorCodeText + "：" + auxCodeHtml
    } catch {
      console.warn('i18n not initialized')
    }
  }
  return Promise.reject(error)
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: any) => dealError(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status !== 200) {
      dealError({ response: response })
      throw new Error('请求异常')
    }
    return response
  },
  (error: any) => {
    if (error.response && error.response.data) {
      const errorData = error.response.data
      return dealError(errorData)
    }
    return dealError(error)
  }
)

/**
 * 处理响应结果
 * 提取响应数据，文件下载类型直接返回整个response对象
 *
 * @param res axios响应对象
 * @returns {Promise<unknown>} 返回处理后的响应数据
 */
function dealAxiosResult(res: AxiosResponse): Promise<unknown> {
  const realRes = res.data ? res.data : res
  if (res.request?.responseType === 'blob') {
    return Promise.resolve(res)
  }
  return Promise.resolve(realRes)
}

/**
 * POST请求方法
 *
 * @param url 请求地址
 * @param param 请求参数，默认为空对象
 * @param config axios配置项，默认为空对象
 * @returns {Promise<unknown>} 返回处理后的响应数据
 */
async function post(url: string, param: any = {}, config: AxiosRequestConfig = {}): Promise<unknown> {
  const res = await request.post(url, param, config)
  return dealAxiosResult(res)
}

/**
 * GET请求方法
 *
 * @param url 请求地址
 * @param config axios配置项，默认为空对象
 * @returns {Promise<unknown>} 返回处理后的响应数据
 */
async function get(url: string, config: AxiosRequestConfig = {}): Promise<unknown> {
  const res = await request.get(url, config)
  return dealAxiosResult(res)
}

export default {
  default: request,
  ...request,
  post,
  get
}
