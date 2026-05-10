import MessageBox from "@/components/messagebox/instance";
import {$t} from "@/locales";

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
