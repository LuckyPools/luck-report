/**
 * 颜色格式转换工具函数
 */

/**
 * 将 RGB 转换为十六进制颜色值
 * 支持两种调用方式：
 * - rgbToHex("255,0,0") 字符串参数
 * - rgbToHex(255, 0, 0) 三个数字参数
 * @param r RGB 字符串或红色分量
 * @param g 绿色分量（当第一个参数为数字时需要）
 * @param b 蓝色分量（当第一个参数为数字时需要）
 * @returns 十六进制颜色值，如 "#ff0000"，转换失败返回 "#000000"
 */
export function rgbToHex(r: string | number, g?: number, b?: number): string {
    if (typeof r === 'string') {
        const parts = r.split(',');
        if (parts.length !== 3) {
            return '#000000';
        }
        const hex = parts.map(val => {
            const num = parseInt(val.trim(), 10);
            if (isNaN(num)) {
                return '00';
            }
            const hexVal = Math.min(255, Math.max(0, num)).toString(16);
            return hexVal.length === 1 ? '0' + hexVal : hexVal;
        });
        return '#' + hex.join('');
    }

    if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
        const toHex = (val: number) => {
            const num = Math.min(255, Math.max(0, parseInt(String(val), 10) || 0));
            const hex = num.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + [r, g, b].map(toHex).join('');
    }

    return '#000000';
}

/**
 * 将十六进制颜色值转换为 RGB 格式字符串
 * @param hex 十六进制颜色值，如 "#ff0000"
 * @returns RGB 格式字符串，如 "255,0,0"，转换失败返回 "0,0,0"
 */
export function hexToRgb(hex: string): string {
    if (!hex || typeof hex !== 'string') {
        return '0,0,0';
    }

    if (hex.includes(',')) {
        return hex;
    }

    if (!hex.startsWith('#')) {
        return '0,0,0';
    }

    const hexValue = hex.substring(1);
    if (hexValue.length !== 6 && hexValue.length !== 3) {
        return '0,0,0';
    }

    let r: number, g: number, b: number;
    if (hexValue.length === 3) {
        r = parseInt(hexValue[0] + hexValue[0], 16);
        g = parseInt(hexValue[1] + hexValue[1], 16);
        b = parseInt(hexValue[2] + hexValue[2], 16);
    } else {
        r = parseInt(hexValue.substring(0, 2), 16);
        g = parseInt(hexValue.substring(2, 4), 16);
        b = parseInt(hexValue.substring(4, 6), 16);
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return '0,0,0';
    }

    return `${r},${g},${b}`;
}
