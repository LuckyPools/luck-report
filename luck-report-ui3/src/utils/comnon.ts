import MessageBox from "@/components/messagebox/instance";
import {$t} from "@/locales";
import request from "@/utils/request";

/** 通用弹窗参数类型（与 element-ui 风格对齐） */
interface MessageBoxOptions {
    title?: string
    message?: string
    type?: 'alert' | 'confirm' | 'prompt'
    [key: string]: any
}

/** 抽象 MessageBox 模块，规避其 JS 入口未带类型问题 */
const MB = MessageBox as unknown as {
    alert(message: string, title?: string, options?: MessageBoxOptions): Promise<any>
    confirm(message: string, title?: string, options?: MessageBoxOptions): Promise<any>
}

/**
 * 提示
 * @param message 提示内容
 * @param options 弹窗附加选项
 * @returns 关闭后的 Promise
 */
export function showAlert(message: string, options?: MessageBoxOptions): Promise<any> {
    return MB.alert(message, $t('components.message.info'), options);
}

/**
 * 确认
 * @param message 确认内容
 * @param options 弹窗附加选项
 * @returns 用户选择结果的 Promise
 */
export function showConfirm(message: string, options?: MessageBoxOptions): Promise<any> {
    return MB.confirm(message, $t('components.message.info'), options);
}

/**
 * 判断当前设备是否为移动设备
 * @returns 如果是移动设备返回 true，否则返回 false
 */
export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Blob 下载文件
 * @param url 请求 URL
 * @param params 查询参数
 * @param defaultFilename 默认文件名
 * @returns 触发下载后的 Promise
 */
export async function downloadBlob(url: string, params: Record<string, any>, defaultFilename: string): Promise<void> {
    const queryString = buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response: any = await request.get(fullUrl, {
        responseType: 'blob'
    });

    const blob = response.data || response;
    const contentDisposition = response.headers?.['content-disposition'];
    const filename = extractFilename(contentDisposition, defaultFilename);

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}

/**
 * 构建查询字符串
 * @param params 参数对象
 * @returns 拼接好的查询字符串（不含问号）
 */
export function buildQueryString(params: Record<string, any> | null | undefined): string {
    if (!params || typeof params !== 'object') {
        return '';
    }

    const pairs: string[] = [];
    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
            pairs.push(key + '=' + params[key]);
        }
    }

    return pairs.join('&');
}

/**
 * 从 Content-Disposition 头中提取文件名
 * 优先解析 RFC 5987 标准的 filename* 参数，兼容中文文件名
 * @param contentDisposition Content-Disposition 头的值
 * @param defaultName 默认文件名
 * @returns 解析出的文件名
 */
function extractFilename(contentDisposition: string | undefined, defaultName: string): string {
    if (!contentDisposition) return defaultName;

    const starMatch = /filename\*\s*=\s*UTF-8''(.+?)(?:;|$)/i.exec(contentDisposition);
    if (starMatch) {
        try { return decodeURIComponent(starMatch[1]); } catch (e) {}
    }

    const match = /filename\s*=\s*["']?([^"';\n]+)["']?/i.exec(contentDisposition);
    if (match) {
        const name = match[1].trim().replace(/['"]/g, '');
        try { return decodeURIComponent(name); } catch (e) { return name; }
    }
    return defaultName;
}
