import MessageBox from "@/components/messagebox/instance";
import {$t} from "@/locales";
import request from "@/utils/request";

/**
 * 提示
 * @param message
 * @param options
 * @returns {Promise<unknown>}
 */
export function showAlert(message, options){
    return MessageBox.alert(message,$t('components.message.info'),options);
}

/**
 * 确认
 * @param message
 * @param options
 * @returns {Promise<unknown>}
 */
export function showConfirm(message, options){
    return MessageBox.confirm(message,$t('components.message.info'),options);
}

/**
 * 判断当前设备是否为移动设备
 * @returns {boolean} 如果是移动设备返回 true，否则返回 false
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Blob 下载文件
 * @param {string} url 请求 URL
 * @param {Object} params 查询参数
 * @param {string} defaultFilename 默认文件名
 * @returns {Promise<void>}
 */
export async function downloadBlob(url, params, defaultFilename) {
    const queryString = buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await request.get(fullUrl, {
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
 * @param {Object} params 参数对象
 * @returns {string} 查询字符串
 */
export function buildQueryString(params) {
    if (!params || typeof params !== 'object') {
        return '';
    }

    const pairs = [];
    for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
            pairs.push(key + '=' + params[key]);
        }
    }

    return pairs.join('&');
}

/**
 * 从 Content-Disposition 头中提取文件名
 * 优先解析 RFC 5987 标准的 filename* 参数，兼容中文文件名
 * @param {string} contentDisposition Content-Disposition 头的值
 * @param {string} defaultName 默认文件名
 * @returns {string} 文件名
 */
function extractFilename(contentDisposition, defaultName) {
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
