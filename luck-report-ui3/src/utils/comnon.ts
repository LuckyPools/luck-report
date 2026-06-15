import MessageBox from "@/utils/messagebox";
import {t, i18n} from "@/locales";
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
    return MB.alert(message, i18n.global.t('components.message.info'), options);
}

/**
 * 确认
 * @param message 确认内容
 * @param options 弹窗附加选项
 * @returns 用户选择结果的 Promise
 */
export function showConfirm(message: string, options?: MessageBoxOptions): Promise<any> {
    return MB.confirm(message, i18n.global.t('components.message.info'), options);
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

/**
 * 防抖函数：把回调挂到 window[name] 计时器上，重复触发会清掉旧计时器
 * @param func 实际要执行的回调
 * @param wait 等待毫秒数
 * @param name 计时器挂到 window 上的 key（用于 clearTimeout）
 */
export function debounce(func: () => void, wait: number, name: string): void {
    if ((window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>)[name]) {
        clearTimeout(
            (window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>)[name]
        );
    }
    (window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>)[name] =
        setTimeout(() => {
            func();
            (window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>)[name] =
                undefined;
        }, wait);
}

/**
 * 判断 value 是否在 validList 中
 * @param value 待判断值
 * @param validList 候选值列表
 * @returns 命中返回 true，否则 false
 */
export function oneOf(value: unknown, validList: unknown[]): boolean {
    for (let i = 0; i < validList.length; i++) {
        if (value === validList[i]) {
            return true;
        }
    }
    return false;
}

/**
 * 判断一个节点是否为 VNode（Vue 内部 __v_isVNode 标志）
 * @param node 任意值
 * @returns 是 VNode 返回 true
 */
export function isVNode(node: unknown): boolean {
    return (
        node !== null &&
        typeof node === 'object' &&
        Object.prototype.hasOwnProperty.call(node, 'componentOptions')
    );
}

/**
 * 类型判断
 * @param obj 任意值
 * @returns 类型字符串（array / object / string / number ...）
 */
function typeOf(obj: unknown): string {
    const toString = Object.prototype.toString;
    const map: Record<string, string> = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
    };
    return map[toString.call(obj)];
}

/**
 * 深拷贝（支持循环引用）
 * - 用 WeakMap 记录已拷贝对象，避免循环引用爆栈
 * - 普通对象 / 数组按 enumerable key 递归
 * @param data 任意可序列化数据
 * @param hash 内部缓存（外部无需传入）
 * @returns 与 data 结构一致但引用全新的副本
 */
export function deepCopy<T = unknown>(data: T, hash: WeakMap<object, unknown> = new WeakMap()): T {
    const t = typeOf(data);
    let o: unknown;

    if (t === 'array') {
        o = [];
    } else if (t === 'object') {
        o = {};
    } else {
        return data;
    }

    if (data && typeof data === 'object' && hash.has(data as object)) {
        return hash.get(data as object) as T;
    }

    if (data && typeof data === 'object') {
        hash.set(data as object, o);
    }

    if (t === 'array' && Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            (o as unknown[]).push(deepCopy(data[i], hash));
        }
    } else if (t === 'object' && data && typeof data === 'object') {
        for (const i in data) {
            if (Object.prototype.hasOwnProperty.call(data, i)) {
                (o as Record<string, unknown>)[i] = deepCopy(
                    (data as Record<string, unknown>)[i],
                    hash
                );
            }
        }
    }
    return o as T;
}
